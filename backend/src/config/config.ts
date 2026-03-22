import { env } from "./env";

export const config = {
  features: {
    enablePayments: env.enablePayments,
    enableOrders: env.enableOrders,
  },
  resilience: {
    requestTimeoutMs: env.requestTimeoutMs,
    retryCount: env.resilienceRetryCount,
    circuitBreakerFailureThreshold: env.circuitBreakerFailureThreshold,
    circuitBreakerResetMs: env.circuitBreakerResetMs,
  },
  rateLimit: {
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
  },
  payment: {
    mockLatencyMs: env.paymentMockLatencyMs,
  },
  queue: {
    delayedStatusCheckMs: env.queueDelayedStatusCheckMs,
    jobMaxRetries: env.queueJobMaxRetries,
  },
  cache: {
    restaurantListTtlMs: env.cacheRestaurantListTtlMs,
    menuTtlMs: env.cacheMenuTtlMs,
  },
};
