import { prisma } from "../config/prisma";
import { config } from "../config/config";
import { RestaurantRepository } from "../repositories/restaurantRepository";
import { NotFoundError } from "../utils/AppError";
import { cacheService, menuKey } from "./cacheService";

export const restaurantService = {
  repository: new RestaurantRepository(prisma),
  async list() {
    const key = "restaurants:list";
    const cached = cacheService.get<Awaited<ReturnType<RestaurantRepository["listWithMenu"]>>>(key);
    if (cached) return cached;
    const data = await this.repository.listWithMenu();
    cacheService.set(key, data, config.cache.restaurantListTtlMs);
    return data;
  },
  getById(id: string) {
    return this.repository.getById(id);
  },
  create(input: { name: string; description: string; imageUrl: string; cuisine: string }) {
    cacheService.del("restaurants:list");
    return this.repository.create(input);
  },
  async update(id: string, input: Partial<{ name: string; description: string; imageUrl: string; cuisine: string }>) {
    const existing = await this.repository.getById(id);
    if (!existing) throw new NotFoundError("Restaurant not found");
    cacheService.invalidateRestaurant(id);
    return this.repository.update(id, input);
  },
  async remove(id: string) {
    const existing = await this.repository.getById(id);
    if (!existing) throw new NotFoundError("Restaurant not found");
    cacheService.invalidateRestaurant(id);
    await this.repository.remove(id);
    return { id };
  },
  async listMenu(restaurantId: string) {
    const key = menuKey(restaurantId);
    const cached = cacheService.get<Awaited<ReturnType<RestaurantRepository["listMenu"]>>>(key);
    if (cached) return cached;
    const data = await this.repository.listMenu(restaurantId);
    cacheService.set(key, data, config.cache.menuTtlMs);
    return data;
  },
  createMenuItem(input: {
    restaurantId: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    isVeg: boolean;
    stock: number;
  }) {
    cacheService.invalidateRestaurant(input.restaurantId);
    return this.repository.createMenuItem(input);
  },
  async updateMenuItem(
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
    const existing = await this.repository.findMenuById(id);
    if (!existing) throw new NotFoundError("Menu item not found");
    cacheService.invalidateRestaurant(existing.restaurantId);
    return this.repository.updateMenuItem(id, input);
  },
  async removeMenuItem(id: string) {
    const existing = await this.repository.findMenuById(id);
    if (!existing) throw new NotFoundError("Menu item not found");
    cacheService.invalidateRestaurant(existing.restaurantId);
    await this.repository.removeMenuItem(id);
    return { id };
  },
};
