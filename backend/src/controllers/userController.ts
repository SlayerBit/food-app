import { Response } from "express";
import { userService } from "../services/userService";
import { RequestContextRequest } from "../types/request";
import { ok } from "../utils/apiResponse";

export const userController = {
  async me(req: RequestContextRequest, res: Response) {
    const data = await userService.me(req.user!.id);
    res.status(200).json(ok(data, req.requestId));
  },
  async updateMe(req: RequestContextRequest, res: Response) {
    const data = await userService.updateMe(req.user!.id, req.body);
    res.status(200).json(ok(data, req.requestId));
  },
  async addAddress(req: RequestContextRequest, res: Response) {
    const data = await userService.addAddress(req.user!.id, req.body);
    res.status(201).json(ok(data, req.requestId));
  },
  async deleteAddress(req: RequestContextRequest, res: Response) {
    const data = await userService.deleteAddress(req.user!.id, String(req.params.id));
    res.status(200).json(ok(data, req.requestId));
  },
};
