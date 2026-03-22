export type Role = "USER" | "ADMIN";

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export type PaymentMethod = "COD" | "MOCK" | "CARD" | "UPI" | "WALLET";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
}

export interface Address {
  id: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  label?: string | null;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isVeg: boolean;
  stock?: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  price: number;
  menuItem: MenuItem;
}

export interface Order {
  id: string;
  restaurantId: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentRef?: string | null;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
  restaurant: Restaurant;
}

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];
