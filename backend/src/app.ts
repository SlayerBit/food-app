import cors from "cors";
import express from "express";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { fail, ok } from "./utils/apiResponse";
import { requestIdMiddleware } from "./middleware/requestIdMiddleware";
import { requestLoggerMiddleware } from "./middleware/requestLoggerMiddleware";
import { rateLimitMiddleware } from "./middleware/rateLimitMiddleware";
import { prisma } from "./config/prisma";
import { metricsService } from "./services/metricsService";
import { cacheService } from "./services/cacheService";
import { jobQueueService } from "./services/jobQueueService";
import { env } from "./config/env";

const app = express();

if (env.trustProxy) {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin: env.corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
app.use(rateLimitMiddleware);
app.use(express.json({ limit: env.jsonBodyLimit }));

app.get("/health", (req, res) => {
  const requestId = req.headers["x-request-id"] as string | undefined;
  res.status(200).json(ok({ status: "ok" }, requestId));
});

app.get("/ready", async (req, res) => {
  const requestId = req.headers["x-request-id"] as string | undefined;
  const checks: Record<string, "up" | "down"> = {
    database: "down",
    cache: "down",
    queue: "down",
  };
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "up";
  } catch {
    checks.database = "down";
  }
  try {
    checks.cache = cacheService.ping() ? "up" : "down";
  } catch {
    checks.cache = "down";
  }
  try {
    const qh = jobQueueService.health();
    checks.queue = qh.ok ? "up" : "down";
  } catch {
    checks.queue = "down";
  }

  const dbOk = checks.database === "up";
  if (!dbOk) {
    res.status(503).json(fail("Database unavailable", "NOT_READY", requestId, checks));
    return;
  }
  res.status(200).json(
    ok(
      {
        status: "ready",
        checks,
      },
      requestId
    )
  );
});

app.get("/metrics", (req, res) => {
  const requestId = req.headers["x-request-id"] as string | undefined;
  res.status(200).json(
    ok(
      {
        ...metricsService.snapshot(),
        queue: jobQueueService.getStats(),
      },
      requestId
    )
  );
});

app.use("/", routes);
app.use((req, res) =>
  res
    .status(404)
    .json(fail("Route not found", "NOT_FOUND", req.headers["x-request-id"] as string | undefined))
);
app.use(errorHandler);

export default app;
