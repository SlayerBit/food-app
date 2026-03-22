import dotenv from "dotenv";
import { AppError } from "../utils/AppError";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

const num = (v: string | undefined, fallback: number, name: string, min: number, max: number) => {
  const n = Number(v ?? fallback);
  if (Number.isNaN(n) || n < min || n > max) {
    throw new AppError(`Invalid config ${name}: must be between ${min} and ${max}`, 500, "CONFIG_ERROR");
  }
  return n;
};

/** Comma-separated browser origins for CORS (e.g. https://app.example.com). Defaults preserve local dev. */
function parseCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) {
    return ["http://localhost:5173", "http://127.0.0.1:5173"];
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export const env = {
  port: num(process.env.PORT || undefined, 5001, "PORT", 1, 65535),
  jwtSecret: process.env.JWT_SECRET || "",
  databaseUrl: process.env.DATABASE_URL || "",
  enablePayments: (process.env.ENABLE_PAYMENTS || "true").toLowerCase() === "true",
  enableOrders: (process.env.ENABLE_ORDERS || "true").toLowerCase() === "true",
  requestTimeoutMs: num(process.env.REQUEST_TIMEOUT_MS, 4000, "REQUEST_TIMEOUT_MS", 500, 120000),
  rateLimitWindowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 60000, "RATE_LIMIT_WINDOW_MS", 1000, 3600000),
  rateLimitMax: num(process.env.RATE_LIMIT_MAX, 15, "RATE_LIMIT_MAX", 1, 10000),
  resilienceRetryCount: num(process.env.RESILIENCE_RETRY_COUNT, 2, "RESILIENCE_RETRY_COUNT", 0, 10),
  circuitBreakerFailureThreshold: num(
    process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD,
    3,
    "CIRCUIT_BREAKER_FAILURE_THRESHOLD",
    1,
    100
  ),
  circuitBreakerResetMs: num(process.env.CIRCUIT_BREAKER_RESET_MS, 15000, "CIRCUIT_BREAKER_RESET_MS", 1000, 600000),
  paymentMockLatencyMs: num(process.env.PAYMENT_MOCK_LATENCY_MS, 50, "PAYMENT_MOCK_LATENCY_MS", 0, 30000),
  queueDelayedStatusCheckMs: num(
    process.env.QUEUE_DELAYED_STATUS_CHECK_MS,
    5000,
    "QUEUE_DELAYED_STATUS_CHECK_MS",
    0,
    86400000
  ),
  queueJobMaxRetries: num(process.env.QUEUE_JOB_MAX_RETRIES, 3, "QUEUE_JOB_MAX_RETRIES", 0, 20),
  cacheRestaurantListTtlMs: num(process.env.CACHE_RESTAURANT_LIST_TTL_MS, 15000, "CACHE_RESTAURANT_LIST_TTL_MS", 0, 3600000),
  cacheMenuTtlMs: num(process.env.CACHE_MENU_TTL_MS, 30000, "CACHE_MENU_TTL_MS", 0, 3600000),
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: isProd,
  corsOrigins: parseCorsOrigins(),
  /** Behind GKE / ingress: trust X-Forwarded-* for correct client IP (rate limit). */
  trustProxy: process.env.TRUST_PROXY === "true" || process.env.TRUST_PROXY === "1",
  jsonBodyLimit: process.env.JSON_BODY_LIMIT?.trim() || "100kb",
  shutdownTimeoutMs: num(process.env.SHUTDOWN_TIMEOUT_MS, 15000, "SHUTDOWN_TIMEOUT_MS", 1000, 120000),
  runMigrationsOnStartup: process.env.RUN_MIGRATIONS_ON_STARTUP === "true" || process.env.RUN_MIGRATIONS_ON_STARTUP === "1",
};

const required = ["JWT_SECRET", "DATABASE_URL"] as const;
for (const key of required) {
  if (!process.env[key]) {
    throw new AppError(`Missing required environment variable: ${key}`, 500, "CONFIG_ERROR");
  }
}

if (isProd && env.jwtSecret.length < 16) {
  throw new AppError("JWT_SECRET must be at least 16 characters in production", 500, "CONFIG_ERROR");
}
