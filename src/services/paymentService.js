import { http } from "./httpClient";

const PAYMENT_STATUSES = new Set(["pending", "paid", "failed", "refunded"]);

const STATUS_READERS = [
  (raw) => raw?.payment_status,
  (raw) => raw?.data?.payment_status,
  (raw) => raw?.status,
  (raw) => raw?.data?.status,
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
  return PAYMENT_STATUSES.has(status) ? status : null;
}

// TODO(undocumented-response): GET /payments/{tran_id}/check-status has no
// documented response body. Confirm the real shape, then replace the key
// probing below with a fixed field read.
export function mapPaymentStatus(raw) {
  for (const readStatus of STATUS_READERS) {
    const status = normalizeStatus(readStatus(raw));
    if (status) {
      return status;
    }
  }

  if (import.meta.env.DEV && raw !== null && raw !== undefined) {
    const keys = collectResponseKeys(raw);
    console.warn(
      `[paymentService] Unrecognised payment status response. Keys: ${
        keys.join(", ") || "(none)"
      }`,
    );
  }

  return "pending";
} 

export async function checkPaymentStatus(tranId) {
  const payload = await http.get(
    `/payments/${encodeURIComponent(String(tranId))}/check-status`,
  );
  return mapPaymentStatus(payload);
}
