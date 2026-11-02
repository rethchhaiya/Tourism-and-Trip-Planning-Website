import { Plus } from "lucide-react";
import { useAuth } from "../../../context/useAuth";
import { PERMISSIONS } from "../../../constants/permissions";

export default function TourHeader({ onAdd }) {
  const { can } = useAuth();

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Tours
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage tour packages shown on the website.
        </p>
      </div>

      {can(PERMISSIONS.STORE_TOURS) && (
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500 sm:self-auto"
        >
          <Plus size={16} />
          Add tour
        </button>
      )}
    </div>
  );
}
