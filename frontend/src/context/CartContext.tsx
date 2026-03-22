import { createContext, useContext, useMemo, useState, useEffect, useRef } from "react";
import type { MenuItem, Restaurant } from "../types";

interface CartLine {
  menuItem: MenuItem;
  quantity: number;
}

interface CartContextValue {
  restaurant: Restaurant | null;
  items: CartLine[];
  totalItems: number;
  addItem: (restaurant: Restaurant, menuItem: MenuItem) => void;
  decreaseItem: (menuItemId: string) => void;
  clear: () => void;
  total: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const CART_STORAGE_KEY = "cart";

function toNumberPrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function isRestaurant(value: unknown): value is Restaurant {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return typeof r.id === "string" && typeof r.name === "string";
}

/** Parse and validate stored cart; never return items without a valid restaurant. */
function readStoredCart(): { items: CartLine[]; restaurant: Restaurant | null } {
  if (typeof window === "undefined") {
    return { items: [], restaurant: null };
  }
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return { items: [], restaurant: null };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { items: [], restaurant: null };
    const p = parsed as Record<string, unknown>;

    if (!Array.isArray(p.items)) {
      return { items: [], restaurant: null };
    }

    const restaurant = isRestaurant(p.restaurant) ? p.restaurant : null;

    const items: CartLine[] = [];
    for (const entry of p.items) {
      if (!entry || typeof entry !== "object") continue;
      const o = entry as Record<string, unknown>;
      const m = o.menuItem;
      if (!m || typeof m !== "object") continue;
      const mi = m as Record<string, unknown>;
      if (typeof mi.id !== "string" || typeof mi.name !== "string") continue;
      const price = toNumberPrice(mi.price);
      if (price === null) continue;
      const qty = typeof o.quantity === "number" && o.quantity > 0 ? Math.floor(o.quantity) : null;
      if (qty === null) continue;
      const menuItem: MenuItem = {
        id: mi.id,
        restaurantId: typeof mi.restaurantId === "string" ? mi.restaurantId : "",
        name: mi.name,
        description: typeof mi.description === "string" ? mi.description : "",
        price,
        imageUrl: typeof mi.imageUrl === "string" ? mi.imageUrl : "",
        isVeg: Boolean(mi.isVeg),
        ...(typeof mi.stock === "number" ? { stock: mi.stock } : {}),
      };
      items.push({ menuItem, quantity: qty });
    }

    if (items.length > 0 && !restaurant) {
      return { items: [], restaurant: null };
    }

    return { items, restaurant };
  } catch {
    return { items: [], restaurant: null };
  }
}

function safeTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => {
    const p = toNumberPrice(line?.menuItem?.price);
    const q = typeof line?.quantity === "number" ? line.quantity : 0;
    if (p === null || q <= 0) return sum;
    return sum + p * q;
  }, 0);
}

function safeTotalItems(lines: CartLine[]): number {
  return lines.reduce((sum, line) => {
    const q = typeof line?.quantity === "number" ? line.quantity : 0;
    return sum + (q > 0 ? q : 0);
  }, 0);
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const initialSnap = useRef<ReturnType<typeof readStoredCart> | null>(null);
  if (initialSnap.current === null) {
    initialSnap.current = readStoredCart();
  }

  const [restaurant, setRestaurant] = useState<Restaurant | null>(
    () => initialSnap.current!.restaurant
  );
  const [items, setItems] = useState<CartLine[]>(() => initialSnap.current!.items);

  const total = useMemo(() => safeTotal(items), [items]);
  const totalItems = useMemo(() => safeTotalItems(items), [items]);

  useEffect(() => {
    if (items.length === 0 && !restaurant) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items, restaurant }));
    } catch {
      /* ignore quota / private mode */
    }
  }, [items, restaurant]);

  const value = useMemo(
    () => ({
      restaurant,
      items,
      totalItems,
      addItem(targetRestaurant: Restaurant, menuItem: MenuItem) {
        if (restaurant && restaurant.id !== targetRestaurant.id) {
          setItems([]);
        }
        setRestaurant(targetRestaurant);
        setItems((prev) => {
          const existing = prev.find((p) => p?.menuItem?.id === menuItem.id);
          if (existing) {
            return prev.map((p) =>
              p?.menuItem?.id === menuItem.id ? { ...p, quantity: (p.quantity ?? 0) + 1 } : p
            );
          }
          return [...prev, { menuItem, quantity: 1 }];
        });
      },
      decreaseItem(menuItemId: string) {
        setItems((prev) =>
          prev
            .map((line) =>
              line?.menuItem?.id === menuItemId
                ? { ...line, quantity: (line.quantity ?? 0) - 1 }
                : line
            )
            .filter((line) => (line?.quantity ?? 0) > 0)
        );
      },
      clear() {
        setItems([]);
        setRestaurant(null);
        try {
          localStorage.removeItem(CART_STORAGE_KEY);
        } catch {
          /* ignore */
        }
      },
      total,
    }),
    [items, restaurant, total, totalItems]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
};
