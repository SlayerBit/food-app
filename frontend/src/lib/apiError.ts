import type { AxiosError } from "axios";

export function getApiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  const ax = err as AxiosError<{ error?: { message?: string } | string }>;
  const e = ax.response?.data?.error;
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && "message" in e && typeof e.message === "string") return e.message;
  return fallback;
}
