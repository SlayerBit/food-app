import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { getApiErrorMessage } from "../lib/apiError";
import type { PaymentMethod } from "../types";

function formatLinePrice(price: unknown): string {
  const n = typeof price === "number" ? price : Number(price);
  const safe = Number.isFinite(n) ? n : 0;
  return safe.toFixed(2);
}

export const CartPage = () => {
  const { items, total, totalItems, clear, decreaseItem, addItem, restaurant } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");

  const lines = Array.isArray(items) ? items : [];

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">Your cart</h1>
        <p className="mb-8 text-slate-600">Add dishes from a restaurant to get started.</p>
        <div className="card p-10 text-center">
          <p className="text-slate-600">Your cart is empty.</p>
          <button type="button" className="btn-primary mt-6" onClick={() => navigate("/")}>
            Browse restaurants
          </button>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-slate-500">Loading cart…</p>
      </div>
    );
  }

  const placeOrder = async () => {
    if (!user) return navigate("/login");
    if (!restaurant || lines.length === 0) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/orders", {
        restaurantId: restaurant.id,
        items: lines
          .filter((i) => i?.menuItem?.id)
          .map((i) => ({ menuItemId: i.menuItem.id, quantity: i.quantity })),
        paymentMethod,
      });
      clear();
      navigate("/orders");
    } catch (e) {
      setError(getApiErrorMessage(e, "Could not place order"));
    } finally {
      setLoading(false);
    }
  };

  const canCheckout = Boolean(restaurant && lines.length && user);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">Your cart</h1>
      <p className="mb-8 text-slate-600">
        {totalItems > 0 ? (
          <>
            <span className="font-semibold text-slate-900">{totalItems}</span> items · Total{" "}
            <span className="font-bold text-orange-600">₹{Number.isFinite(total) ? total.toFixed(2) : "0.00"}</span>
          </>
        ) : (
          "Add dishes from a restaurant to get started."
        )}
      </p>

      <div className="space-y-4">
        <p className="text-sm font-medium text-slate-700">
          From <span className="text-orange-600">{restaurant?.name ?? "Restaurant"}</span>
        </p>

        {lines.map((line) => {
          const m = line?.menuItem;
          const id = m?.id;
          if (!id) return null;
          return (
            <div
              key={id}
              className="card flex flex-wrap items-center justify-between gap-4 p-4"
            >
              <div>
                <h3 className="font-semibold text-slate-900">{m?.name ?? "Item"}</h3>
                <p className="text-sm text-slate-500">
                  ₹{formatLinePrice(m?.price)} × {line?.quantity ?? 0}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-ghost min-w-[2.5rem]"
                  onClick={() => decreaseItem(id)}
                >
                  −
                </button>
                <span className="w-8 text-center font-medium">{line?.quantity ?? 0}</span>
                <button
                  type="button"
                  className="btn-ghost min-w-[2.5rem]"
                  disabled={!restaurant}
                  onClick={() => {
                    if (restaurant && m) addItem(restaurant, m);
                  }}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}

        <div className="card space-y-4 p-5">
          <label className="block text-sm font-medium text-slate-700">Payment</label>
          <div className="flex flex-wrap gap-3">
            {(
              [
                ["COD", "Cash on delivery"],
                ["MOCK", "Card / UPI (simulated)"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors ${
                  paymentMethod === value
                    ? "border-orange-500 bg-orange-50 text-orange-900"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="pm"
                  className="accent-orange-600"
                  checked={paymentMethod === value}
                  onChange={() => setPaymentMethod(value)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg">
            Total{" "}
            <span className="font-bold text-slate-900">
              ₹{Number.isFinite(total) ? total.toFixed(2) : "0.00"}
            </span>
          </p>
          <button
            type="button"
            onClick={placeOrder}
            disabled={loading || !canCheckout}
            className="btn-primary px-8 py-3"
          >
            {loading ? "Placing order…" : "Place order"}
          </button>
        </div>
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
};
