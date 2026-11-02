// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../../context/AuthContext";
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "../../../services/adminCategoryService";
import CategoriesAdminPage from "./CategoriesAdminPage";

vi.mock("../../../services/adminCategoryService", () => ({
  listCategories: vi.fn(),
  getCategory: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

const SESSION_KEY = "traveladmin.session";

const USERS = {
  admin: { roles: [{ id: 2, name: "admin", type: "admin" }] },
  tour_manager: { roles: [{ id: 3, name: "tour_manager", type: "admin" }] },
  customer: { roles: [{ id: 5, name: "customer", type: "user" }] },
};

const BEACH = {
  id: 7,
  name: "Beach",
  slug: "beach",
  description: "Sun and sand",
  image: "https://example.com/beach.jpg",
  status: 1,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
};

const MOUNTAIN = {
  id: 8,
  name: "Mountain",
  slug: "mountain",
  description: "High places",
  image: "",
  status: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
};

function renderPage(user) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ token: "test-token", user }),
  );
  return render(
    <AuthProvider>
      <CategoriesAdminPage />
    </AuthProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  listCategories.mockResolvedValue([]);
  getCategory.mockResolvedValue(null);
  createCategory.mockResolvedValue({});
  updateCategory.mockResolvedValue({});
  deleteCategory.mockResolvedValue({});
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("CategoriesAdminPage", () => {
  it("lists categories and filters them by status and search", async () => {
    listCategories.mockResolvedValue([BEACH, MOUNTAIN]);
    renderPage(USERS.admin);

    expect(await screen.findByText("Beach")).toBeDefined();
    expect(screen.getByText("Mountain")).toBeDefined();
    expect(screen.getByText("ACTIVE")).toBeDefined();
    expect(screen.getByText("INACTIVE")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Filter by status"), {
      target: { value: "1" },
    });

    await waitFor(() => {
      expect(screen.queryByText("Mountain")).toBeNull();
    });
    expect(screen.getByText("Beach")).toBeDefined();
    await waitFor(() => {
      expect(listCategories).toHaveBeenLastCalledWith({
        search: "",
        status: "1",
      });
    });

    fireEvent.change(screen.getByLabelText("Search categories"), {
      target: { value: "beach" },
    });

    await waitFor(() => {
      expect(listCategories).toHaveBeenLastCalledWith({
        search: "beach",
        status: "1",
      });
    });
  });

  it("shows an empty state and retries after a load error", async () => {
    listCategories.mockResolvedValueOnce([]);
    renderPage(USERS.admin);

    expect(await screen.findByText("No categories found.")).toBeDefined();
    cleanup();

    listCategories.mockRejectedValueOnce({ status: 500 });
    renderPage(USERS.admin);

    expect(
      await screen.findByText("Could not load categories."),
    ).toBeDefined();
    listCategories.mockResolvedValueOnce([BEACH]);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Beach")).toBeDefined();
  });

  it("shows management buttons according to permissions", async () => {
    listCategories.mockResolvedValue([BEACH]);

    const { unmount } = renderPage(USERS.admin);
    expect(await screen.findByRole("button", { name: "Add category" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Edit" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDefined();
    unmount();
    cleanup();

    renderPage(USERS.tour_manager);
    expect(await screen.findByRole("button", { name: "Add category" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Edit" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    cleanup();

    renderPage(USERS.customer);
    expect(await screen.findByText("Beach")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Add category" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  it("creates a category without sending an empty slug and refreshes the list", async () => {
    listCategories.mockResolvedValue([]);
    renderPage(USERS.admin);

    fireEvent.click(
      await screen.findByRole("button", { name: "Add category" }),
    );
    const dialog = await screen.findByRole("dialog");

    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "  Beach  " },
    });
    fireEvent.change(within(dialog).getByLabelText("Description"), {
      target: { value: "Sun and sand" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Add category" }),
    );

    await waitFor(() => {
      expect(createCategory).toHaveBeenCalledWith({
        name: "Beach",
        description: "Sun and sand",
        image: "",
        status: 1,
      });
    });
    expect(createCategory.mock.calls[0][0]).not.toHaveProperty("slug");
    await waitFor(() => {
      expect(listCategories.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("sends only changed fields on edit and reports unsaved description", async () => {
    listCategories.mockResolvedValue([BEACH]);
    updateCategory.mockResolvedValue({});
    getCategory.mockResolvedValue({
      ...BEACH,
      name: "Beach & Sun",
      description: "Sun and sand",
    });

    renderPage(USERS.admin);
    await screen.findByText("Beach");
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const dialog = await screen.findByRole("dialog");
    const nameInput = within(dialog).getByLabelText("Name");
    const slugInput = within(dialog).getByLabelText("Slug");

    expect(nameInput).toHaveProperty("value", "Beach");
    expect(slugInput).toHaveProperty("readOnly", true);

    fireEvent.change(nameInput, { target: { value: "Beach & Sun" } });
    fireEvent.change(within(dialog).getByLabelText("Description"), {
      target: { value: "New description" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    );

    await waitFor(() => {
      expect(updateCategory).toHaveBeenCalledWith(7, {
        name: "Beach & Sun",
        description: "New description",
      });
    });
    expect(getCategory).toHaveBeenCalledWith(7);

    expect(
      await within(dialog).findByText(
        "Some changes were not saved by the server",
      ),
    ).toBeDefined();
    expect(nameInput).toHaveProperty("value", "Beach & Sun");
    expect(within(dialog).getByLabelText("Description")).toHaveProperty(
      "value",
      "Sun and sand",
    );
  });

  it("deletes a category and refreshes the list", async () => {
    listCategories.mockResolvedValue([BEACH]);
    renderPage(USERS.admin);

    await screen.findByText("Beach");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(deleteCategory).toHaveBeenCalledWith(7);
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    await waitFor(() => {
      expect(listCategories.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows a safe delete error message from the server", async () => {
    listCategories.mockResolvedValue([BEACH]);
    deleteCategory.mockRejectedValue({
      status: 409,
      message: "Category still has tours.",
    });

    renderPage(USERS.admin);
    await screen.findByText("Beach");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(
      await within(dialog).findByText("Category still has tours."),
    ).toBeDefined();
  });

  it("falls back for unsafe delete errors", async () => {
    listCategories.mockResolvedValue([BEACH]);
    deleteCategory.mockRejectedValue({
      status: 500,
      message: "x".repeat(250),
      exception: "SQLSTATE[23000]",
      file: "/app/Models/Category.php",
    });

    renderPage(USERS.admin);
    await screen.findByText("Beach");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(
      await within(dialog).findByText(
        "Could not delete this category. It may still be used by tours.",
      ),
    ).toBeDefined();
  });
});
