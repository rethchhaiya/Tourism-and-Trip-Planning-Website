import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ImageOff,
  RotateCw,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { resolveApiErrorMessage } from "../../../utils/apiError";
import {
  deleteTourImage,
  listTourImages,
  resolveImageCandidates,
  setPrimaryImage,
  updateTourImage,
  uploadTourImage,
} from "../../../services/tourImageService";
import {
  ACCEPT_ATTRIBUTE,
  DELETE_CONFIRM_MESSAGE,
  prepareUploadFiles,
  validateImageFile,
} from "./tourImageFiles";

const LARGE_FILE_MESSAGE = "The file is too large for the server";
const LARGE_NETWORK_THRESHOLD = 4 * 1024 * 1024;
const LOAD_FALLBACK = "Could not load images.";
const UPLOAD_FALLBACK = "Could not upload this image. Please try again.";
const PRIMARY_FALLBACK = "Could not set this image as primary.";
const STATUS_FALLBACK = "Could not change this image's status.";
const REPLACE_FALLBACK = "Could not replace this image.";
const DELETE_FALLBACK = "Could not delete this image. Please try again.";
const EMPTY_IMAGES = Object.freeze([]);

const UPLOAD_STATUS_LABELS = {
  waiting: "Waiting",
  uploading: "Uploading...",
  done: "Done",
  failed: "Failed",
  rejected: "Rejected",
};

function firstFieldError(error) {
  const errors = error?.errors;
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) {
    return null;
  }
  for (const value of Object.values(errors)) {
    const message = Array.isArray(value) ? value[0] : value;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }
  return null;
}

function uploadErrorMessage(error, file) {
  if (error?.status === 413) {
    return LARGE_FILE_MESSAGE;
  }
  if (
    error?.status === 0 &&
    Number(file?.size ?? 0) >= LARGE_NETWORK_THRESHOLD
  ) {
    return LARGE_FILE_MESSAGE;
  }
  if (error?.status === 422) {
    const fieldMessage = firstFieldError(error);
    if (fieldMessage) {
      return resolveApiErrorMessage({ message: fieldMessage }, UPLOAD_FALLBACK);
    }
  }
  return resolveApiErrorMessage(error, UPLOAD_FALLBACK);
}

function revokeObjectUrl(url) {
  if (
    url &&
    typeof URL !== "undefined" &&
    typeof URL.revokeObjectURL === "function"
  ) {
    URL.revokeObjectURL(url);
  }
}

