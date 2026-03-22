import { Request, Response } from "express";
import { restaurantService } from "../services/restaurantService";
import { ok } from "../utils/apiResponse";
import { RequestContextRequest } from "../types/request";

export const menuController = {
  async listByRestaurant(req: RequestContextRequest, res: Response) {
    const data = await restaurantService.listMenu(String(req.params.restaurantId));
    res.status(200).json(ok(data, req.requestId));
  },
  async create(req: RequestContextRequest, res: Response) {
    const data = await restaurantService.createMenuItem(req.body);
    res.status(201).json(ok(data, req.requestId));
  },
  async update(req: RequestContextRequest, res: Response) {
    const data = await restaurantService.updateMenuItem(String(req.params.id), req.body);
    res.status(200).json(ok(data, req.requestId));
  },
  async remove(req: RequestContextRequest, res: Response) {
    const data = await restaurantService.removeMenuItem(String(req.params.id));
    res.status(200).json(ok(data, req.requestId));
  },
};
