import { RateLimiterMemory } from "rate-limiter-flexible";

const rateLimiter = new RateLimiterMemory({
  points: 20,
  duration: 600,
  blockDuration: 300
});

export async function checkRateLimit(ip) {
  try {
    await rateLimiter.consume(ip);
    return { allowed: true };
  } catch (e) {
    const secs = Math.round(e.msBeforeNext / 1000) || 300;
    return {
      allowed: false,
      retryAfter: secs,
      message: `Trop de requêtes. Réessayez dans ${Math.ceil(secs / 60)} minute(s).`,
    };
  }
}
