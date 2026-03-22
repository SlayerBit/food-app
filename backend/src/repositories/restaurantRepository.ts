import { Prisma, PrismaClient } from "@prisma/client";

export class RestaurantRepository {
  constructor(private readonly db: PrismaClient | Prisma.TransactionClient) {}

  listWithMenu() {
    return this.db.restaurant.findMany({
      include: { menuItems: true },
      orderBy: { createdAt: "desc" },
    });
  }

  getById(id: string) {
    return this.db.restaurant.findUnique({
      where: { id },
      include: { menuItems: true },
    });
  }

  create(input: { name: string; description: string; imageUrl: string; cuisine: string }) {
    return this.db.restaurant.create({ data: input });
  }

  update(id: string, input: Partial<{ name: string; description: string; imageUrl: string; cuisine: string }>) {
    return this.db.restaurant.update({ where: { id }, data: input });
  }

  remove(id: string) {
    return this.db.restaurant.delete({ where: { id } });
  }

  listMenu(restaurantId: string) {
    return this.db.menuItem.findMany({ where: { restaurantId }, orderBy: { createdAt: "desc" } });
  }

  createMenuItem(input: {
    restaurantId: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    isVeg: boolean;
    stock: number;
  }) {
    return this.db.menuItem.create({ data: input });
  }

  findMenuById(id: string) {
    return this.db.menuItem.findUnique({ where: { id } });
  }

  updateMenuItem(
    id: string,
    input: Partial<{
      name: string;
      description: string;
      price: number;
      imageUrl: string;
      isVeg: boolean;
      stock: number;
    }>
  ) {
    return this.db.menuItem.update({ where: { id }, data: input });
  }

  removeMenuItem(id: string) {
    return this.db.menuItem.delete({ where: { id } });
  }

  findMenuItemsByIds(restaurantId: string, ids: string[]) {
    return this.db.menuItem.findMany({
      where: { id: { in: ids }, restaurantId },
    });
  }

  /**
   * Atomically decrements stock only if enough is available (concurrency-safe).
   * Returns true when exactly one row was updated.
   */
  decrementStockIfAvailable(menuItemId: string, quantity: number) {
    return this.db.menuItem.updateMany({
      where: { id: menuItemId, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
  }

  incrementStock(menuItemId: string, quantity: number) {
    return this.db.menuItem.update({
      where: { id: menuItemId },
      data: { stock: { increment: quantity } },
    });
  }
}
