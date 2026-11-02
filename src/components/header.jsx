import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiArrowUpRight } from "react-icons/fi";
import { TbHeartOff } from "react-icons/tb";
import { ChevronDown, CalendarCheck, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { PERMISSIONS } from "../constants/permissions";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Tours", to: "/tours" },
  // { label: "Categories", to: "/categories" },
  { label: "Destinations", to: "/destinations" },
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, can, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  }

  const accountName = user?.name ?? user?.email ?? "Account";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-[54px] max-w-[1040px] items-center justify-between gap-6 px-6 py-2.5">
        <Link to="/home" className="flex shrink-0 items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-[#10ad91] text-white">
            <FiArrowUpRight size={15} strokeWidth={2.5} />
          </span>
          <span className="text-[16px] font-bold tracking-[-0.02em] text-[#182849]">TripGo</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              end={link.to === "/home"}
              className={({ isActive }) =>
                `text-[13px] font-medium transition-colors hover:text-[#0da88d] ${
                  isActive
                    ? "text-[#0da88d] border-b-2 border-[#0da88d] pb-1"
                    : "text-[#142443]"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Auth buttons */}
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            aria-label="Favorites"
            className="hidden h-7 w-7 items-center justify-center text-[#142443] transition-colors hover:text-[#0da88d] sm:flex"
          >
            <TbHeartOff size={28} strokeWidth={1.8} />
          </button>
          {isAuthenticated ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 transition-colors ${
                  menuOpen
                    ? "border-[#10ad91] bg-teal-50"
                    : "border-slate-200 bg-white hover:border-[#0da88d]"
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10ad91] text-white">
                  <UserRound size={15} />
                </span>
                <span className="max-w-[120px] truncate text-[12px] font-semibold text-[#182849]">
                  {accountName}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-[#0d967d] transition-transform ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  aria-label="Account"
                  className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg"
                >
                  <Link
                    role="menuitem"
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-[#142443] transition-colors hover:bg-teal-50 hover:text-[#0d967d]"
                  >
                    <LayoutDashboard size={16} className="text-[#0d967d]" />
                    Dashboard
                  </Link>
                  {can(PERMISSIONS.VIEW_BOOKINGS) && (
                    <Link
                      role="menuitem"
                      to="/my-bookings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-[#142443] transition-colors hover:bg-teal-50 hover:text-[#0d967d]"
                    >
                      <CalendarCheck size={16} className="text-[#0d967d]" />
                      My bookings
                    </Link>
                  )}
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut size={16} className="text-red-500" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-[5px] border border-[#172949] px-4 py-1.5 text-[11px] font-medium text-[#172949] transition-colors hover:border-[#0da88d] hover:text-[#0da88d]"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-[5px] bg-[#10ad91] px-4 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-[#0d967d]"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
