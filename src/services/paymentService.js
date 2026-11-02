import { http } from "./httpClient";

const STATUS_ALIASES = {
  paid: "paid",
  success: "paid",
  approved: "paid",
  failed: "failed",
  failure: "failed",
  declined: "failed",
  rejected: "failed",
  pending: "pending",
  processing: "pending",
  refunded: "refunded",
};

const STATUS_READERS = [
  (raw) => raw?.payment_status,
  (raw) => raw?.data?.payment_status,
  (raw) => raw?.data?.status,
  (raw) => raw?.status,
];

function collectResponseKeys(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return [];
  }

  const keys = Object.keys(raw);
  if (raw.data && typeof raw.data === "object" && !Array.isArray(raw.data)) {
    keys.push(...Object.keys(raw.data).map((key) => `data.${key}`));
  }
  return keys;
}

function normalizeStatus(value) {
  if (typeof value !== "string") {
    return null;
  }

  const status = value.trim().toLowerCase();
  return STATUS_ALIASES[status] ?? null;
}

function isGatewayError(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return false;
  }

  const data = raw.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    if (
      typeof data.status === "string" &&
      data.status.trim().toLowerCase() === "error"
    ) {
      return true;
    }
    if (
      typeof data.code === "number" &&
      Number.isFinite(data.code) &&
      data.code >= 400
    ) {
      return true;
    }
  }

  return raw.success === false;
}

// TODO(undocumented-response): confirm the real paid and pending values for
// GET /payments/{tran_id}/check-status. Until then probe the known key names and
// fall back to "pending" with unknown=true rather than assuming success.
export function mapPaymentStatus(raw) {
  if (isGatewayError(raw)) {
    return { status: "error", unknown: false };
  }

  for (const readStatus of STATUS_READERS) {
    const status = normalizeStatus(readStatus(raw));
    if (status) {
      return { status, unknown: false };
    }
  }

  if (import.meta.env.DEV) {
    const keys = collectResponseKeys(raw);
    const code =
      raw && typeof raw === "object" ? raw.data?.code ?? raw.code : undefined;
    console.warn(
      `[paymentService] Unrecognised payment status response. Keys: ${
        keys.join(", ") || "(none)"
      }${typeof code === "number" ? `. Code: ${code}` : ""}`,
    );
  }

  return { status: "pending", unknown: true };
}

export async function checkPaymentStatus(tranId) {
  const payload = await http.get(
    `/payments/${encodeURIComponent(String(tranId))}/check-status`,
  );
  return mapPaymentStatus(payload);
}
