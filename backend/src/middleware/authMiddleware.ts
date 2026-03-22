import { NextFunction, Request, Response } from "express";
import { authService } from "../services/authService";
import { ForbiddenError, UnauthorizedError } from "../utils/AppError";
import { RequestContextRequest } from "../types/request";

export const authenticate = (
  req: RequestContextRequest,
  _res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError();
  }
  const token = header.split(" ")[1];
  const payload = authService.verifyToken(token);
  req.user = payload;
  next();
};

export const authorize = (...roles: Array<"USER" | "ADMIN">) => {
  return (req: RequestContextRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError();
    }
    next();
  };
};
