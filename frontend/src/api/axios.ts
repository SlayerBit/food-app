import axios from "axios";

/**
 * API base URL — set VITE_API_URL at build time (e.g. Vercel env).
 * In development, Vite serves from .env / .env.local (see .env.example).
 */
const baseURL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? "";

if (import.meta.env.PROD && !baseURL) {
  console.warn(
    "[FoodApp] VITE_API_URL is not set. Configure it in Vercel (or .env) so API requests use your backend URL."
  );
}

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
