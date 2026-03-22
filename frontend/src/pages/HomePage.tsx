import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { ErrorState } from "../components/ErrorState";
import { Loading } from "../components/Loading";
import { getApiErrorMessage } from "../lib/apiError";
import type { Restaurant } from "../types";

export const HomePage = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/restaurants/public")
      .then((res) => setRestaurants(res.data?.data || []))
      .catch((e) => setError(getApiErrorMessage(e, "Failed to load restaurants")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  if (!(restaurants || []).length){
    return (
      <div className="card mx-auto max-w-md p-10 text-center">
        <p className="text-lg font-medium text-slate-800">No restaurants yet</p>
        <p className="mt-2 text-sm text-slate-500">Check back soon for new places near you.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Order food you love</h1>
        <p className="mt-2 text-slate-600">Top restaurants in your area ??? fast delivery.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {restaurants.map((r) => (
          <Link
            to={`/restaurants/${r.id}`}
            key={r.id}
            className="card card-hover group overflow-hidden"
          >
            <div className="relative overflow-hidden">
              <img
                src={r.imageUrl}
                alt=""
                className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-slate-700 shadow-sm backdrop-blur">
                {r.cuisine}
              </span>
            </div>
            <div className="p-5">
              <h2 className="text-lg font-semibold text-slate-900 group-hover:text-orange-600">{r.name}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{r.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
