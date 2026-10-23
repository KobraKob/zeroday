-- Move large source snapshots out of PostgreSQL rows and into private Supabase Storage.
-- Existing raw_content values remain readable until the migration script uploads and verifies them.

ALTER TABLE public.source_snapshots
  ALTER COLUMN raw_content DROP NOT NULL;

ALTER TABLE public.source_snapshots
  ADD COLUMN IF NOT EXISTS storage_bucket VARCHAR(128) NOT NULL DEFAULT 'snapshots',
  ADD COLUMN IF NOT EXISTS object_key TEXT,
  ADD COLUMN IF NOT EXISTS content_type VARCHAR(128),
  ADD COLUMN IF NOT EXISTS byte_size INTEGER;

ALTER TABLE public.source_snapshots
  DROP CONSTRAINT IF EXISTS source_snapshots_content_location_chk;

ALTER TABLE public.source_snapshots
  ADD CONSTRAINT source_snapshots_content_location_chk
  CHECK (raw_content IS NOT NULL OR object_key IS NOT NULL);

ALTER TABLE public.signals
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS source_id VARCHAR(128) REFERENCES public.sources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS demo BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS signals_source_idx ON public.signals(source_id);
CREATE INDEX IF NOT EXISTS source_snapshots_object_key_idx ON public.source_snapshots(storage_bucket, object_key);

-- Keep source material private. Only trusted server-side services should read/write these objects.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'snapshots',
  'snapshots',
  FALSE,
  NULL,
  ARRAY['text/plain', 'text/html', 'application/pdf', 'application/json', 'application/octet-stream']::TEXT[]
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = FALSE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "ZeroDay server manages source snapshots" ON storage.objects;

CREATE POLICY "ZeroDay server manages source snapshots"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'snapshots')
  WITH CHECK (bucket_id = 'snapshots');

COMMENT ON COLUMN public.source_snapshots.raw_content IS
  'Legacy/local fallback only. Production snapshots store their content in private Supabase Storage and set object_key.';
COMMENT ON COLUMN public.source_snapshots.object_key IS
  'Object path within storage_bucket. Content is fetched server-side; never expose service credentials to clients.';
COMMENT ON COLUMN public.source_snapshots.storage_bucket IS
  'Supabase Storage bucket containing object_key. The production bucket is private.';
