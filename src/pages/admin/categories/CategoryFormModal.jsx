import { useState } from "react";
import { ImageOff } from "lucide-react";
import {
  createCategory,
  getCategory,
  updateCategory,
} from "../../../services/adminCategoryService";

const SAVE_ERROR = "Could not save this category. Please try again.";
const NOT_SAVED_NOTICE = "Some changes were not saved by the server";

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  image: "",
  status: 1,
};

function trim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toForm(category) {
  if (!category) {
    return { ...EMPTY_FORM };
  }
  return {
    name: category.name ?? "",
    slug: category.slug ?? "",
    description: category.description ?? "",
    image: category.image ?? "",
    status: category.status === 0 ? 0 : 1,
  };
}

function readFieldErrors(error) {
  if (!error || typeof error !== "object") {
    return {};
  }
  const errors = error.errors;
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) {
    return {};
  }

  const result = {};
  for (const [field, value] of Object.entries(errors)) {
    const message = Array.isArray(value) ? value[0] : value;
    if (typeof message === "string" && message.trim()) {
      result[field] = message.trim();
    }
  }
  return result;
}

function ImagePreview({ src, alt }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-28 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
        <ImageOff size={22} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-28 w-full rounded-lg border border-slate-200 object-cover"
    />
  );
}

const inputClass =
  "mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50";

export default function CategoryFormModal({
  mode,
  category,
  onClose,
  onSaved,
}) {
  const isEdit = mode === "edit";

  const [baseline, setBaseline] = useState(() => toForm(category));
  const [form, setForm] = useState(() => toForm(category));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) {
      return;
    }

    setErrors({});
    setFormError("");
    setNotice("");

    const name = trim(form.name);
    if (!name) {
      setErrors({ name: "Name is required." });
      return;
    }
    if (name.length > 255) {
      setErrors({ name: "Name must be 255 characters or fewer." });
      return;
    }

    if (isEdit) {
      const description = trim(form.description);
      const image = trim(form.image);
      const payload = {};

      if (name !== trim(baseline.name)) {
        payload.name = name;
      }
      if (Number(form.status) !== Number(baseline.status)) {
        payload.status = Number(form.status);
      }
      if (description !== trim(baseline.description)) {
        payload.description = description;
      }
      if (image !== trim(baseline.image)) {
        payload.image = image;
      }

      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      setSaving(true);
      try {
        await updateCategory(category.id, payload);
        // TODO(undocumented): PUT may only accept name and status. Re-fetch and
        // compare description/image until the real behaviour is confirmed.
        const fresh = await getCategory(category.id);

        if (fresh) {
          setBaseline(toForm(fresh));
          setForm(toForm(fresh));
          if (
            description !== trim(fresh.description) ||
            image !== trim(fresh.image)
          ) {
            setNotice(NOT_SAVED_NOTICE);
          }
        }

        await onSaved?.();
      } catch (error) {
        const fieldErrors = readFieldErrors(error);
        setErrors(fieldErrors);
        if (Object.keys(fieldErrors).length === 0) {
          setFormError(SAVE_ERROR);
        }
      } finally {
        setSaving(false);
      }
      return;
    }

    const slug = trim(form.slug);
    const payload = {
      name,
      description: trim(form.description),
      image: trim(form.image),
      status: Number(form.status),
    };
    if (slug) {
      payload.slug = slug;
    }

    setSaving(true);
    try {
      await createCategory(payload);
      await onSaved?.();
      onClose();
    } catch (error) {
      const fieldErrors = readFieldErrors(error);
      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) {
        setFormError(SAVE_ERROR);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 px-4 py-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
        className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2
          id="category-form-title"
          className="text-lg font-bold text-slate-900"
        >
          {isEdit ? "Edit category" : "Add category"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit
            ? "Update this category's details."
            : "Create a new category for tours."}
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="category-name"
              className="text-sm font-medium text-slate-700"
            >
              Name
            </label>
            <input
              id="category-name"
              type="text"
              maxLength={255}
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className={inputClass}
              placeholder="e.g. Beach"
            />
            {errors.name && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="category-slug"
              className="text-sm font-medium text-slate-700"
            >
              Slug
            </label>
            <input
              id="category-slug"
              type="text"
              value={form.slug}
              onChange={(event) => updateField("slug", event.target.value)}
              readOnly={isEdit}
              className={`${inputClass} ${
                isEdit ? "bg-slate-50 text-slate-500" : ""
              }`}
              placeholder="beach"
            />
            <p className="mt-1 text-xs text-slate-400">
              {isEdit
                ? "The slug cannot be changed."
                : "Generated automatically if empty"}
            </p>
            {errors.slug && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.slug}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="category-description"
              className="text-sm font-medium text-slate-700"
            >
              Description
            </label>
            <textarea
              id="category-description"
              rows={3}
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
              placeholder="A short description of this category."
            />
            {errors.description && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="category-image"
                className="text-sm font-medium text-slate-700"
              >
                Image URL or path
              </label>
              <input
                id="category-image"
                type="text"
                value={form.image}
                onChange={(event) => updateField("image", event.target.value)}
                className={inputClass}
                placeholder="https://... or /images/beach.jpg"
              />
              {errors.image && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {errors.image}
                </p>
              )}
              <div className="mt-3">
                <ImagePreview
                  key={trim(form.image)}
                  src={trim(form.image)}
                  alt="Category preview"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="category-status"
                className="text-sm font-medium text-slate-700"
              >
                Status
              </label>
              <select
                id="category-status"
                value={String(form.status)}
                onChange={(event) =>
                  updateField("status", Number(event.target.value))
                }
                className={inputClass}
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {errors.status}
                </p>
              )}
            </div>
          </div>

          {formError && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {formError}
            </p>
          )}

          {notice && (
            <p
              role="status"
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
            >
              {notice}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : isEdit ? "Save changes" : "Add category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
