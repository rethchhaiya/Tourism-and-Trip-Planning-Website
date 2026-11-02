import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, ImageOff, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../../../context/useAuth";
import { PERMISSIONS } from "../../../constants/permissions";
import { formatCurrency } from "../../../utils/currency";
import { formatDuration } from "../../../utils/catalog";
import TourStatusBadge from "./TourStatusBadge";

function TourImage({ src, alt }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
        <ImageOff size={18} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-14 w-20 shrink-0 rounded-lg border border-slate-200 object-cover"
    />
  );
}

export default function TourRow({ tour, onDelete }) {
  const { can, isAdmin } = useAuth();
  const canEdit = can(PERMISSIONS.UPDATE_TOURS);
  const price = tour.priceOverride ?? tour.basePrice;
  const duration = formatDuration(tour);

  return (
    <tr className="text-sm text-slate-700 transition hover:bg-slate-50/70">
      <td className="px-5 py-3">
        <TourImage
          key={tour.primaryImage}
          src={tour.primaryImage}
          alt={tour.title || "Tour"}
        />
      </td>

      <td className="px-5 py-3">
        <p className="font-semibold text-slate-900">
          {tour.title || "Untitled tour"}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">{tour.slug || "—"}</p>
      </td>

      <td className="px-5 py-3">
        <TourStatusBadge status={tour.status} />
      </td>

      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
        {duration || "—"}
      </td>

      <td className="whitespace-nowrap px-5 py-3">
        <p className="font-semibold text-slate-900">
          {formatCurrency(price) || "—"}
        </p>
        {tour.priceOverride != null && tour.basePrice != null && (
          <p className="text-xs text-slate-400 line-through">
            {formatCurrency(tour.basePrice)}
          </p>
        )}
      </td>

      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/admin/tours/${tour.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            {canEdit ? <Pencil size={13} /> : <Eye size={13} />}
            {canEdit ? "Edit" : "View"}
          </Link>

          {isAdmin && (
            <button
              type="button"
              onClick={() => onDelete(tour)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={13} />
              Delete
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
