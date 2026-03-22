import type { OrderStatus } from "../types";
import { ORDER_STATUS_FLOW } from "../types";

const LABELS: Record<OrderStatus, string> = {
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Order cancelled
      </div>
    );
  }

  const idx = ORDER_STATUS_FLOW.indexOf(status);
  return (
    <div className="overflow-x-auto pb-1">
      <ol className="flex min-w-[min(100%,520px)] items-start gap-1 sm:gap-2">
        {ORDER_STATUS_FLOW.map((step, i) => {
          const done = i < idx;
          const current = i === idx;
          return (
            <li key={step} className="flex flex-1 flex-col items-center gap-1.5 text-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  done
                    ? "bg-emerald-500 text-white"
                    : current
                      ? "bg-orange-500 text-white ring-4 ring-orange-100"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`text-[10px] font-medium leading-tight sm:text-xs ${
                  current ? "text-orange-700" : done ? "text-emerald-700" : "text-slate-400"
                }`}
              >
                {LABELS[step]}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
