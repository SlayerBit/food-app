import { useEffect, useState } from "react";
import api from "../api/axios";
import { OrderStatusTimeline } from "../components/OrderStatusTimeline";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../lib/apiError";
import type { Order, OrderStatus } from "../types";

const ALL_STATUSES: OrderStatus[] = [
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

export const OrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = () => {
    const endpoint = user?.role === "ADMIN" ? "/orders" : "/orders/my";
    return api.get(endpoint).then((res) => setOrders(res.data?.data || []));
  };

  useEffect(() => {
    load()
      .catch((e) => setError(getApiErrorMessage(e, "Failed to load orders")))
      .finally(() => setLoading(false));
  }, [user?.role]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    setError("");
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e, "Could not update status"));
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (error && !(orders || []).length) {
    return <p className="text-center text-red-600">{error}</p>;
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">Your orders</h1>
      <p className="mb-8 text-slate-600">
        {user?.role === "ADMIN" ? "All orders — update status as admin." : "Track your order progress."}
      </p>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!(orders || []).length ? (
        <div className="card p-10 text-center">
          <p className="text-slate-600">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="card overflow-hidden p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{order.restaurant.name}</h3>
                  <p className="text-sm text-slate-500">
                    ₹{Number(order.totalAmount).toFixed(2)} · {order.paymentMethod ?? "—"}
                    {order.paymentRef ? ` · ${order.paymentRef}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-800">
                  {order.status.replace(/_/g, " ")}
                </span>
              </div>

              <div className="mt-6">
                <OrderStatusTimeline status={order.status} />
              </div>

              {user?.role === "ADMIN" && (
                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <label className="text-sm text-slate-600">Update status</label>
                  <select
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800"
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                  {updatingId === order.id && <span className="text-xs text-slate-500">Saving…</span>}
                </div>
              )}

              <ul className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm text-slate-600">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.menuItem.name} × {item.quantity}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
