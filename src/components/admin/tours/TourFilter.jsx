import { Search } from "lucide-react";

export default function TourFilter({ search, setSearch, status, setStatus }) {
  return (
    <div className="border-b border-slate-100">
      <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-[420px]">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tours by title..."
            aria-label="Search tours"
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
        </div>

        <label className="flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
          <span className="mr-2 text-xs font-semibold uppercase text-slate-400">
            Status:
          </span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter by status"
            className="bg-transparent text-sm text-slate-700 outline-none"
          >
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <p className="px-4 pb-3 text-xs text-slate-400">
        Search and status filters apply to the current page only.
      </p>
    </div>
  );
}
