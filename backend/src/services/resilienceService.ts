import { AppError } from "../utils/AppError";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class CircuitBreaker {
  private failures = 0;
  private openUntil = 0;

  constructor(
    private readonly threshold: number,
    private readonly resetMs: number
  ) {}

  canExecute() {
    return Date.now() >= this.openUntil;
  }

  success() {
    this.failures = 0;
  }

  fail() {
    this.failures += 1;
    if (this.failures >= this.threshold) {
      this.openUntil = Date.now() + this.resetMs;
      this.failures = 0;
    }
  }
}

export const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new AppError("Request timed out", 504, "TIMEOUT")), timeoutMs)
  );
  return Promise.race([promise, timeout]);
};

export const withRetry = async <T>(fn: () => Promise<T>, retries = 2): Promise<T> => {
  let lastError: unknown;
  for (let i = 0; i <= retries; i += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < retries) await sleep(100 * (i + 1));
    }
  }
  throw lastError;
};

const breakers = new Map<string, CircuitBreaker>();

/** Reusable: timeout + retry with exponential backoff between attempts (via withRetry). */
export const withTimeoutRetry = async <T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  retries: number
): Promise<T> => {
  return withRetry(() => withTimeout(fn(), timeoutMs), retries);
};

export const withCircuitBreaker = async <T>(
  key: string,
  fn: () => Promise<T>,
  threshold = 3,
  resetMs = 15000
): Promise<T> => {
  const breaker = breakers.get(key) ?? new CircuitBreaker(threshold, resetMs);
  breakers.set(key, breaker);
  if (!breaker.canExecute()) {
    throw new AppError("Service temporarily unavailable", 503, "CIRCUIT_OPEN");
  }
  try {
    const result = await fn();
    breaker.success();
    return result;
  } catch (error) {
    breaker.fail();
    throw error;
  }
};
