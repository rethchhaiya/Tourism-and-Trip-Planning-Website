const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

const STATUS_CLASSES = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border-red-200 bg-red-50 text-red-700",
  completed: "border-indigo-200 bg-indigo-50 text-indigo-700",
};

export default function BookingStatusBadge({ status }) {
  const key = String(status ?? "").trim().toLowerCase();
  const label = STATUS_LABELS[key] ?? (key ? key : "Unknown");
  const classes = STATUS_CLASSES[key] ?? "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <span
      data-status={key || "unknown"}
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${classes}`}
    >
      {label}
    </span>
  );
}
