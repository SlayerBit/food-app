import { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { cacheService } from "./cacheService";
import { jobQueueService } from "./jobQueueService";
import { AppError, NotFoundError, ValidationError } from "../utils/AppError";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

type SimulateOrderItemInput = {
  menuItemId: string;
  quantity: number;
};

function clampLimit(raw: unknown) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.floor(parsed));
}

function parseOffset(raw: unknown) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

function parsePositiveInt(raw: unknown, field: string) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    throw new ValidationError(`${field} must be a positive integer`);
  }
  return parsed;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function maybeInjectProbeFailure() {
  // 1% controlled chaos for probe traffic generation.
  if (Math.random() < 0.01) {
    throw new AppError("Probe chaos failure injected", 500, "PROBE_CHAOS");
  }
}

export const publicFlowService = {
  async browseMenu(input: { limit?: unknown; offset?: unknown; restaurantId?: unknown; q?: unknown }) {
    const limit = clampLimit(input.limit);
    const offset = parseOffset(input.offset);
    const restaurantId = typeof input.restaurantId === "string" && input.restaurantId.trim() ? input.restaurantId : undefined;
    const q = typeof input.q === "string" && input.q.trim() ? input.q.trim() : undefined;

    const where: Prisma.MenuItemWhereInput = {
      ...(restaurantId ? { restaurantId } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { restaurant: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    // Small realistic processing delay for traffic simulation.
    await sleep(15 + Math.floor(Math.random() * 20));

    const [total, items] = await Promise.all([
      prisma.menuItem.count({ where }),
      prisma.menuItem.findMany({
        where,
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              cuisine: true,
            },
          },
        },
        skip: offset,
        take: limit,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      }),
    ]);

    return {
      items,
      pagination: {
        limit,
        offset,
        total,
      },
    };
  },

  async browseRestaurants(input: { limit?: unknown; offset?: unknown; city?: unknown; category?: unknown; q?: unknown }) {
    const limit = clampLimit(input.limit);
    const offset = parseOffset(input.offset);
    const category = typeof input.category === "string" && input.category.trim() ? input.category.trim() : undefined;
    const city = typeof input.city === "string" && input.city.trim() ? input.city.trim() : undefined;
    const q = typeof input.q === "string" && input.q.trim() ? input.q.trim() : undefined;

    const where: Prisma.RestaurantWhereInput = {
      ...(category ? { cuisine: { contains: category, mode: "insensitive" } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { cuisine: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    // "city" isn't a modeled field; keep request shape stable and explicit.
    const cityFilterApplied = false;

    await sleep(10 + Math.floor(Math.random() * 25));

    const [total, restaurants] = await Promise.all([
      prisma.restaurant.count({ where }),
      prisma.restaurant.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        include: {
          _count: {
            select: { menuItems: true },
          },
        },
      }),
    ]);

    return {
      restaurants,
      pagination: {
        limit,
        offset,
        total,
      },
      filters: {
        city: city ?? null,
        cityFilterApplied,
        category: category ?? null,
        q: q ?? null,
      },
    };
  },

  async sampleOrders() {
    const recentOrders = await prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        restaurant: { select: { id: true, name: true, cuisine: true } },
        items: {
          include: {
            menuItem: {
              select: { id: true, name: true, price: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (recentOrders.length > 0) {
      return {
        source: "recent_orders",
        orders: recentOrders,
      };
    }

    const [user, restaurant] = await Promise.all([
      prisma.user.findFirst({
        select: { id: true, name: true, email: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.restaurant.findFirst({
        select: { id: true, name: true, cuisine: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!restaurant) {
      throw new NotFoundError("No restaurant data available to generate sample order");
    }

    const menuItems = await prisma.menuItem.findMany({
      where: { restaurantId: restaurant.id },
      select: { id: true, name: true, price: true, description: true },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    if (menuItems.length === 0) {
      throw new NotFoundError("No menu items available to generate sample order");
    }

    const items = menuItems.map((item, idx) => ({
      menuItemId: item.id,
      quantity: idx + 1,
      unitPrice: item.price,
      lineTotal: Number(item.price) * (idx + 1),
      item,
    }));
    const totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);

    return {
      source: "generated_from_db",
      orders: [
        {
          id: `sample-${Date.now()}`,
          status: "PLACED",
          createdAt: new Date().toISOString(),
          totalAmount: Number(totalAmount.toFixed(2)),
          user: user ?? null,
          restaurant,
          items,
        },
      ],
    };
  },

  async simulateOrder(input: { userId?: unknown; restaurantId?: unknown; items?: unknown }) {
    const providedItems = Array.isArray(input.items) ? input.items : [];
    let items = providedItems.map((item: any) => ({
      menuItemId: String(item?.menuItemId ?? ""),
      quantity: parsePositiveInt(item?.quantity ?? 0, "quantity"),
    })) as SimulateOrderItemInput[];

    const user =
      typeof input.userId === "string" && input.userId.trim()
        ? await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true } })
        : await prisma.user.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } });
    if (!user) throw new NotFoundError("No users available to simulate order");

    const restaurant =
      typeof input.restaurantId === "string" && input.restaurantId.trim()
        ? await prisma.restaurant.findUnique({ where: { id: input.restaurantId }, select: { id: true } })
        : await prisma.restaurant.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } });
    if (!restaurant) throw new NotFoundError("No restaurants available to simulate order");

    if (items.length === 0) {
      const fallbackItems = await prisma.menuItem.findMany({
        where: { restaurantId: restaurant.id },
        select: { id: true },
        take: 2,
        orderBy: { createdAt: "asc" },
      });
      if (!fallbackItems.length) {
        throw new ValidationError("No menu items available for simulated order");
      }
      items = fallbackItems.map((item) => ({ menuItemId: item.id, quantity: 1 }));
    }

    const menuItems = await prisma.menuItem.findMany({
      where: {
        restaurantId: restaurant.id,
        id: { in: items.map((item) => item.menuItemId) },
      },
      select: { id: true, name: true, price: true },
    });

    if (menuItems.length !== items.length) {
      throw new ValidationError("One or more menu items are invalid for selected restaurant");
    }

    const byId = new Map(menuItems.map((item) => [item.id, item]));
    const total = items.reduce((sum, line) => sum + Number(byId.get(line.menuItemId)!.price) * line.quantity, 0);

    const created = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: user.id,
          restaurantId: restaurant.id,
          status: "PLACED",
          paymentMethod: PaymentMethod.MOCK,
          paymentStatus: PaymentStatus.SUCCESS,
          paymentRef: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          totalAmount: new Prisma.Decimal(total.toFixed(2)),
        },
      });

      await tx.orderItem.createMany({
        data: items.map((line) => ({
          orderId: order.id,
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          price: byId.get(line.menuItemId)!.price,
        })),
      });

      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          restaurant: { select: { id: true, name: true, cuisine: true } },
          items: {
            include: {
              menuItem: { select: { id: true, name: true, price: true } },
            },
          },
        },
      });
    });

    return {
      message: "Simulated order placed successfully",
      order: created,
    };
  },

  async probe() {
    maybeInjectProbeFailure();

    const checks: Record<string, "up" | "down"> = {
      database: "down",
      cache: "down",
      queue: "down",
    };

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = "up";
    } catch {
      checks.database = "down";
    }

    try {
      checks.cache = cacheService.ping() ? "up" : "down";
    } catch {
      checks.cache = "down";
    }

    try {
      checks.queue = jobQueueService.health().ok ? "up" : "down";
    } catch {
      checks.queue = "down";
    }

    const healthy = Object.values(checks).every((v) => v === "up");
    if (!healthy) {
      throw new AppError("Probe dependency failure", 500, "PROBE_UNHEALTHY", checks);
    }

    return {
      status: "healthy",
      checks,
    };
  },
};
