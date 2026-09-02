const buckets = new Map();

export function rateLimit(key, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  if (buckets.size > 1000) {
    for (const [bucketKey, value] of buckets) {
      if (value.resetAt < now) buckets.delete(bucketKey);
    }
  }
  const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

  if (bucket.resetAt < now) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(limit - bucket.count, 0),
    resetAt: bucket.resetAt
  };
}
