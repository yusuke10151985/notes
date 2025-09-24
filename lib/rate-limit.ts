// Extremely simple in-memory rate limit (per IP per minute)
// For production, replace with Upstash Ratelimit or KV.
const buckets = new Map<string, { count: number; reset: number }>();

export function checkRate(ip: string, limit = 30) {
  const now = Date.now();
  const key = ip || 'unknown';
  const cur = buckets.get(key);
  if (!cur || now > cur.reset) {
    buckets.set(key, { count: 1, reset: now + 60_000 });
    return { ok: true, remaining: limit - 1 };
  }
  if (cur.count >= limit) return { ok: false, remaining: 0 };
  cur.count += 1; return { ok: true, remaining: limit - cur.count };
}

