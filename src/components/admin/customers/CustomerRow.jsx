import {
  CircleCheck,
  CircleSlash2,
  Eye,
  MapPin,
  MoreVertical,
} from "lucide-react";

import StatusBadge from "./StatusBadge";
import { useAuth } from "../../../context/useAuth";

export default function CustomerRow({ customer }) {
  const { isAdmin } = useAuth();
  const deactivated = customer.status === "DEACTIVATED";

  return (
    <tr
      className={`text-sm text-slate-600 transition hover:bg-slate-50 ${
        deactivated ? "text-slate-400" : ""
      }`}
    >
      <td className="px-4 py-3">
        <input type="checkbox" className="rounded border-slate-300" />
      </td>

      {/* Customer */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${customer.avatarColor}`}
          >
            {customer.initials}
          </div>
          <div>
            <p
              className={`font-semibold ${
                deactivated ? "text-slate-500 line-through" : "text-slate-900"
              }`}
            >
              {customer.name}
            </p>
            <p className="text-xs text-slate-400">
              {customer.email} • {customer.phone}
            </p>
          </div>
        </div>
      </td>

      {/* Location */}
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-slate-600">
          <MapPin size={14} className="text-slate-400" />
          {customer.country}
        </span>
      </td>

      {/* Bookings */}
      <td className="px-4 py-3 text-center">
        <span className="inline-flex min-w-6 items-center justify-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
          {customer.bookings}
        </span>
      </td>

      {/* Spent */}
      <td className="px-4 py-3 text-right font-semibold text-slate-900">
        {customer.spent}
      </td>

      {/* Joined */}
      <td className="px-4 py-3">{customer.joined}</td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={customer.status} />
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-4">
          <button
            className="text-slate-400 transition hover:text-blue-600"
            title="View customer"
          >
            <Eye size={17} />
          </button>

          {isAdmin && (
            <button
              className="text-slate-400 transition hover:text-blue-600"
              title={deactivated ? "Activate" : "Deactivate"}
            >
              {deactivated ? (
                <CircleCheck size={17} />
              ) : (
                <CircleSlash2 size={17} />
              )}
            </button>
          )}

          <button
            className="text-slate-400 transition hover:text-blue-600"
            title="More actions"
          >
            <MoreVertical size={17} />
          </button>
        </div>
      </td>
    </tr>
  );
}
