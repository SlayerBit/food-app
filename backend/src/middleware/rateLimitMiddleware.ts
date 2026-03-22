import { NextFunction, Response } from "express";
import { RequestContextRequest } from "../types/request";
import { AppError } from "../utils/AppError";
import { config } from "../config/config";

const buckets = new Map<string, { count: number; resetAt: number }>();
let sweepCounter = 0;

export const rateLimitMiddleware = (
  req: RequestContextRequest,
  _res: Response,
  next: NextFunction
) => {
  const key = req.ip || "unknown";
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + config.rateLimit.windowMs });
  } else {
    bucket.count += 1;
    if (bucket.count > config.rateLimit.max) {
      throw new AppError("Too many requests", 429, "RATE_LIMIT");
    }
  }

  sweepCounter += 1;
  if (sweepCounter % 200 === 0) {
    for (const [k, b] of buckets.entries()) {
      if (now > b.resetAt + config.rateLimit.windowMs) buckets.delete(k);
    }
  }

  return next();
};
