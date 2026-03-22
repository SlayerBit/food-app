import { Request, Response } from "express";
import { authService } from "../services/authService";
import { ok } from "../utils/apiResponse";
import { RequestContextRequest } from "../types/request";

export const authController = {
  async signup(req: RequestContextRequest, res: Response) {
    const { name, email, password } = req.body;
    const data = await authService.signup(name, email, password);
    res.status(201).json(ok(data, req.requestId));
  },
  async login(req: RequestContextRequest, res: Response) {
    const { email, password } = req.body;
    const data = await authService.login(email, password);
    res.status(200).json(ok(data, req.requestId));
  },
};
