import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./httpClient", () => ({
  http: { get: vi.fn() },
}));

import { http } from "./httpClient";
import { checkPaymentStatus, mapPaymentStatus } from "./paymentService";

const LIVE_ERROR = {
  success: true,
  message: "Payment status retrieved successfully.",
  data: {
    status: "error",
    code: 404,
    message: "Application not found",
    request_id: "req-123",
  },
};

beforeEach(() => {
  http.get.mockReset();
});

describe("mapPaymentStatus", () => {
  it("maps the live gateway error shape to error", () => {
    const result = mapPaymentStatus(LIVE_ERROR);

    expect(result).toEqual({ status: "error", unknown: false });
    expect(JSON.stringify(result)).not.toContain("Application not found");
    expect(JSON.stringify(result)).not.toContain("req-123");
  });

  it("treats data.code >= 400 as an error", () => {
    expect(mapPaymentStatus({ data: { code: 500 } })).toEqual({
      status: "error",
      unknown: false,
    });
    expect(mapPaymentStatus({ data: { code: 400 } })).toEqual({
      status: "error",
      unknown: false,
    });
    expect(mapPaymentStatus({ data: { code: 200, status: "paid" } })).toEqual({
      status: "paid",
      unknown: false,
    });
  });

  it("treats success === false as an error", () => {
    expect(
      mapPaymentStatus({ success: false, data: { status: "pending" } }),
    ).toEqual({ status: "error", unknown: false });
  });

  it("detects data.status error case-insensitively", () => {
    expect(mapPaymentStatus({ data: { status: "ERROR" } }).status).toBe("error");
    expect(mapPaymentStatus({ data: { status: " Error " } }).status).toBe(
      "error",
    );
  });

  it.each([
    [{ payment_status: "paid" }, "paid"],
    [{ data: { payment_status: "PAID" } }, "paid"],
    [{ status: "success" }, "paid"],
    [{ data: { status: "approved" } }, "paid"],
    [{ data: { status: "failed" } }, "failed"],
    [{ status: "failure" }, "failed"],
    [{ status: "DECLINED" }, "failed"],
    [{ data: { status: "rejected" } }, "failed"],
    [{ status: "processing" }, "pending"],
    [{ data: { status: "Pending" } }, "pending"],
    [{ status: "refunded" }, "refunded"],
  ])("normalises %j to %s", (raw, expected) => {
    expect(mapPaymentStatus(raw)).toEqual({ status: expected, unknown: false });
  });

  it("prefers payment_status over the other keys", () => {
    expect(
      mapPaymentStatus({
        payment_status: "paid",
        data: { payment_status: "failed", status: "failed" },
        status: "failed",
      }).status,
    ).toBe("paid");
    expect(
      mapPaymentStatus({
        data: { payment_status: "refunded", status: "paid" },
      }).status,
    ).toBe("refunded");
  });

  it("reads data.status before top-level status", () => {
    expect(
      mapPaymentStatus({ data: { status: "paid" }, status: "failed" }).status,
    ).toBe("paid");
  });

  it("never infers paid from HTTP 200 or success alone", () => {
    expect(mapPaymentStatus({ success: true })).toEqual({
      status: "pending",
      unknown: true,
    });
    expect(mapPaymentStatus({ success: true, data: {} })).toEqual({
      status: "pending",
      unknown: true,
    });
  });

  it("returns pending with unknown=true for unrecognised shapes", () => {
    expect(mapPaymentStatus({ status: "wat" })).toEqual({
      status: "pending",
      unknown: true,
    });
    expect(mapPaymentStatus({ status: 42 })).toEqual({
      status: "pending",
      unknown: true,
    });
    expect(mapPaymentStatus({})).toEqual({
      status: "pending",
      unknown: true,
    });
    expect(mapPaymentStatus(null)).toEqual({
      status: "pending",
      unknown: true,
    });
  });
});

describe("checkPaymentStatus", () => {
  it("calls the check-status endpoint and maps the response", async () => {
    http.get.mockResolvedValue({ data: { payment_status: "paid" } });

    await expect(checkPaymentStatus("tran 1/ok")).resolves.toEqual({
      status: "paid",
      unknown: false,
    });
    expect(http.get).toHaveBeenCalledWith(
      "/payments/tran%201%2Fok/check-status",
    );
  });

  it("maps the live gateway error payload to error", async () => {
    http.get.mockResolvedValue(LIVE_ERROR);

    await expect(checkPaymentStatus("tran-1")).resolves.toEqual({
      status: "error",
      unknown: false,
    });
  });
});
