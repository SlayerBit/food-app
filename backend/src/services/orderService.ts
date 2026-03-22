import { OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError, NotFoundError, ValidationError } from "../utils/AppError";
import { OrderRepository } from "../repositories/orderRepository";
import { RestaurantRepository } from "../repositories/restaurantRepository";
import { unitOfWork } from "../repositories/unitOfWork";
import { paymentService } from "./paymentService";
import { config } from "../config/config";
import { eventBus } from "./eventBus";
import { jobQueueService } from "./jobQueueService";
import { logger } from "../utils/logger";

const transitions: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const orderService = {
  repository: new OrderRepository(prisma),
  restaurantRepository: new RestaurantRepository(prisma),

  async placeOrder(
    userId: string,
    restaurantId: string,
    items: Array<{ menuItemId: string; quantity: number }>,
    paymentMethod: PaymentMethod,
    requestId?: string
  ) {
    if (!config.features.enableOrders) {
      throw new AppError("Orders are disabled", 503, "ORDERS_DISABLED");
    }
    if (!items.length) throw new ValidationError("Cart is empty");

    const menuItems = await this.restaurantRepository.findMenuItemsByIds(
      restaurantId,
      items.map((i) => i.menuItemId)
    );
    if (menuItems.length !== items.length) throw new ValidationError("Invalid menu item selection");
    const map = new Map(menuItems.map((item) => [item.id, item]));
    for (const item of items) {
      const menu = map.get(item.menuItemId)!;
      if (menu.stock < item.quantity) {
        throw new ValidationError(`Insufficient stock for ${menu.name}`);
      }
    }

    const total = items.reduce(
      (sum, item) => sum + Number(map.get(item.menuItemId)!.price) * item.quantity,
      0
    );

    const payment = await paymentService.processPayment({
      amount: total,
      paymentMethod,
      requestId,
    });

    if (payment.paymentStatus !== "SUCCESS") {
      throw new ValidationError("Payment was not successful; order was not created");
    }

    const order = await unitOfWork.run(async (tx) => {
      const txRestaurantRepository = new RestaurantRepository(tx);
      for (const item of items) {
        const result = await txRestaurantRepository.decrementStockIfAvailable(item.menuItemId, item.quantity);
        if (result.count !== 1) {
          throw new ValidationError(`Insufficient stock for ${map.get(item.menuItemId)!.name}`);
        }
      }
      const txOrderRepository = new OrderRepository(tx);
      return txOrderRepository.create({
        user: { connect: { id: userId } },
        restaurant: { connect: { id: restaurantId } },
        status: "PLACED",
        totalAmount: new Prisma.Decimal(total.toFixed(2)),
        paymentMethod,
        paymentStatus: payment.paymentStatus,
        paymentRef: payment.paymentRef,
        items: {
          create: items.map((item) => ({
            menuItem: { connect: { id: item.menuItemId } },
            quantity: item.quantity,
            price: map.get(item.menuItemId)!.price,
          })),
        },
      });
    });

    logger.info(
      "order.created",
      { orderId: order.id, userId, total, paymentMethod, paymentRef: payment.paymentRef },
      requestId
    );
    eventBus.emit("payment.completed", {
      orderId: order.id,
      userId,
      paymentRef: payment.paymentRef,
      amount: total,
    });
    eventBus.emit("order.created", { orderId: order.id, userId });

    jobQueueService.add(
      async () => {
        logger.info("order.postprocess", { orderId: order.id, userId }, requestId);
      },
      { maxRetries: 3 }
    );

    jobQueueService.add(
      async () => {
        logger.info("order.scheduled_followup", { orderId: order.id }, requestId);
      },
      { delayMs: config.queue.delayedStatusCheckMs, maxRetries: 2 }
    );

    return order;
  },

  myOrders(userId: string) {
    return this.repository.myOrders(userId);
  },

  allOrders() {
    return this.repository.allOrders();
  },

  async updateStatus(orderId: string, status: OrderStatus) {
    const updated = await unitOfWork.run(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) throw new NotFoundError("Order not found");
      if (!transitions[order.status].includes(status)) {
        throw new ValidationError(`Invalid status transition: ${order.status} -> ${status}`);
      }

      if (status === "CANCELLED") {
        const txRestaurantRepository = new RestaurantRepository(tx);
        for (const line of order.items) {
          await txRestaurantRepository.incrementStock(line.menuItemId, line.quantity);
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status },
        include: { items: { include: { menuItem: true } }, restaurant: true, user: true },
      });
    });

    logger.info("order.status.updated", { orderId, status: updated.status });
    eventBus.emit("order.status.updated", {
      orderId,
      status: updated.status,
      userId: updated.userId,
    });

    return updated;
  },
};
