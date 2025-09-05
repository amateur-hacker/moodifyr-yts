import { RedisStore } from "@hono-rate-limiter/redis";
import { kv } from "@vercel/kv";
import { type RateLimitInfo, rateLimiter } from "hono-rate-limiter";

const rateLimit = ({ windowMs = 60_000, limit = 60 } = {}) => {
  return rateLimiter({
    windowMs,
    limit,
    keyGenerator: (c) => c.req.header("x-forwarded-for") ?? "",
    store: new RedisStore<{
      Variables: {
        rateLimit: RateLimitInfo;
      };
    }>({
      client: kv,
    }),
    handler: (c) => {
      // const rateLimitInfo = c.get("rateLimit");
      return c.json(
        {
          // message: "Rate limit exceeded. Please try again later.",
          message: "Too many requests. Please try again later.",
          success: false,
          statusCode: 429,
          // rateLimit: rateLimitInfo,
        },
        429,
      );
    },
  });
};

export { rateLimit };
