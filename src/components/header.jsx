import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiArrowUpRight } from "react-icons/fi";
import { TbHeartOff } from "react-icons/tb";
import { useAuth } from "../context/useAuth";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Tours", to: "/tours" },
  { label: "Categories", to: "/categories" },
  { label: "Destinations", to: "/destinations" },
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

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
            <>
              <span className="hidden text-[11px] font-medium text-[#142443] sm:block">
                {user?.name ?? user?.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-[5px] border border-[#172949] px-4 py-1.5 text-[11px] font-medium text-[#172949] transition-colors hover:border-[#0da88d] hover:text-[#0da88d]"
              >
                Logout
              </button>
            </>
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