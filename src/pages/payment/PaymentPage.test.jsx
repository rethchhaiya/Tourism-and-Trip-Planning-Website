// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../context/AuthContext";
import { cancelBooking } from "../../services/bookingService";
import { checkPaymentStatus } from "../../services/paymentService";
import { saveBookingResult } from "../../utils/bookingStorage";
import PaymentPage from "./PaymentPage";

vi.mock("../../services/paymentService", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, checkPaymentStatus: vi.fn() };
});

vi.mock("../../services/bookingService", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, cancelBooking: vi.fn() };
});

vi.mock("../../components/Header", () => ({
  default: () => <header data-testid="header" />,
}));

vi.mock("../../components/Footer", () => ({
  default: () => <footer data-testid="footer" />,
}));

const SESSION_KEY = "traveladmin.session";
const BOOKING_KEY = "traveladmin.booking.99";
const FAKE_QR =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l9vJXwAAAABJRU5ErkJggg==";
const UNSAFE_QR = "javascript:alert('qr')";
const UNSAFE_DEEPLINK = "http://not-allowed.example/pay";
const SECRET_QR = "SECRET-QR-STRING";

const CUSTOMER = {
  id: 7,
  name: "Customer",
  email: "customer@example.com",
  roles: [{ id: 5, name: "customer", type: "user" }],
};

const OTHER_CUSTOMER = {
  id: 8,
  name: "Other",
  email: "other@example.com",
  roles: [{ id: 5, name: "customer", type: "user" }],
};

function seedSession(user) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ token: "test-token", user }),
  );
}

function buildResult({
  owner = CUSTOMER,
  status = "pending",
  qrImage = FAKE_QR,
  deeplink = "abamobilebank://pay?tran=1",
  appStore = "https://apps.apple.com/app/aba",
  playStore = "https://play.google.com/store/apps/details?id=aba",
  withGateway = true,
  gatewayError = null,
} = {}) {
  return {
    booking: {
      id: 99,
      total_price: "250.00",
      status: "pending",
      tour_id: 5,
      user: { id: owner.id },
    },
    payment: {
      id: 1,
      booking_id: 99,
      amount: "250.00",
      payment_method: "aba_pay",
      payment_status: status,
      transaction_id: "tx-1",
    },
    gateway: withGateway
      ? gatewayError
        ? { remote_id: null, response: gatewayError }
        : {
            tran_id: "tran-1",
            status,
            response: {
              qrString: SECRET_QR,
              qrImage,
              abapay_deeplink: deeplink,
              app_store: appStore,
              play_store: playStore,
              description: "Scan to pay",
              status: {},
            },
          }
      : null,
  };
}

const LIVE_GATEWAY_ERROR = {
  status: "error",
  code: 404,
  message: "Application not found",
  request_id: "req-123",
};

function saveResult(options) {
  const result = buildResult(options);
  saveBookingResult(result);
  return result;
}

function renderPaymentPage({ user = CUSTOMER, bookingId = "99" } = {}) {
  if (user) {
    seedSession(user);
  }

  return render(
    <MemoryRouter initialEntries={[`/payment/${bookingId}`]}>
      <AuthProvider>
        <Routes>
          <Route path="/payment/:bookingId" element={<PaymentPage />} />
          <Route path="/tours/catalog" element={<div>tour-list</div>} />
          <Route path="/tours/:id" element={<div>tour-page</div>} />
          <Route path="/" element={<div>home-page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function renderPayment(options) {
  const view = renderPaymentPage(options);
  await act(async () => {});
  return view;
}

async function advance(ms) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  checkPaymentStatus.mockReset();
  checkPaymentStatus.mockResolvedValue({ status: "pending", unknown: false });
  cancelBooking.mockReset();
  cancelBooking.mockResolvedValue({ id: 99, status: "cancelled" });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("PaymentPage display", () => {
  it("renders the QR from a safe data URI and never shows qrString", async () => {
    saveResult();
    await renderPayment();

    expect(screen.getByAltText("Payment QR code").getAttribute("src")).toBe(
      FAKE_QR,
    );
    expect(screen.queryByText(SECRET_QR)).toBeNull();
    expect(screen.getByText("#99")).toBeTruthy();
    expect(screen.getByText("$250.00")).toBeTruthy();
    expect(screen.getByText("ABA Pay")).toBeTruthy();
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
  });

  it("rejects unsafe QR images and deeplinks", async () => {
    saveResult({
      qrImage: UNSAFE_QR,
      deeplink: UNSAFE_DEEPLINK,
    });
    await renderPayment();

    expect(screen.queryByAltText("Payment QR code")).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Open ABA Mobile" }),
    ).toBeNull();
    expect(screen.queryByText(UNSAFE_QR)).toBeNull();
    expect(screen.queryByText(UNSAFE_DEEPLINK)).toBeNull();
    expect(screen.getByText("Your booking is pending payment")).toBeTruthy();
  });

  it("shows the not-available state when nothing is stored", async () => {
    await renderPayment();

    expect(
      screen.getByText("Payment details are not available here"),
    ).toBeTruthy();
    expect(screen.getByText(/Booking #99/)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Browse tours" }).getAttribute("href"),
    ).toBe("/tours/catalog");
  });

  it("shows the not-available state to a different user", async () => {
    saveResult({ owner: CUSTOMER });
    await renderPayment({ user: OTHER_CUSTOMER });

    expect(
      screen.getByText("Payment details are not available here"),
    ).toBeTruthy();
    expect(screen.queryByAltText("Payment QR code")).toBeNull();
    expect(screen.queryByText("#99")).toBeNull();
  });

  it("hides store links on desktop", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: false }),
    );
    saveResult();
    await renderPayment();

    expect(screen.queryByRole("link", { name: "App Store" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Google Play" })).toBeNull();
  });

  it("shows safe store links on mobile", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true }),
    );
    saveResult();
    await renderPayment();

    expect(
      screen.getByRole("link", { name: "App Store" }).getAttribute("href"),
    ).toBe("https://apps.apple.com/app/aba");
    expect(
      screen.getByRole("link", { name: "Google Play" }).getAttribute("href"),
    ).toBe("https://play.google.com/store/apps/details?id=aba");
  });

  it("shows the no-online-payment block when the gateway is missing", async () => {
    saveResult({ withGateway: false });
    await renderPayment();

    expect(
      screen.getByText(
        "Online payment is not available right now. Your booking has been saved as pending.",
      ),
    ).toBeTruthy();
    expect(screen.queryByAltText("Payment QR code")).toBeNull();
    expect(screen.queryByText("Your booking is pending payment")).toBeNull();
  });
});

