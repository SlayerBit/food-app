import { OrderStatus, Prisma, PrismaClient } from "@prisma/client";

export class OrderRepository {
  constructor(private readonly db: PrismaClient | Prisma.TransactionClient) {}

  create(data: Prisma.OrderCreateInput) {
    return this.db.order.create({
      data,
      include: { items: { include: { menuItem: true } }, restaurant: true },
    });
  }

  myOrders(userId: string) {
    return this.db.order.findMany({
      where: { userId },
      include: { items: { include: { menuItem: true } }, restaurant: true },
      orderBy: { createdAt: "desc" },
    });
  }

  allOrders() {
    return this.db.order.findMany({
      include: { items: { include: { menuItem: true } }, user: true, restaurant: true },
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id: string) {
    return this.db.order.findUnique({ where: { id }, include: { items: true } });
  }

  updateStatus(id: string, status: OrderStatus) {
    return this.db.order.update({
      where: { id },
      data: { status },
      include: { items: { include: { menuItem: true } }, restaurant: true, user: true },
    });
  }
}
