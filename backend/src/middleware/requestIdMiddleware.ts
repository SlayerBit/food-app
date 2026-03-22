import { NextFunction, Response } from "express";
import { randomUUID } from "crypto";
import { RequestContextRequest } from "../types/request";

export const requestIdMiddleware = (
  req: RequestContextRequest,
  res: Response,
  next: NextFunction
) => {
  req.requestId = (req.headers["x-request-id"] as string) || randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
};
