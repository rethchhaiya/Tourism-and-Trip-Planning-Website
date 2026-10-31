import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./httpClient", () => ({
  http: { get: vi.fn() },
}));

import { http } from "./httpClient";
import { checkPaymentStatus, mapPaymentStatus } from "./paymentService";

beforeEach(() => {
  http.get.mockReset();
});

describe("mapPaymentStatus", () => {
  it.each([
    [{ payment_status: "paid" }, "paid"],
    [{ data: { payment_status: "failed" } }, "failed"],
    [{ status: "refunded" }, "refunded"],
    [{ data: { status: "PENDING" } }, "pending"],
    [{ data: { payment_status: "Paid" } }, "paid"],
  ])("reads the status from %j", (raw, expected) => {
    expect(mapPaymentStatus(raw)).toBe(expected);
  });

  it("returns pending for unknown, missing, or non-string values", () => {
    expect(mapPaymentStatus({ status: "processing" })).toBe("pending");
    expect(mapPaymentStatus({ status: 42 })).toBe("pending");
    expect(mapPaymentStatus({})).toBe("pending");
    expect(mapPaymentStatus(null)).toBe("pending");
  });

  it("prefers payment_status over status when both are present", () => {
    expect(
      mapPaymentStatus({
        payment_status: "paid",
        status: "failed",
      }),
    ).toBe("paid");
  });
});

describe("checkPaymentStatus", () => {
  it("calls the check-status endpoint and maps the response", async () => {
    http.get.mockResolvedValue({ data: { payment_status: "paid" } });

    await expect(checkPaymentStatus("tran 1/ok")).resolves.toBe("paid");
    expect(http.get).toHaveBeenCalledWith(
      "/payments/tran%201%2Fok/check-status",
    );
  });
});
