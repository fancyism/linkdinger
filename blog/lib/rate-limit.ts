import { fetchUpstashJson, getUpstashRestConfig } from "./upstash";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  storage: "memory" | "upstash";
}

const store = globalThis as typeof globalThis & {
  __linkdingerRateLimitStore?: Map<string, RateLimitEntry>;
};

const rateLimitStore =
  store.__linkdingerRateLimitStore ?? new Map<string, RateLimitEntry>();

if (!store.__linkdingerRateLimitStore) {
  store.__linkdingerRateLimitStore = rateLimitStore;
}

function applyInMemorySlidingRateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): RateLimitResult {
  const now = options.now ?? Date.now();
  const current = rateLimitStore.get(options.key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(options.key, {
      count: 1,
      resetAt: now + options.windowMs,
    });

    return {
      allowed: true,
      remaining: Math.max(options.limit - 1, 0),
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
      storage: "memory",
    };
  }

  current.count += 1;
  rateLimitStore.set(options.key, current);

  return {
    allowed: current.count <= options.limit,
    remaining: Math.max(options.limit - current.count, 0),
    retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
    storage: "memory",
  };
}

async function applyUpstashRateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult | null> {
  const windowSeconds = Math.max(Math.ceil(options.windowMs / 1000), 1);

  const results = await fetchUpstashJson<Array<{ result?: string | number | null }>>(
    "/pipeline",
    {
      method: "POST",
      body: [
        ["INCR", options.key],
        ["EXPIRE", options.key, `${windowSeconds}`, "NX"],
        ["TTL", options.key],
      ],
    },
  );

  if (!results || results.length < 3) {
    return null;
  }

  const count = Number(results[0]?.result ?? 0);
  const ttl = Number(results[2]?.result ?? windowSeconds);
  const retryAfterSeconds = ttl > 0 ? ttl : windowSeconds;

  return {
    allowed: count <= options.limit,
    remaining: Math.max(options.limit - count, 0),
    retryAfterSeconds,
    storage: "upstash",
  };
}

export async function applySlidingRateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): Promise<RateLimitResult> {
  const { url, token } = getUpstashRestConfig();

  if (url && token) {
    const upstashResult = await applyUpstashRateLimit(options);
    if (upstashResult) {
      return upstashResult;
    }
  }

  return applyInMemorySlidingRateLimit(options);
}
