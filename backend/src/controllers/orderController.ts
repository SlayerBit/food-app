import { OrderStatus, PaymentMethod } from "@prisma/client";
import { Response } from "express";
import { orderService } from "../services/orderService";
import { ok } from "../utils/apiResponse";
import { RequestContextRequest } from "../types/request";
import { ValidationError } from "../utils/AppError";

const PAYMENT_METHODS: PaymentMethod[] = ["COD", "MOCK", "CARD", "UPI", "WALLET"];

export const orderController = {
  async place(req: RequestContextRequest, res: Response) {
    const { restaurantId, items, paymentMethod: rawPm = "COD" } = req.body;
    const paymentMethod = rawPm as PaymentMethod;
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      throw new ValidationError("Invalid payment method");
    }
    const data = await orderService.placeOrder(req.user!.id, restaurantId, items, paymentMethod, req.requestId);
    res.status(201).json(ok(data, req.requestId));
  },
  async myOrders(req: RequestContextRequest, res: Response) {
    const data = await orderService.myOrders(req.user!.id);
    res.status(200).json(ok(data, req.requestId));
  },
  async all(req: RequestContextRequest, res: Response) {
    const data = await orderService.allOrders();
    res.status(200).json(ok(data, req.requestId));
  },
  async updateStatus(req: RequestContextRequest, res: Response) {
    const data = await orderService.updateStatus(
      String(req.params.id),
      req.body.status as OrderStatus
    );
    res.status(200).json(ok(data, req.requestId));
  },
};
