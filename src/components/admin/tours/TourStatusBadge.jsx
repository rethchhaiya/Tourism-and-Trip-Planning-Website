const styles = {
  published: "bg-emerald-50 text-emerald-600",
  draft: "bg-amber-50 text-amber-600",
  archived: "bg-slate-100 text-slate-500",
};

const dots = {
  published: "bg-emerald-500",
  draft: "bg-amber-500",
  archived: "bg-slate-400",
};

export default function TourStatusBadge({ status }) {
  const key = String(status ?? "").trim().toLowerCase();
  const label = key ? key.toUpperCase() : "UNKNOWN";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${styles[key] ?? "bg-slate-100 text-slate-500"}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${dots[key] ?? "bg-slate-400"}`}
      />
      {label}
    </span>
  );
}
