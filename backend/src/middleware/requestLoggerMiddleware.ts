import { NextFunction, Response } from "express";
import { RequestContextRequest } from "../types/request";
import { logger } from "../utils/logger";
import { metricsService } from "../services/metricsService";

export const requestLoggerMiddleware = (
  req: RequestContextRequest,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  metricsService.beginRequest();
  res.on("finish", () => {
    metricsService.endRequest();
    const latency = Date.now() - start;
    metricsService.observeLatency(latency);
    const userId = req.user?.id;
    logger.info(
      "request.complete",
      {
        service: "http",
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        latencyMs: latency,
        userId: userId ?? null,
      },
      req.requestId
    );
  });
  next();
};
