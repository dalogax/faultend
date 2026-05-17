const requestCounts = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 20;

function rateLimit(req, res, next) {
  const key = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  const record = requestCounts.get(key);
  
  if (!record || now - record.windowStart > WINDOW_MS) {
    requestCounts.set(key, {
      windowStart: now,
      count: 1
    });
    return next();
  }
  
  if (record.count >= MAX_REQUESTS) {
    res.setHeader('Retry-After', Math.ceil((record.windowStart + WINDOW_MS - now) / 1000));
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.'
    });
  }
  
  record.count++;
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now - record.windowStart > WINDOW_MS) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);

module.exports = { rateLimit };