describe("PaymentPage without online payment", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("shows the block for the live gateway error shape and never polls", async () => {
    saveResult({ gatewayError: LIVE_GATEWAY_ERROR });
    await renderPayment();

    expect(
      screen.getByText(
        "Online payment is not available right now. Your booking has been saved as pending.",
      ),
    ).toBeTruthy();
    expect(screen.getAllByText("#99").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$250.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ABA Pay").length).toBeGreaterThan(0);
    expect(screen.queryByAltText("Payment QR code")).toBeNull();
    expect(screen.queryByText("Your booking is pending payment")).toBeNull();
    expect(screen.queryByRole("button", { name: "Check again" })).toBeNull();

    await advance(15000);
    expect(checkPaymentStatus).not.toHaveBeenCalled();
  });

  it("never renders the gateway message, code, or request id", async () => {
    saveResult({ gatewayError: LIVE_GATEWAY_ERROR });
    await renderPayment();

    expect(screen.queryByText("Application not found")).toBeNull();
    expect(screen.queryByText("404")).toBeNull();
    expect(screen.queryByText("req-123")).toBeNull();
    expect(screen.queryByText(/Application not found/i)).toBeNull();
  });

  it("cancels the booking after confirmation", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    saveResult({ gatewayError: LIVE_GATEWAY_ERROR });
    await renderPayment();

    const button = screen.getByRole("button", {
      name: "Cancel this booking",
    });
    await act(async () => {
      fireEvent.click(button);
    });
    await act(async () => {});

    expect(confirmSpy).toHaveBeenCalled();
    expect(cancelBooking).toHaveBeenCalledWith(99);
    expect(screen.getByText("This booking has been cancelled.")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Cancel this booking" }),
    ).toBeNull();
  });

  it("does not cancel when the confirmation is dismissed", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    saveResult({ gatewayError: LIVE_GATEWAY_ERROR });
    await renderPayment();

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Cancel this booking" }),
      );
    });

    expect(confirmSpy).toHaveBeenCalled();
    expect(cancelBooking).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Cancel this booking" }),
    ).toBeTruthy();
  });

  it("hides the cancel button without cancel_bookings", async () => {
    saveResult({ gatewayError: LIVE_GATEWAY_ERROR });
    await renderPayment({
      user: {
        ...CUSTOMER,
        roles: [{ id: 4, name: "tour_guide", type: "admin" }],
      },
    });

    expect(
      screen.getByText(
        "Online payment is not available right now. Your booking has been saved as pending.",
      ),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Cancel this booking" }),
    ).toBeNull();
  });

  it("links to the tour list", async () => {
    saveResult({ gatewayError: LIVE_GATEWAY_ERROR });
    await renderPayment();

    expect(
      screen.getByRole("link", { name: "Browse tours" }).getAttribute("href"),
    ).toBe("/tours/catalog");
  });
});

