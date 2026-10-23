import crypto from "crypto";

export const USER_AGENT = "ZeroDay-Bot/1.0 (+https://zeroday.in/bot; contact@zeroday.in)";

// Gated domains strictly prohibited from scraping
const FORBIDDEN_DOMAINS = [
  "linkedin.com",
  "www.linkedin.com",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "glassdoor.com",
  "glassdoor.co.in",
  "naukri.com",
];

// Per-domain rate limit tracking (minimum 1000ms between calls to same host)
const domainLastRequestMap = new Map<string, number>();
const MIN_REQUEST_DELAY_MS = 1000;

// Robots.txt in-memory cache
const robotsCache = new Map<string, { disallowedPrefixes: string[]; expiresAt: number }>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isForbiddenUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();
    return FORBIDDEN_DOMAINS.some((forbidden) => host === forbidden || host.endsWith(`.${forbidden}`));
  } catch {
    return true;
  }
}

async function checkRobotsAllowed(url: URL): Promise<boolean> {
  const origin = url.origin;
  const now = Date.now();

  let robots = robotsCache.get(origin);
  if (!robots || robots.expiresAt < now) {
    try {
      const robotsUrl = `${origin}/robots.txt`;
      const res = await fetch(robotsUrl, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        const text = await res.text();
        const lines = text.split("\n");
        const disallowed: string[] = [];
        let appliesToUs = true;

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.toLowerCase().startsWith("user-agent:")) {
            const agent = trimmed.slice(11).trim().toLowerCase();
            appliesToUs = agent === "*" || agent.includes("zeroday");
          } else if (appliesToUs && trimmed.toLowerCase().startsWith("disallow:")) {
            const pathPrefix = trimmed.slice(9).trim();
            if (pathPrefix) disallowed.push(pathPrefix);
          }
        }

        robots = { disallowedPrefixes: disallowed, expiresAt: now + 3600000 };
      } else {
        robots = { disallowedPrefixes: [], expiresAt: now + 3600000 };
      }
    } catch {
      robots = { disallowedPrefixes: [], expiresAt: now + 1800000 };
    }
    robotsCache.set(origin, robots);
  }

  // Check if current path matches any disallowed prefix
  const pathname = url.pathname;
  for (const prefix of robots.disallowedPrefixes) {
    if (prefix && pathname.startsWith(prefix)) {
      return false;
    }
  }

  return true;
}

async function throttleDomain(hostname: string): Promise<void> {
  const lastTime = domainLastRequestMap.get(hostname) || 0;
  const elapsed = Date.now() - lastTime;
  if (elapsed < MIN_REQUEST_DELAY_MS) {
    await sleep(MIN_REQUEST_DELAY_MS - elapsed);
  }
  domainLastRequestMap.set(hostname, Date.now());
}

export interface PoliteFetchOptions {
  method?: "GET" | "HEAD";
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
}

export interface PoliteFetchResult {
  ok: boolean;
  status: number;
  statusText: string;
  url: string;
  content?: string;
  contentHash?: string;
  error?: string;
}

/**
 * Polite HTTP client with robots.txt check, domain rate limiting, exponential backoff, and user-agent contact.
 */
export async function politeFetch(
  urlString: string,
  options: PoliteFetchOptions = {}
): Promise<PoliteFetchResult> {
  const { method = "GET", timeoutMs = 8000, retries = 3, backoffMs = 1000 } = options;

  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch (err: any) {
    return { ok: false, status: 0, statusText: "Invalid URL", url: urlString, error: err.message };
  }

  // 1. Strict prohibition of gated sites (LinkedIn, etc.)
  if (isForbiddenUrl(urlString)) {
    return {
      ok: false,
      status: 403,
      statusText: "Forbidden: Gated site scraping prohibited by policy",
      url: urlString,
      error: "Gated platform",
    };
  }

  // 2. Robots.txt compliance
  const allowed = await checkRobotsAllowed(parsed);
  if (!allowed) {
    return {
      ok: false,
      status: 403,
      statusText: "Forbidden by robots.txt",
      url: urlString,
      error: "Robots.txt Disallowed",
    };
  }

  // 3. Retry loop with exponential backoff
  let attempt = 0;
  let lastError: any = null;

  while (attempt < retries) {
    attempt++;
    try {
      // Respect per-domain rate limit
      await throttleDomain(parsed.hostname);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(urlString, {
        method,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8",
        },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.ok || method === "HEAD") {
        let content: string | undefined = undefined;
        let contentHash: string | undefined = undefined;

        if (method === "GET") {
          content = await response.text();
          contentHash = crypto.createHash("sha256").update(content).digest("hex");
        }

        return {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          url: urlString,
          content,
          contentHash,
        };
      }

      // If rate limited or server error, wait and retry
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        const wait = backoffMs * Math.pow(2, attempt - 1);
        await sleep(wait);
        continue;
      }

      return {
        ok: false,
        status: response.status,
        statusText: response.statusText,
        url: urlString,
      };
    } catch (err: any) {
      lastError = err;
      if (attempt < retries) {
        const wait = backoffMs * Math.pow(2, attempt - 1);
        await sleep(wait);
      }
    }
  }

  return {
    ok: false,
    status: 0,
    statusText: "Network Timeout / Error",
    url: urlString,
    error: lastError?.message || "Unknown error",
  };
}
