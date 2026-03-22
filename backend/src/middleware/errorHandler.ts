import { NextFunction, Request, Response } from "express";
import { fail } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import { RequestContextRequest } from "../types/request";
import { metricsService } from "../services/metricsService";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const request = req as RequestContextRequest;
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : "INTERNAL_ERROR";
  const details = err instanceof AppError ? err.details : null;
  metricsService.incrementError();
  logger.error(
    "request.error",
    { message: err.message, stack: err.stack, code, statusCode, details },
    request.requestId
  );
  res.status(statusCode).json(fail(err.message || "Internal server error", code, request.requestId, details));
};
