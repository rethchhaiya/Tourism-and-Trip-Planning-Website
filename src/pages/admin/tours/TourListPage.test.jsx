// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../../context/AuthContext";
import {
  deleteTour,
  listAdminTours,
  restoreTour,
} from "../../../services/adminTourService";
import TourListPage from "./TourListPage";

vi.mock("../../../services/adminTourService", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    listAdminTours: vi.fn(),
    deleteTour: vi.fn(),
    restoreTour: vi.fn(),
  };
});

const SESSION_KEY = "traveladmin.session";

const USERS = {
  admin: { roles: [{ id: 2, name: "admin", type: "admin" }] },
  tour_manager: { roles: [{ id: 3, name: "tour_manager", type: "admin" }] },
  tour_guide: { roles: [{ id: 4, name: "tour_guide", type: "admin" }] },
};

const TOURS = {
  kyoto: {
    id: 1,
    title: "Kyoto Discovery",
    slug: "kyoto-discovery",
    status: "published",
    basePrice: 1200,
    priceOverride: null,
    durationDays: 4,
    durationNights: 3,
    primaryImage: "",
  },
  beach: {
    id: 2,
    title: "Beach Escape",
    slug: "beach-escape",
    status: "DRAFT",
    basePrice: 500,
    priceOverride: 450,
    durationDays: 3,
    durationNights: 2,
    primaryImage: "",
  },
  alpine: {
    id: 3,
    title: "Alpine Adventure",
    slug: "alpine-adventure",
    status: "Archived",
    basePrice: 900,
    priceOverride: null,
    durationDays: 5,
    durationNights: 4,
    primaryImage: "",
  },
};

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.search}</div>;
}

function renderList(user, entries = ["/admin/tours"]) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ token: "test-token", user }),
  );
  return render(
    <MemoryRouter initialEntries={entries}>
      <AuthProvider>
        <TourListPage />
        <LocationProbe />
      </AuthProvider>
    </MemoryRouter>,
  );
}

