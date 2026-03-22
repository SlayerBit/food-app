import { Request, Response } from "express";
import { restaurantService } from "../services/restaurantService";
import { ok } from "../utils/apiResponse";
import { RequestContextRequest } from "../types/request";

export const restaurantController = {
  async list(req: RequestContextRequest, res: Response) {
    const data = await restaurantService.list();
    res.status(200).json(ok(data, req.requestId));
  },
  async getById(req: RequestContextRequest, res: Response) {
    const data = await restaurantService.getById(String(req.params.id));
    res.status(200).json(ok(data, req.requestId));
  },
  async create(req: RequestContextRequest, res: Response) {
    const data = await restaurantService.create(req.body);
    res.status(201).json(ok(data, req.requestId));
  },
  async update(req: RequestContextRequest, res: Response) {
    const data = await restaurantService.update(String(req.params.id), req.body);
    res.status(200).json(ok(data, req.requestId));
  },
  async remove(req: RequestContextRequest, res: Response) {
    const data = await restaurantService.remove(String(req.params.id));
    res.status(200).json(ok(data, req.requestId));
  },
};
