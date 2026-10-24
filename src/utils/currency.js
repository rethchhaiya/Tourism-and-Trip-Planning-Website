const DEFAULT_CURRENCY = "USD";

export function formatCurrency(value, currency = DEFAULT_CURRENCY) {
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount)) {
    return "";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
