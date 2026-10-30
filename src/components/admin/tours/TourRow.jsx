import React from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../../../context/useAuth";
import { PERMISSIONS } from "../../../constants/permissions";

const categoryStyles = {
  Beach: "bg-indigo-50 text-indigo-600",
  Cultural: "bg-amber-50 text-amber-600",
  Adventure: "bg-emerald-50 text-emerald-600",
  City: "bg-blue-50 text-blue-600",
};

const statusStyles = {
  ACTIVE: "bg-emerald-50 text-emerald-600",
  INACTIVE: "bg-red-50 text-red-600",
  DRAFT: "bg-slate-100 text-slate-600",
};

const TourRow = ({ tour, onView, onEdit, onDelete }) => {
  const { can, isAdmin } = useAuth();

  return (
    <tr className="border-b border-slate-100 transition hover:bg-slate-50">
      {/* ID */}
      <td className="px-5 py-5 text-sm font-medium text-slate-700">
        {tour.id}
      </td>
      {/* Tour */}
      <td className="px-5 py-5">
        <div className="flex items-center gap-4">
          <img
            src={tour.image}
            alt={tour.name}
            className="h-20 w-28 rounded-lg object-cover"
          />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {tour.name}
            </h3>
            <p className="mt-1 text-xs text-slate-500">{tour.slug}</p>
          </div>
        </div>
      </td>
      {/* Category */}
      <td className="px-5 py-5">
        <span
          className={`inline-flex rounded-md px-3 py-1 text-xs font-medium ${categoryStyles[tour.category]}`}
        >
          {tour.category}
        </span>
      </td>
      {/* Destination */}
      <td className="px-5 py-5 text-sm text-slate-600">{tour.destination}</td>
      {/* Duration */}
      <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-600">
        {tour.duration}
      </td>
      {/* Price */}
      <td className="px-5 py-5 text-sm font-semibold text-indigo-600">
        ${tour.price.toLocaleString()}
      </td>
      {/* Status */}
      <td className="px-5 py-5">
        <span
          className={`inline-flex rounded-md px-3 py-1 text-xs font-medium ${
            statusStyles[tour.status]
          }`}
        >
          {tour.status}
        </span>
      </td>
      {/* Created */}
      <td className="whitespace-nowrap px-5 py-5 text-sm text-slate-600">
        {tour.createdAt}
      </td>
      {/* Actions */}
      <td className="px-5 py-5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(tour)}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600"
            title="View"
          >
            <Eye size={17} />
          </button>

          {can(PERMISSIONS.UPDATE_TOURS) && (
            <button
              onClick={() => onEdit(tour)}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600"
              title="Edit"
            >
              <Pencil size={17} />
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => onDelete(tour)}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              title="Delete"
            >
              <Trash2 size={17} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default TourRow;
