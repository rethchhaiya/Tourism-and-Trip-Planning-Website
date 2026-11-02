import { beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "./httpClient";
import {
  listCategories,
  normalizeCategory,
  updateCategory,
} from "./adminCategoryService";

vi.mock("./httpClient", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("adminCategoryService", () => {
  it("normalizes categories with missing fields", () => {
    expect(normalizeCategory({ id: 3, name: "Beach", status: 0 })).toEqual({
      id: 3,
      name: "Beach",
      slug: "",
      description: "",
      image: "",
      status: 0,
      createdAt: null,
      updatedAt: null,
    });

    expect(normalizeCategory(null)).toMatchObject({
      id: null,
      name: "",
      slug: "",
      description: "",
      image: "",
      status: 1,
    });
  });

  it("accepts arrays and data envelopes from the list endpoint", async () => {
    http.get.mockResolvedValueOnce([
      { id: 1, name: "Beach", status: "1" },
    ]);
    await expect(listCategories()).resolves.toEqual([
      expect.objectContaining({ id: 1, name: "Beach", status: 1 }),
    ]);

    http.get.mockResolvedValueOnce({
      data: [{ id: 2, name: "Mountain", status: 0 }],
    });
    await expect(listCategories()).resolves.toEqual([
      expect.objectContaining({ id: 2, name: "Mountain", status: 0 }),
    ]);
  });

  it("sends search and status filters", async () => {
    http.get.mockResolvedValueOnce([]);
    await listCategories({ search: "  sun  ", status: 0 });

    expect(http.get).toHaveBeenCalledWith("/categories?search=sun&status=0");
  });

  it("updates a category with PUT", async () => {
    http.put.mockResolvedValueOnce({ id: 4, name: "Updated", status: 1 });
    await updateCategory(4, { name: "Updated" });

    expect(http.put).toHaveBeenCalledWith("/categories/4", {
      name: "Updated",
    });
  });
});