describe("PaymentPage polling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("polls every 5 seconds and stops on paid", async () => {
    checkPaymentStatus
      .mockResolvedValueOnce({ status: "pending", unknown: false })
      .mockResolvedValueOnce({ status: "paid", unknown: false });
    saveResult();
    await renderPayment();

    expect(checkPaymentStatus).not.toHaveBeenCalled();

    await advance(5000);
    expect(checkPaymentStatus).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);

    await advance(5000);
    expect(checkPaymentStatus).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Payment confirmed")).toBeTruthy();
    expect(sessionStorage.getItem(BOOKING_KEY)).toBeNull();

    await advance(30000);
    expect(checkPaymentStatus).toHaveBeenCalledTimes(2);
  });

  it("stops polling when the page unmounts", async () => {
    saveResult();
    const view = await renderPayment();

    await advance(5000);
    expect(checkPaymentStatus).toHaveBeenCalledTimes(1);

    view.unmount();
    await advance(20000);
    expect(checkPaymentStatus).toHaveBeenCalledTimes(1);
  });

  it("stops after 60 checks", async () => {
    checkPaymentStatus.mockResolvedValue({ status: "pending", unknown: false });
    saveResult();
    await renderPayment();

    await advance(300000);
    expect(checkPaymentStatus).toHaveBeenCalledTimes(60);
    expect(
      screen.getByText("We could not confirm this payment in time."),
    ).toBeTruthy();

    await advance(5000);
    expect(checkPaymentStatus).toHaveBeenCalledTimes(60);
  });

  it("pauses while the tab is hidden", async () => {
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    saveResult();
    await renderPayment();

    await advance(15000);
    expect(checkPaymentStatus).not.toHaveBeenCalled();

    hidden.mockReturnValue(false);
    await advance(5000);
    expect(checkPaymentStatus).toHaveBeenCalledTimes(1);
  });

  it("shows the manual check button after 3 failed checks and can recover", async () => {
    checkPaymentStatus.mockRejectedValue(new Error("network down"));
    saveResult();
    await renderPayment();

    expect(
      screen.getByRole("button", { name: "Check again" }).disabled,
    ).toBe(false);

    await advance(15000);
    expect(checkPaymentStatus).toHaveBeenCalledTimes(3);
    expect(
      screen.getByText("We could not check the payment right now"),
    ).toBeTruthy();

    const button = screen.getByRole("button", { name: "Check again" });
    expect(button.disabled).toBe(false);

    checkPaymentStatus.mockResolvedValueOnce({ status: "paid", unknown: false });
    await act(async () => {
      fireEvent.click(button);
    });
    await act(async () => {});

    expect(checkPaymentStatus).toHaveBeenCalledTimes(4);
    expect(screen.getByText("Payment confirmed")).toBeTruthy();
  });

  it("treats gateway errors as failed checks and stops after 3", async () => {
    checkPaymentStatus.mockResolvedValue({ status: "error", unknown: false });
    saveResult();
    await renderPayment();

    await advance(15000);
    expect(checkPaymentStatus).toHaveBeenCalledTimes(3);
    expect(
      screen.getByText("We could not check the payment right now"),
    ).toBeTruthy();

    const button = screen.getByRole("button", { name: "Check again" });
    expect(button.disabled).toBe(false);

    await advance(30000);
    expect(checkPaymentStatus).toHaveBeenCalledTimes(3);

    checkPaymentStatus.mockResolvedValueOnce({ status: "paid", unknown: false });
    await act(async () => {
      fireEvent.click(button);
    });
    await act(async () => {});

    expect(checkPaymentStatus).toHaveBeenCalledTimes(4);
    expect(screen.getByText("Payment confirmed")).toBeTruthy();
    expect(screen.queryByText("We could not check the payment right now")).toBeNull();
  });

  it("never renders the gateway message, code, request id, or raw text", async () => {
    checkPaymentStatus.mockResolvedValue({ status: "error", unknown: false });
    saveResult();
    await renderPayment();

    await advance(15000);
    expect(
      screen.getByText("We could not check the payment right now"),
    ).toBeTruthy();
    expect(screen.queryByText("Application not found")).toBeNull();
    expect(screen.queryByText("Payment status retrieved successfully.")).toBeNull();
    expect(screen.queryByText("404")).toBeNull();
    expect(screen.queryByText("req-123")).toBeNull();
  });

  it("stops polling after 10 unknown responses", async () => {
    checkPaymentStatus.mockResolvedValue({ status: "pending", unknown: true });
    saveResult();
    await renderPayment();

    await advance(50000);
    expect(checkPaymentStatus).toHaveBeenCalledTimes(10);
    expect(
      screen.getByText("We could not check the payment right now"),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Check again" }).disabled,
    ).toBe(false);

    await advance(30000);
    expect(checkPaymentStatus).toHaveBeenCalledTimes(10);
  });

  it("resumes polling from the manual check after unknown responses", async () => {
    checkPaymentStatus.mockResolvedValue({ status: "pending", unknown: true });
    saveResult();
    await renderPayment();

    await advance(50000);
    expect(checkPaymentStatus).toHaveBeenCalledTimes(10);

    checkPaymentStatus.mockResolvedValueOnce({ status: "paid", unknown: false });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Check again" }));
    });
    await act(async () => {});

    expect(checkPaymentStatus).toHaveBeenCalledTimes(11);
    expect(screen.getByText("Payment confirmed")).toBeTruthy();
  });
});
