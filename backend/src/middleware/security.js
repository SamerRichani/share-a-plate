// Security protections added to every response.

// 1) Security headers: instructions that tell the browser to be stricter.
function securityHeaders(req, res, next) {
  // Only load scripts, styles, images, etc. from our own site. This blocks
  // most cross-site scripting (XSS): injected <script> tags from elsewhere won't run.
  res.set('Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
  // Don't let other websites show our pages inside an <iframe> (stops "clickjacking").
  res.set('X-Frame-Options', 'DENY');
  // Don't let the browser guess file types (a text file can't be run as a script).
  res.set('X-Content-Type-Options', 'nosniff');
  // Don't send our full URLs to other websites.
  res.set('Referrer-Policy', 'no-referrer');
  // Our site never needs the camera, microphone or location.
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // On HTTPS: always use HTTPS for the next 6 months.
  if (req.secure) res.set('Strict-Transport-Security', 'max-age=15552000');
  next();
}

// 2) Rate limiting: each visitor (IP address) may only make `max` requests
// per time window. This slows down password guessing (brute force) and
// people trying to flood the server with requests.
function rateLimit({ windowMinutes, max, message }) {
  const windowMs = windowMinutes * 60 * 1000;
  const visitors = new Map(); // ip -> { count, resetAt }

  return function limitRequests(req, res, next) {
    const now = Date.now();
    let visitor = visitors.get(req.ip);

    if (!visitor || visitor.resetAt <= now) {
      visitor = { count: 0, resetAt: now + windowMs };
      visitors.set(req.ip, visitor);
    }
    visitor.count += 1;

    if (visitor.count > max) {
      res.set('Retry-After', String(Math.ceil((visitor.resetAt - now) / 1000)));
      return res.status(429).json({ error: message });
    }

    // Forget old visitors now and then so memory doesn't grow forever.
    if (visitors.size > 10000) {
      for (const [ip, entry] of visitors) if (entry.resetAt <= now) visitors.delete(ip);
    }
    next();
  };
}

module.exports = { securityHeaders, rateLimit };