function createObjectUrl(file) {
  if (
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    return null;
  }
  try {
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
}

function warnFailedCandidate(src, index) {
  if (!import.meta.env.DEV) {
    return;
  }

  // Host and path only: never include query strings or tokens.
  let target = src.split("?")[0];
  try {
    const url = new URL(src);
    target = `${url.host}${url.pathname}`;
  } catch {
    // Keep the query-free fallback above.
  }

  console.warn(
    `[TourImagesSection] Image candidate ${index} failed to load: ${target}`,
  );
}

function ImagePreview({ sources, alt, className = "h-40 w-full" }) {
  const list = (Array.isArray(sources) ? sources : [sources]).filter(
    (value) => typeof value === "string" && value,
  );
  const signature = list.join("\n");
  const [previousSignature, setPreviousSignature] = useState(signature);
  const [index, setIndex] = useState(0);
  const warnedRef = useRef(new Set());

  const signatureChanged = previousSignature !== signature;
  if (signatureChanged) {
    setPreviousSignature(signature);
    setIndex(0);
  }

  const currentIndex = signatureChanged ? 0 : index;
  const src = list[currentIndex] ?? null;

  function handleError() {
    if (!src) {
      return;
    }
    if (!warnedRef.current.has(src)) {
      warnedRef.current.add(src);
      warnFailedCandidate(src, currentIndex);
    }
    setIndex(currentIndex + 1);
  }

  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400 ${className}`}
      >
        <ImageOff size={22} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={handleError}
      className={`rounded-lg border border-slate-200 object-cover ${className}`}
    />
  );
}

function StatusBadge({ status }) {
  const inactive = status === "INACTIVE";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        inactive
          ? "bg-slate-100 text-slate-600"
          : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {status ?? "UNKNOWN"}
    </span>
  );
}

export default function TourImagesSection({ tourId, canManage = false }) {
  const [result, setResult] = useState({
    key: null,
    status: "loading",
    images: [],
  });
  const [reloadKey, setReloadKey] = useState(0);

  const hasValidTourId =
    tourId !== null && tourId !== undefined && !Number.isNaN(Number(tourId));

  const requestKey = `${tourId ?? ""}\u0000${reloadKey}`;
  const images = useMemo(() => {
    if (!hasValidTourId || result.key !== requestKey) {
      return EMPTY_IMAGES;
    }
    return [...result.images].sort(
      (first, second) => Number(second.isPrimary) - Number(first.isPrimary),
    );
  }, [hasValidTourId, result, requestKey]);
  const loadState = !hasValidTourId
    ? "error"
    : result.key === requestKey
      ? result.status
      : "loading";

  const [uploadItems, setUploadItems] = useState([]);
  const [makeFirstPrimary, setMakeFirstPrimary] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("ACTIVE");
  const [uploadingBatch, setUploadingBatch] = useState(false);

  const [busy, setBusy] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [primaryNote, setPrimaryNote] = useState("");

  const mountedRef = useRef(true);
  const previewUrlsRef = useRef(new Map());
  const nextKeyRef = useRef(0);

  useEffect(() => {
    if (!hasValidTourId) {
      return undefined;
    }

    let cancelled = false;
    const key = requestKey;

    listTourImages(tourId)
      .then((next) => {
        if (!cancelled) {
          setResult({ key, status: "ready", images: next });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ key, status: "error", images: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasValidTourId, tourId, reloadKey, requestKey]);

  useEffect(() => {
    mountedRef.current = true;
    const previews = previewUrlsRef.current;
    return () => {
      mountedRef.current = false;
      for (const url of previews.values()) {
        revokeObjectUrl(url);
      }
      previews.clear();
    };
  }, []);

  function refresh() {
    if (mountedRef.current) {
      setReloadKey((key) => key + 1);
    }
  }

  function revokePreview(key) {
    const url = previewUrlsRef.current.get(key);
    if (url) {
      revokeObjectUrl(url);
      previewUrlsRef.current.delete(key);
    }
  }

  function clearUploadBatch() {
    for (const url of previewUrlsRef.current.values()) {
      revokeObjectUrl(url);
    }
    previewUrlsRef.current.clear();
    setUploadItems([]);
  }

  function handleFilesSelected(event) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    clearUploadBatch();

    if (files.length === 0) {
      return;
    }

    const nextItems = prepareUploadFiles(files).map(({ file, reason }) => {
      const key = `image-${nextKeyRef.current++}`;
      let previewUrl = null;
      if (!reason) {
        previewUrl = createObjectUrl(file);
        if (previewUrl) {
          previewUrlsRef.current.set(key, previewUrl);
        }
      }
      return {
        key,
        file,
        previewUrl,
        status: reason ? "rejected" : "waiting",
        error: reason ?? "",
        isPrimary: false,
      };
    });

    setUploadItems(nextItems);
  }

  async function uploadOne(item) {
    if (mountedRef.current) {
      setUploadItems((previous) =>
        previous.map((entry) =>
          entry.key === item.key
            ? { ...entry, status: "uploading", error: "" }
            : entry,
        ),
      );
    }

    try {
      const uploaded = await uploadTourImage({
        tourId,
        file: item.file,
        isPrimary: item.isPrimary,
        status: uploadStatus,
      });
      const previewSources = uploaded ? resolveImageCandidates(uploaded) : [];
      revokePreview(item.key);
      if (mountedRef.current) {
        setUploadItems((previous) =>
          previous.map((entry) =>
            entry.key === item.key
              ? {
                  ...entry,
                  status: "done",
                  previewUrl: null,
                  previewSources,
                  error: "",
                }
              : entry,
          ),
        );
      }
    } catch (error) {
      if (mountedRef.current) {
        setUploadItems((previous) =>
          previous.map((entry) =>
            entry.key === item.key
              ? {
                  ...entry,
                  status: "failed",
                  error: uploadErrorMessage(error, item.file),
                }
              : entry,
          ),
        );
      }
    }
  }

  async function startUpload() {
    const waiting = uploadItems.filter((item) => item.status === "waiting");
    if (uploadingBatch || waiting.length === 0) {
      return;
    }

    const firstKey = makeFirstPrimary ? waiting[0].key : null;
    setUploadingBatch(true);
    setUploadItems((previous) =>
      previous.map((entry) =>
        entry.key === firstKey ? { ...entry, isPrimary: true } : entry,
      ),
    );

    try {
      for (const item of waiting) {
        await uploadOne({
          ...item,
          isPrimary: item.key === firstKey,
        });
      }
      refresh();
    } finally {
      if (mountedRef.current) {
        setUploadingBatch(false);
      }
    }
  }

  async function retryItem(item) {
    if (uploadingBatch) {
      return;
    }
    setUploadingBatch(true);
    try {
      await uploadOne(item);
      refresh();
    } finally {
      if (mountedRef.current) {
        setUploadingBatch(false);
      }
    }
  }

  async function handleSetPrimary(image) {
    if (!canManage || image.isPrimary || busy) {
      return;
    }

    setBusy({ id: image.id, action: "primary" });
    setActionError(null);
    setPrimaryNote("");
    try {
      await setPrimaryImage(image.id);
      refresh();
    } catch (error) {
      setActionError({
        id: image.id,
        message: resolveApiErrorMessage(error, PRIMARY_FALLBACK),
      });
    } finally {
      if (mountedRef.current) {
        setBusy(null);
      }
    }
  }

  async function handleToggleStatus(image) {
    if (!canManage || busy) {
      return;
    }

    const nextStatus = image.status === "INACTIVE" ? "ACTIVE" : "INACTIVE";
    setBusy({ id: image.id, action: "status" });
    setActionError(null);
    try {
      await updateTourImage(image.id, { status: nextStatus });
      refresh();
    } catch (error) {
      setActionError({
        id: image.id,
        message: resolveApiErrorMessage(error, STATUS_FALLBACK),
      });
    } finally {
      if (mountedRef.current) {
        setBusy(null);
      }
    }
  }

  async function handleReplace(image, file) {
    if (!canManage || busy || !file) {
      return;
    }

    const reason = validateImageFile(file);
    if (reason) {
      setActionError({ id: image.id, message: reason });
      return;
    }

    setBusy({ id: image.id, action: "replace" });
    setActionError(null);
    try {
      await updateTourImage(image.id, { file });
      refresh();
    } catch (error) {
      setActionError({
        id: image.id,
        message: resolveApiErrorMessage(error, REPLACE_FALLBACK),
      });
    } finally {
      if (mountedRef.current) {
        setBusy(null);
      }
    }
  }

  async function confirmDelete() {
    if (deleting || !deleteTarget) {
      return;
    }

    setDeleting(true);
    setDeleteError("");
    try {
      await deleteTourImage(deleteTarget.id);
      const wasPrimary = deleteTarget.isPrimary;
      setDeleteTarget(null);
      if (wasPrimary) {
        setPrimaryNote("This tour now has no primary image.");
      }
      refresh();
    } catch (error) {
      setDeleteError(resolveApiErrorMessage(error, DELETE_FALLBACK));
    } finally {
      if (mountedRef.current) {
        setDeleting(false);
      }
    }
  }

  const hasWaiting = uploadItems.some((item) => item.status === "waiting");

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="tour-images-title"
    >
      <div className="border-b border-slate-100 pb-3">
        <h2
          id="tour-images-title"
          className="text-sm font-bold text-slate-900"
        >
          Images
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Photos shown on the tour page. The primary image is used as the cover.
        </p>
      </div>

      {!canManage && (
        <p
          role="status"
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
        >
          You can view these images but only administrators can change them.
        </p>
      )}

      {loadState === "loading" && (
        <p role="status" className="mt-4 text-sm text-slate-500">
          Loading images...
        </p>
      )}

      {loadState === "error" && (
        <div className="mt-4 flex items-center gap-3 text-sm">
          <p role="alert" className="font-medium text-red-600">
            {LOAD_FALLBACK}
          </p>
          <button
            type="button"
            onClick={refresh}
            className="font-semibold text-blue-600 transition hover:text-blue-500"
          >
            Retry
          </button>
        </div>
      )}

      {loadState === "ready" && images.length === 0 && (
        <p role="status" className="mt-4 text-sm text-slate-500">
          No images yet.
        </p>
      )}

      {loadState === "ready" && images.length > 0 && (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => {
            const displaySources = resolveImageCandidates(image);
            const isBusy = Boolean(busy);
            return (
              <li
                key={
                  image.id ??
                  `position-${index}-${displaySources[0] ?? "none"}`
                }
                data-testid={`tour-image-${image.id}`}
                className="rounded-xl border border-slate-200 p-3"
              >
                <ImagePreview
                  key={`${reloadKey}:${displaySources.join("|")}`}
                  sources={displaySources}
                  alt={`Tour image ${image.id ?? ""}`.trim()}
                />

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {image.isPrimary && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                      <Star size={11} />
                      Primary
                    </span>
                  )}
                  <StatusBadge status={image.status} />
                </div>

                {canManage && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(image)}
                      disabled={image.isPrimary || isBusy}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Set primary
                    </button>

                    <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                      Replace file
                      <input
                        type="file"
                        className="sr-only"
                        accept={ACCEPT_ATTRIBUTE}
                        disabled={isBusy}
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          event.target.value = "";
                          handleReplace(image, file);
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(image)}
                      disabled={isBusy}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {image.status === "INACTIVE"
                        ? "Set active"
                        : "Set inactive"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError("");
                        setDeleteTarget(image);
                      }}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                )}

                {actionError?.id === image.id && (
                  <p
                    role="alert"
                    className="mt-2 text-xs font-medium text-red-600"
                  >
                    {actionError.message}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {primaryNote && (
        <p
          role="status"
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
        >
          {primaryNote}
        </p>
      )}

      {canManage && (
        <div className="mt-6 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-bold text-slate-900">Upload images</h3>

          <div className="mt-3 space-y-3">
            <div>
              <label
                htmlFor="tour-image-files"
                className="text-sm font-medium text-slate-700"
              >
                Choose images
              </label>
              <input
                id="tour-image-files"
                type="file"
                multiple
                accept={ACCEPT_ATTRIBUTE}
                onChange={handleFilesSelected}
                disabled={uploadingBatch}
                className="mt-1 block w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-slate-400">
                JPEG, PNG or WebP. Up to 5120 KB each, 10 files per batch.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={makeFirstPrimary}
                  onChange={(event) =>
                    setMakeFirstPrimary(event.target.checked)
                  }
                  disabled={uploadingBatch}
                />
                Make the first one primary
              </label>

              <label className="inline-flex items-center gap-2">
                Status for new images
                <select
                  value={uploadStatus}
                  onChange={(event) => setUploadStatus(event.target.value)}
                  disabled={uploadingBatch}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>
            </div>

            {uploadItems.length > 0 && (
              <ul className="space-y-2">
                {uploadItems.map((item) => (
                  <li
                    key={item.key}
                    data-testid={`upload-item-${item.key}`}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 p-2"
                  >
                    <ImagePreview
                      key={
                        item.previewSources?.[0] ??
                        item.previewUrl ??
                        item.key
                      }
                      sources={
                        item.previewSources ??
                        (item.previewUrl ? [item.previewUrl] : [])
                      }
                      alt={item.file.name}
                      className="h-14 w-14 shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {item.file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {UPLOAD_STATUS_LABELS[item.status] ?? item.status}
                      </p>
                      {item.error && (
                        <p
                          role="alert"
                          className="mt-1 text-xs font-medium text-red-600"
                        >
                          {item.error}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {item.status === "done" && (
                        <CheckCircle2
                          size={16}
                          className="text-emerald-600"
                          aria-label="Uploaded"
                        />
                      )}
                      {item.status === "failed" && (
                        <button
                          type="button"
                          onClick={() => retryItem(item)}
                          disabled={uploadingBatch}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RotateCw size={12} />
                          Retry
                        </button>
                      )}
                      {item.status === "rejected" && (
                        <AlertCircle
                          size={16}
                          className="text-amber-600"
                          aria-label="Rejected"
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={startUpload}
              disabled={uploadingBatch || !hasWaiting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UploadCloud size={15} />
              {uploadingBatch ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-tour-image-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3
              id="delete-tour-image-title"
              className="text-lg font-bold text-slate-900"
            >
              Delete image?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {DELETE_CONFIRM_MESSAGE}
            </p>

            {deleteError && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {deleteError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
                disabled={deleting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
