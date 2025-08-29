import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { rateLimit } from "@/lib/utils";

import type { Promisify, RateLimitInfo } from "hono-rate-limiter";
import yts from "yt-search";

import { errorHandler, notFound } from "@/middlewares";

const app = new Hono<{
  Variables: {
    rateLimit: RateLimitInfo;
    rateLimitStore: {
      get?: (key: string) => Promisify<RateLimitInfo | undefined>;
      resetKey: (key: string) => Promisify<void>;
    };
  };
}>({ strict: false }).basePath("/api/v1");

// Initialize middlewares
app.use("*", logger(), prettyJSON());

// Cors
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

// Rate Limit
app.use("*", rateLimit());

// Error Handler
app.onError((_err, c) => {
  const error = errorHandler(c);
  return error;
});

// Not Found Handler
app.notFound((c) => {
  const error = notFound(c);
  return error;
});

// Routes
app.get("/", (c) => {
  return c.text("Hello it's a yt-search API.");
});

app.get("/search", async (c) => {
  const query = c.req.query("q");
  const id = c.req.query("id");

  if (!query && !id) {
    return c.json(
      {
        message: "Provide either 'q' or 'id' parameter",
        success: false,
        statusCode: 422,
      },
      422,
    );
  }

  if (query && id) {
    return c.json(
      {
        message: "Provide either 'q' or 'id' parameter, but not both",
        success: false,
        statusCode: 422,
      },
      422,
    );
  }

  if (id) {
    const results = await yts({ videoId: id });
    if (!results || !results.videoId) {
      return c.json(
        { message: "Video not found", success: false, statusCode: 404 },
        404,
      );
    }

    return c.json({
      id: results.videoId,
      title: results.title,
      url: results.url,
      thumbnail: results.thumbnail,
      duration: {
        timestamp: results.duration.timestamp,
        seconds: results.duration.seconds,
      },
    });
  }

  const results = await yts(query as string);
  const filteredResults = results.videos.map((video) => ({
    id: video.videoId,
    title: video.title,
    url: video.url,
    thumbnail: video.thumbnail,
    duration: {
      timestamp: video.duration.timestamp,
      seconds: video.duration.seconds,
    },
  }));

  return c.json(filteredResults);
});

export { app };
