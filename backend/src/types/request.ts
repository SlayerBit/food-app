import { Request } from "express";

export interface AuthUser {
  id: string;
  role: "USER" | "ADMIN";
}

export interface RequestContextRequest extends Request {
  requestId?: string;
  user?: AuthUser;
}
