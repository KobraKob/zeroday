import { getDb, schema } from "../db/client";

export interface EventRecord {
  id: string;
  type: "new_gcc" | "claim_change" | "policy_change" | "staleness_downgrade" | "source_dead";
  entity: string;
  summary: string;
  created_at: string;
}

const SEED_EVENTS: EventRecord[] = [
  {
    id: "evt-seed-1",
    type: "new_gcc",
    entity: "Google Bangalore R&D Centre",
    summary: "MCA statutory filing verified for Google India Private Limited with registered office at RMZ Infinity, Old Madras Road.",
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
  },
  {
    id: "evt-seed-2",
    type: "claim_change",
    entity: "NVIDIA Pune Design Centre",
    summary: "High-performance computing lab expansion verified: 500,000 sq ft registered commercial lease deed.",
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    id: "evt-seed-3",
    type: "policy_change",
    entity: "Karnataka GCC Policy 2024-2029",
    summary: "Gazetted policy update: statutory 25% capex subsidy and complete stamp duty waiver published.",
    created_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
  },
  {
    id: "evt-seed-4",
    type: "staleness_downgrade",
    entity: "Bosch Bengaluru (headcount)",
    summary: "Claim age exceeded 24-month staleness threshold without updated audited filing. Confidence adjusted A -> B.",
    created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
  },
  {
    id: "evt-seed-5",
    type: "source_dead",
    entity: "Hyderabad IT Corridor Commercial Bulletin 2023",
    summary: "Primary URL returned HTTP 404 Not Found during scheduled verification. Confidence downgraded on linked citations.",
    created_at: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
  },
];

let cachedEvents = [...SEED_EVENTS];

export const eventsRepo = {
  getAll(): EventRecord[] {
    return [...cachedEvents].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  getRecent(limit: number = 20): EventRecord[] {
    return this.getAll().slice(0, limit);
  },

  createEvent(
    type: EventRecord["type"],
    entity: string,
    summary: string,
    createdAt: string = new Date().toISOString()
  ): EventRecord {
    const record: EventRecord = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      entity,
      summary,
      created_at: createdAt,
    };
    cachedEvents.unshift(record);

    const database = getDb();
    if (database) {
      try {
        database.insert(schema.events).values({
          id: record.id,
          type: record.type,
          entity: record.entity,
          summary: record.summary,
          created_at: new Date(record.created_at),
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    return record;
  },
};
