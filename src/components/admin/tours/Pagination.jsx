import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage = 1,
  lastPage = 1,
  total = 0,
  perPage = 0,
  onPageChange,
  disabled = false,
}) {
  const safePerPage = Number(perPage) > 0 ? Number(perPage) : 0;
  const safeTotal = Number(total) > 0 ? Number(total) : 0;
  const from =
    safeTotal === 0 || safePerPage === 0
      ? 0
      : (currentPage - 1) * safePerPage + 1;
  const to =
    safeTotal === 0 || safePerPage === 0
      ? 0
      : Math.min(currentPage * safePerPage, safeTotal);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing <span className="font-semibold text-slate-900">{from}</span> to{" "}
        <span className="font-semibold text-slate-900">{to}</span> of{" "}
        <span className="font-semibold text-slate-900">{safeTotal}</span> tours
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={disabled || currentPage <= 1}
          className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        <span className="px-1 text-xs font-semibold uppercase text-slate-400">
          Page {currentPage} of {lastPage}
        </span>

        <button
          type="button"
          aria-label="Next page"
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={disabled || currentPage >= lastPage}
          className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
