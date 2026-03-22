import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { ErrorState } from "../components/ErrorState";
import { Skeleton } from "../components/Skeleton";
import { useCart } from "../context/CartContext";
import { getApiErrorMessage } from "../lib/apiError";
import type { MenuItem, Restaurant } from "../types";

export const RestaurantDetailPage = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addItem } = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.get(`/restaurants/${id}`), api.get(`/menu/${id}`)])
      .then(([r, m]) => {
        setRestaurant(r.data.data);
        setMenu(m.data.data);
      })
      .catch((e) => setError(getApiErrorMessage(e, "Failed to load restaurant")))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = async (r: Restaurant, item: MenuItem) => {
    setAddingId(item.id);
    setAddedId(null);
    await new Promise((res) => setTimeout(res, 180));
    addItem(r, item);
    setAddingId(null);
    setAddedId(item.id);
    window.setTimeout(() => setAddedId((cur) => (cur === item.id ? null : cur)), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !restaurant) return <ErrorState message={error || "Not found"} />;

  return (
    <div>
      <div className="card mb-8 overflow-hidden p-6 sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{restaurant.name}</h1>
        <p className="mt-2 max-w-2xl text-slate-600">{restaurant.description}</p>
      </div>
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Menu</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {menu.map((item) => (
          <div
            key={item.id}
            className="card flex gap-4 p-4 transition-shadow duration-200 hover:shadow-lg"
          >
            <img src={item.imageUrl} alt="" className="h-28 w-28 shrink-0 rounded-xl object-cover" />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{item.name}</h3>
                {item.isVeg && (
                  <span className="rounded border border-green-600 px-1 text-[10px] font-bold text-green-700">
                    VEG
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.description}</p>
              <p className="mt-auto pt-3 text-lg font-bold text-slate-900">₹{Number(item.price).toFixed(0)}</p>
              <button
                type="button"
                disabled={addingId === item.id || (item.stock !== undefined && item.stock <= 0)}
                onClick={() => handleAdd(restaurant, item)}
                className="btn-primary mt-2 w-full max-w-[200px] text-sm sm:w-auto"
              >
                {addingId === item.id ? (
                  "Adding…"
                ) : addedId === item.id ? (
                  "Added ✓"
                ) : item.stock !== undefined && item.stock <= 0 ? (
                  "Out of stock"
                ) : (
                  "Add to cart"
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
