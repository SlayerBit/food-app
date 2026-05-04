import { Response } from "express";
import { ok } from "../utils/apiResponse";
import { RequestContextRequest } from "../types/request";
import { publicFlowService } from "../services/publicFlowService";
import { logger } from "../utils/logger";

export const publicFlowController = {
  async listMenu(req: RequestContextRequest, res: Response) {
    const data = await publicFlowService.browseMenu(req.query);
    logger.info("api.menu.list", { limit: req.query.limit, offset: req.query.offset, q: req.query.q }, req.requestId);
    res.status(200).json(ok(data, req.requestId));
  },

  async listRestaurants(req: RequestContextRequest, res: Response) {
    const data = await publicFlowService.browseRestaurants(req.query);
    logger.info(
      "api.restaurants.list",
      { limit: req.query.limit, offset: req.query.offset, category: req.query.category, city: req.query.city },
      req.requestId
    );
    const wantsMeta = String(req.query.withMeta ?? "").toLowerCase() === "true";
    res.status(200).json(ok(wantsMeta ? data : data.restaurants, req.requestId));
  },

  async sampleOrders(req: RequestContextRequest, res: Response) {
    const data = await publicFlowService.sampleOrders();
    logger.info("api.orders.sample", { source: data.source, count: data.orders.length }, req.requestId);
    res.status(200).json(ok(data, req.requestId));
  },

  async simulateOrder(req: RequestContextRequest, res: Response) {
    const data = await publicFlowService.simulateOrder(req.body ?? {});
    logger.info(
      "api.orders.simulate",
      { userId: req.body?.userId ?? null, restaurantId: req.body?.restaurantId ?? null },
      req.requestId
    );
    res.status(201).json(ok(data, req.requestId));
  },

  async probe(req: RequestContextRequest, res: Response) {
    const data = await publicFlowService.probe();
    res.status(200).json(ok(data, req.requestId));
  },
};
