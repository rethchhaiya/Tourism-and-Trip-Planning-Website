import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faChevronDown,
  faEye,
  faPen,
  faTrash,
  faUserPlus,
  faUsers,
  faCircleCheck,
  faCircleXmark,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { users } from "../../../data/users";

const PAGE_SIZE = 5;

const COLUMNS = [
  "ID",
  "Name",
  "Email",
  "Phone",
  "Status",
  "Join Date",
  "Actions",
];

function StatusBadge({ status }) {
  const active = status === "Active";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
        active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      {status}
    </span>
  );
}

function PageButton({ children, active, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-medium transition ${
        active
          ? "border-[#5146e5] bg-[#5146e5] text-white shadow-sm"
          : disabled
            ? "cursor-not-allowed border-slate-200 text-slate-300"
            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function PageListUser() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesSearch = `${user.name} ${user.email} ${user.phone}`
          .toLowerCase()
          .includes(search.toLowerCase());
        return (
          matchesSearch &&
          (status === "All" || user.status === status)
        );
      }),
    [search, status]
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageUsers = filteredUsers.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );
  const start = filteredUsers.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, filteredUsers.length);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <main className="min-h-screen bg-[#f4f6fb] p-6 md:p-8">
      <div className="mx-auto max-w-375">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            {/* <div className="mb-1 flex items-center gap-1 text-xs text-slate-500">
              <span>Users</span>
              <span aria-hidden="true">›</span>
              <span className="font-medium text-[#5146e5]">List Users</span>
            </div> */}
            <h1 className="text-[26px] font-bold tracking-tight text-[#1d2433]">
              List Users
            </h1>
            <p className="mt-1 text-sm text-[#656a78]">
              View and manage registered user accounts
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-[#5146e5] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#4338ca]"
          >
            <FontAwesomeIcon icon={faUserPlus} />
            Add User
          </button>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex min-h-28 items-center justify-between rounded-xl border border-[#e1e3ec] bg-white p-5 shadow-sm">
            <div>
              <p className="mb-2 text-xs font-semibold text-[#656a78]">
                Total Users
              </p>
              <h2 className="mb-2 text-[26px] font-bold leading-none text-[#1d2433]">
                {users.length}
              </h2>
              <div className="flex items-center gap-1 text-xs text-[#08745b]">
                <span className="text-[#08745b]">+2.1%</span>
                <span className="text-slate-400">this month</span>
              </div>
            </div>
            <div className="flex h-13 w-13 items-center justify-center rounded-[13px] bg-[#e4e2fb] text-[#3930d8]">
              <FontAwesomeIcon icon={faUsers} />
            </div>
          </div>

          <div className="flex min-h-28 items-center justify-between rounded-xl border border-[#e1e3ec] bg-white p-5 shadow-sm">
            <div>
              <p className="mb-2 text-xs font-semibold text-[#656a78]">
                Active Users
              </p>
              <h2 className="mb-2 text-[26px] font-bold leading-none text-[#1d2433]">
                {users.filter((user) => user.status === "Active").length}
              </h2>
              <div className="flex items-center gap-1 text-xs text-[#08745b]">
                <span className="text-[#08745b]">+1.4%</span>
                <span className="text-slate-400">this month</span>
              </div>
            </div>
            <div className="flex h-13 w-13 items-center justify-center rounded-[13px] bg-emerald-100 text-emerald-700">
              <FontAwesomeIcon icon={faCircleCheck} />
            </div>
          </div>

          <div className="flex min-h-28 items-center justify-between rounded-xl border border-[#e1e3ec] bg-white p-5 shadow-sm">
            <div>
              <p className="mb-2 text-xs font-semibold text-[#656a78]">
                Inactive Users
              </p>
              <h2 className="mb-2 text-[26px] font-bold leading-none text-[#1d2433]">
                {users.filter((user) => user.status === "Inactive").length}
              </h2>
              <div className="flex items-center gap-1 text-xs text-[#555a6b]">
                <span className="text-[#555a6b]">-0.6%</span>
                <span className="text-slate-400">this month</span>
              </div>
            </div>
            <div className="flex h-13 w-13 items-center justify-center rounded-[13px] bg-red-100 text-red-600">
              <FontAwesomeIcon icon={faCircleXmark} />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e1e3ec] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#eef0f6] p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-105">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search users by name, email or phone..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#5146e5] focus:ring-2 focus:ring-[#5146e5]/15"
              />
            </div>

            <div className="relative">
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white pl-4 pr-10 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-50 focus:border-[#5146e5] focus:ring-2 focus:ring-[#5146e5]/15 sm:w-48"
              >
                <option value="All">Status: All</option>
                <option value="Active">Status: Active</option>
                <option value="Inactive">Status: Inactive</option>
              </select>
              <FontAwesomeIcon
                icon={faChevronDown}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-205 border-collapse text-left text-sm">
              <thead className="border-b border-[#eef0f6] bg-[#fafbff]">
                <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {COLUMNS.map((heading) => (
                    <th key={heading} className="px-6 py-4">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-5 font-medium text-slate-500">
                      {user.id}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${user.avatarColor}`}
                        >
                          {user.initials}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-600">{user.email}</td>
                    <td className="px-6 py-5 text-slate-600">{user.phone}</td>
                    <td className="px-6 py-5">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-5 text-slate-600">
                      {user.joinedAt}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3 text-slate-500">
                        <button
                          type="button"
                          title="View user"
                          className="transition hover:text-[#5146e5]"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          type="button"
                          title="Edit user"
                          className="transition hover:text-[#5146e5]"
                        >
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button
                          type="button"
                          title="Delete user"
                          className="transition hover:text-red-500"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pageUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={COLUMNS.length}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      No users found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-[#eef0f6] bg-[#fafbff] px-5 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-500">
              {filteredUsers.length === 0 ? (
                <>Showing 0 results</>
              ) : (
                <>
                  Showing{" "}
                  <span className="font-semibold text-slate-800">
                    {start}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-800">{end}</span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-800">
                    {filteredUsers.length}
                  </span>{" "}
                  results
                </>
              )}
            </p>

            <nav className="flex items-center gap-2" aria-label="Pagination">
              <PageButton
                disabled={safePage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </PageButton>

              {pageNumbers.map((page) => (
                <PageButton
                  key={page}
                  active={page === safePage}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </PageButton>
              ))}

              <PageButton
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </PageButton>
            </nav>
          </div>
        </div>
      </div>
    </main>
  );
}

export default PageListUser;
