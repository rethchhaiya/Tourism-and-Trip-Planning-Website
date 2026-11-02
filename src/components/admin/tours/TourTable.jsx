import TourRow from "./TourRow";

const COLUMN_COUNT = 6;

export default function TourTable({ tours, loadState, onDelete, onRetry }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left">
        <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <tr>
            <th className="px-5 py-3">Image</th>
            <th className="px-5 py-3">Title</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Duration</th>
            <th className="px-5 py-3">Price</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {loadState === "loading" &&
            Array.from({ length: 5 }).map((_, index) => (
              <tr key={`skeleton-${index}`}>
                <td colSpan={COLUMN_COUNT} className="px-5 py-4">
                  <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
                </td>
              </tr>
            ))}

          {loadState === "error" && (
            <tr>
              <td colSpan={COLUMN_COUNT} className="px-5 py-12 text-center">
                <p role="alert" className="text-sm text-red-600">
                  Could not load tours.
                </p>
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Try again
                </button>
              </td>
            </tr>
          )}

          {loadState === "ready" && tours.length === 0 && (
            <tr>
              <td
                colSpan={COLUMN_COUNT}
                className="px-5 py-12 text-center text-sm text-slate-500"
              >
                No tours found.
              </td>
            </tr>
          )}

          {loadState === "ready" &&
            tours.map((tour) => (
              <TourRow key={tour.id} tour={tour} onDelete={onDelete} />
            ))}
        </tbody>
      </table>
    </div>
  );
}
