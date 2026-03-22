import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { eventBus } from "./services/eventBus";
import { logger } from "./utils/logger";

const server = app.listen(env.port, "0.0.0.0", () => {
  logger.info("Server started", { service: "server", port: env.port, nodeEnv: env.nodeEnv });
});

eventBus.on("order.created", (payload: unknown) => {
  logger.info("event.order.created", { service: "events", payload });
});

eventBus.on("payment.completed", (payload: unknown) => {
  logger.info("event.payment.completed", { service: "events", payload });
});

eventBus.on("order.status.updated", (payload: unknown) => {
  logger.info("event.order.status.updated", { service: "events", payload });
});

let shuttingDown = false;

const shutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("shutdown.start", { service: "server", signal });
  const forceKill = setTimeout(() => {
    logger.error("shutdown.timeout", { service: "server", ms: env.shutdownTimeoutMs });
    process.exit(1);
  }, env.shutdownTimeoutMs);

  server.close(() => {
    clearTimeout(forceKill);
    prisma
      .$disconnect()
      .then(() => {
        logger.info("shutdown.complete", { service: "server" });
        process.exit(0);
      })
      .catch((err) => {
        logger.error("shutdown.prisma_disconnect_failed", { error: String(err) });
        process.exit(1);
      });
  });
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (reason: unknown) => {
  logger.error("process.unhandledRejection", { reason: String(reason) });
});

process.on("uncaughtException", (err: Error) => {
  logger.error("process.uncaughtException", { message: err.message, stack: err.stack });
  process.exit(1);
});