function pageResult(page, tours, total = 25) {
  return {
    tours,
    meta: {
      current_page: page,
      last_page: 3,
      per_page: 10,
      total,
    },
    links: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  listAdminTours.mockResolvedValue(pageResult(1, []));
  deleteTour.mockResolvedValue({});
  restoreTour.mockResolvedValue({});
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("TourListPage", () => {
  it("uses server meta for pagination and keeps the page in the URL", async () => {
    listAdminTours.mockImplementation(({ page }) =>
      Promise.resolve(
        pageResult(page, [
          { ...TOURS.kyoto, id: page, title: `Tour page ${page}` },
        ]),
      ),
    );

    renderList(USERS.admin);

    expect(await screen.findByText("Tour page 1")).toBeDefined();
    expect(screen.getByText("Page 1 of 3")).toBeDefined();
    expect(
      screen.getByText(
        (_content, element) =>
          element?.tagName === "P" &&
          element.textContent.replace(/\s+/g, " ").trim() ===
            "Showing 1 to 10 of 25 tours",
      ),
    ).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));

    expect(await screen.findByText("Tour page 2")).toBeDefined();
    expect(screen.getByTestId("location").textContent).toBe("?page=2");
    expect(listAdminTours).toHaveBeenLastCalledWith({ page: 2 });
  });

  it("reads the initial page from the URL", async () => {
    renderList(USERS.admin, ["/admin/tours?page=2"]);

    await waitFor(() => {
      expect(listAdminTours).toHaveBeenCalledWith({ page: 2 });
    });
  });

  it("filters the loaded page by title and status case-insensitively", async () => {
    listAdminTours.mockResolvedValue(
      pageResult(1, [TOURS.kyoto, TOURS.beach, TOURS.alpine]),
    );
    renderList(USERS.admin);

    expect(await screen.findByText("Kyoto Discovery")).toBeDefined();
    expect(screen.getByText("Beach Escape")).toBeDefined();
    expect(screen.getByText("Alpine Adventure")).toBeDefined();
    expect(
      screen.getByText("Search and status filters apply to the current page only."),
    ).toBeDefined();

    fireEvent.change(screen.getByLabelText("Search tours"), {
      target: { value: "kyo" },
    });
    await waitFor(() => {
      expect(screen.queryByText("Beach Escape")).toBeNull();
    });
    expect(screen.getByText("Kyoto Discovery")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Search tours"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("Filter by status"), {
      target: { value: "draft" },
    });

    await waitFor(() => {
      expect(screen.queryByText("Kyoto Discovery")).toBeNull();
    });
    expect(screen.getByText("Beach Escape")).toBeDefined();
  });

  it("deletes a tour, offers undo for 10 seconds, and restores it", async () => {
    listAdminTours.mockResolvedValue(pageResult(1, [TOURS.kyoto]));
    renderList(USERS.admin);

    await screen.findByText("Kyoto Discovery");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(/will be hidden from the website/),
    ).toBeDefined();
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(deleteTour).toHaveBeenCalledWith(1);
    });
    expect(
      await screen.findByText("Tour deleted. It is hidden from the website."),
    ).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    await waitFor(() => {
      expect(restoreTour).toHaveBeenCalledWith(1);
    });
    expect(await screen.findByText("Tour restored.")).toBeDefined();
    await waitFor(() => {
      expect(listAdminTours.mock.calls.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("shows an unsafe delete error as a generic message", async () => {
    listAdminTours.mockResolvedValue(pageResult(1, [TOURS.kyoto]));
    deleteTour.mockRejectedValue({
      status: 500,
      message: "x".repeat(250),
      exception: "SQLSTATE",
      file: "/app/Tour.php",
    });
    renderList(USERS.admin);

    await screen.findByText("Kyoto Discovery");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(
      await within(dialog).findByText(
        "Could not delete this tour. Please try again.",
      ),
    ).toBeDefined();
  });

  it("restores a deleted tour by ID for admins", async () => {
    renderList(USERS.admin);

    expect(await screen.findByText("No tours found.")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Tour ID to restore"), {
      target: { value: "42" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));

    await waitFor(() => {
      expect(restoreTour).toHaveBeenCalledWith(42);
    });
    expect(await screen.findByText("Tour restored.")).toBeDefined();
    expect(listAdminTours.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("validates the restore ID", async () => {
    renderList(USERS.admin);

    await screen.findByText("No tours found.");
    fireEvent.change(screen.getByLabelText("Tour ID to restore"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));

    expect(screen.getByText("Enter a valid tour ID.")).toBeDefined();
    expect(restoreTour).not.toHaveBeenCalled();
  });

  it("limits delete and restore controls to admins", async () => {
    listAdminTours.mockResolvedValue(pageResult(1, [TOURS.kyoto]));

    const { unmount } = renderList(USERS.tour_manager);
    await screen.findByText("Kyoto Discovery");
    expect(screen.getByText("Add tour")).toBeDefined();
    expect(screen.getByRole("link", { name: "Edit" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(screen.queryByLabelText("Tour ID to restore")).toBeNull();
    unmount();
    cleanup();

    renderList(USERS.tour_guide);
    await screen.findByText("Kyoto Discovery");
    expect(screen.queryByText("Add tour")).toBeNull();
    expect(screen.getByRole("link", { name: "View" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(screen.queryByLabelText("Tour ID to restore")).toBeNull();
  });

  it("shows empty and error states with retry", async () => {
    renderList(USERS.admin);
    expect(await screen.findByText("No tours found.")).toBeDefined();
    cleanup();

    listAdminTours.mockRejectedValueOnce({ status: 500 });
    renderList(USERS.admin);
    expect(await screen.findByText("Could not load tours.")).toBeDefined();

    listAdminTours.mockResolvedValueOnce(pageResult(1, [TOURS.kyoto]));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Kyoto Discovery")).toBeDefined();
  });
});
