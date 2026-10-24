import { useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const guides = [
  {
    id: 1,
    fullName: "Sok Dara",
    phoneNumber: "+855 12 345 678",
    licenseNumber: "LIC-2024-001",
  },
  {
    id: 2,
    fullName: "Lena Ferreira",
    phoneNumber: "+855 17 456 789",
    licenseNumber: "LIC-2024-002",
  },
  {
    id: 3,
    fullName: "James Wu",
    phoneNumber: "+855 10 567 890",
    licenseNumber: "LIC-2024-003",
  },
];

export default function GuildList() {
  const [guideList, setGuideList] = useState(guides);
  const [search, setSearch] = useState("");

  const filteredGuides = guideList.filter(
    (guide) =>
      guide.fullName.toLowerCase().includes(search.toLowerCase()) ||
      guide.phoneNumber.toLowerCase().includes(search.toLowerCase()),
  );

  const addGuide = () => {
    const nextId = guideList.length
      ? Math.max(...guideList.map((guide) => guide.id)) + 1
      : 1;

    setGuideList((currentGuides) => [
      ...currentGuides,
      {
        id: nextId,
        fullName: "New Guide",
        phoneNumber: "Not provided",
        licenseNumber: "Pending",
      },
    ]);
  };

  const removeGuide = (guideId) => {
    setGuideList((currentGuides) =>
      currentGuides.filter((guide) => guide.id !== guideId),
    );
  };

  return (
    <div className="min-h-screen bg-[#f1f3ff] p-6 text-gray-900">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Guides</h1>

          <p className="mt-1 text-sm text-gray-600">
            View and manage registered guides
          </p>
        </div>

        <div className="rounded-md border border-[#c9c9df] bg-white/40 px-4 py-3">
            <p className="text-xs font-medium tracking-wider text-gray-500">
              TOTAL GUIDES
            </p>

            <p className="mt-1 text-2xl font-bold text-indigo-700">
              {guideList.length}
            </p>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-lg border border-[#c9c9df] bg-white/50">
        {/* Filters */}
        <div className="flex items-center justify-between border-b border-[#c9c9df] p-4">
          {/* Search */}
          <div className="relative w-80">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              type="text"
              placeholder="Search guides by name or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-[#c5c5dc] bg-white px-10 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <FilterButton text="Status: All" />

            <FilterButton text="Region: All" />

            <FilterButton text="Sort: Newest" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-[#c9c9df] bg-[#e8ecff] text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                <th className="px-4 py-3">ID</th>

                <th className="px-4 py-3">Full Name</th>

                <th className="px-4 py-3">Phone Number</th>

                <th className="px-4 py-3">License Number</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {filteredGuides.map((guide) => (
                <tr
                  key={guide.id}
                  className="border-b border-[#d2d2e2] last:border-0 hover:bg-indigo-50/40"
                >
                  <td className="px-4 py-3 font-medium">{guide.id}</td>

                  <td className="px-4 py-3 font-semibold">{guide.fullName}</td>

                  <td className="px-4 py-3 text-gray-600">
                    {guide.phoneNumber}
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span>{guide.licenseNumber}</span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={addGuide}
                          className="flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                        >
                          <Plus size={14} />
                          Add
                        </button>

                        <button
                          type="button"
                          onClick={() => removeGuide(guide.id)}
                          className="flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                          Remove
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">1</span> to{" "}
            <span className="font-medium">{filteredGuides.length}</span> of{" "}
            <span className="font-medium">{guideList.length}</span> results
          </p>

          <div className="flex items-center gap-1">
            <button
              disabled
              className="flex items-center gap-1 rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-400"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <button className="rounded bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white">
              1
            </button>

            <button className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-100">
              2
            </button>

            <button className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-100">
              3
            </button>

            <span className="px-2 text-gray-500">...</span>

            <button className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-100">
              42
            </button>

            <button className="flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-100">
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Components ---------------- */

function FilterButton({ text }) {
  return (
    <button className="flex items-center gap-2 rounded-md border border-[#c5c5dc] bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
      {text}
      <ChevronDown size={16} />
    </button>
  );
}
