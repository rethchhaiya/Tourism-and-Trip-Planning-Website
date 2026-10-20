import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  MapPin,
  Compass,
  Map,
  CalendarCheck,
  Users,
  Star,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Search,
  Bell,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";

const menuPaths = {
  DashBoard: ["/dashboard", "/sidebar"],
  Destinations: ["/", "/destination", "/destinations", "/table_destinations"],
  Guides: ["/guides"],
  Bookings: ["/bookings", "/listbooking"],
  Customers: ["/customers", "/customer", "/createcustomer"],
  Settings: ["/settings"],
};

const sections = [
  {
    label: "OVERVIEW",
    items: [
      { name: "DashBoard", icon: LayoutDashboard },
    ],
  },
  {
    label: "CATALOG & CONTENT",
    items: [
      { name: "Manage Master", icon: Layers },
      { name: "Destinations", icon: MapPin },
      { name: "Guides", icon: Compass },
      { name: "Tours", icon: Map },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { name: "Bookings", icon: CalendarCheck, badge: "12" },
      { name: "Customers", icon: Users },
      { name: "Reviews", icon: Star, badge: "new" },
    ],
  },
  {
    label: "SETTINGS & ANALYTICS",
    items: [
      { name: "Reports", icon: BarChart3 },
      { name: "Settings", icon: Settings },
    ],
  },
];

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState("DashBoard");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAdmin, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-[#211E55] px-4 py-4 text-white">
        {/* Brand */}
        <div className="mb-4 flex h-14 items-center gap-3 border-b border-white/10 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4F46E5] text-base font-bold text-white">
            T
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold leading-tight text-white">TravelAdmin</h1>
            <p className="text-[11px] text-[#B8B6D9]">Management System</p>
          </div>
        </div>

        {/* Navigation — admin management menu.
            Hiding is UX only; the backend must still enforce access.
            TODO(role-matrix): show per-role menu items once the backend role
            contract is final (currently only admins see the menu). */}
        {isAdmin && (
        <nav className="flex-1 space-y-5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.14em] text-[#8f8dbd]">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ name, icon: Icon, badge }) => {
                  const isActive = menuPaths[name]
                    ? menuPaths[name].some((p) =>
                        p === "/"
                          ? pathname === "/"
                          : pathname === p || pathname.startsWith(`${p}/`),
                      )
                    : !Object.values(menuPaths).some((paths) =>
                        paths.some((p) =>
                          p === "/"
                            ? pathname === "/"
                            : pathname === p || pathname.startsWith(`${p}/`),
                        ),
                      ) && activeItem === name;

                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setActiveItem(name);
                        if (menuPaths[name]) {
                          navigate(name === "Destinations" ? "/destinations" : menuPaths[name][0]);
                        }
                      }}
                      className={[
                        "relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px] font-medium transition-colors duration-150",
                        isActive
                          ? "bg-[#39318F] font-semibold text-white"
                          : "text-[#B8B6D9] hover:bg-white/10 hover:text-white",
                      ].join(" ")}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-300" />
                      )}
                      <Icon size={17} className={isActive ? "text-white" : "text-[#8f8dbd]"} />
                      <span className="flex-1">{name}</span>
                      {badge ? (
                        <span
                          className={[
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            badge === "new"
                              ? "bg-emerald-400/15 text-emerald-300"
                              : "bg-[#4F46E5]/30 text-indigo-200",
                          ].join(" ")}
                        >
                          {badge}
                        </span>
                      ) : (
                        isActive && <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        )}

        {/* Logout */}
        <div className="mt-auto border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px] font-medium text-[#B8B6D9] transition-colors duration-150 hover:bg-white/5 hover:text-white"
          >
            <LogOut size={17} className="text-[#8f8dbd]" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-6 border-b border-slate-200 bg-white px-4 py-3 md:px-6">
          <div className="flex h-11 w-full max-w-[480px] items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
            <Search size={17} className="shrink-0 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="notifications"
              className="relative hidden h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 sm:flex"
            >
              <Bell size={18} />
            </button>

            <button
              type="button"
              aria-label="help"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 sm:flex"
            >
              <HelpCircle size={18} />
            </button>

            <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

            <button
              type="button"
              className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition hover:bg-slate-100"
            >
              <img
                className="h-9 w-9 rounded-full object-cover"
                src="https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8bWFsZSUyMHByb2ZpbGV8ZW58MHx8MHx8fDA%3D"
                alt="Admin profile"
              />
              <span className="hidden text-sm font-semibold text-slate-800 sm:block">Admin</span>
              <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
            </button>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
};

export default Sidebar;
