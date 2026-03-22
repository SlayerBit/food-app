import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-2 py-1 transition-colors ${isActive ? "text-orange-600 font-medium" : "text-slate-600 hover:text-slate-900"}`;

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold tracking-tight text-orange-600">
          FoodDash
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm sm:gap-3">
          <NavLink to="/" className={linkClass} end>
            Home
          </NavLink>
          {user && (
            <NavLink to="/orders" className={linkClass}>
              Orders
            </NavLink>
          )}
          {user && (
            <NavLink to="/cart" className={linkClass}>
              <span className="inline-flex items-center gap-1.5">
                Cart
                {totalItems > 0 && (
                  <span className="min-w-[1.25rem] rounded-full bg-orange-500 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </span>
            </NavLink>
          )}
          <NavLink to="/profile" className={linkClass}>
            Profile
          </NavLink>
          {!user ? (
            <>
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
              <Link
                to="/signup"
                className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1.5 font-medium text-white shadow-sm transition hover:brightness-105"
              >
                Sign up
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={logout}
              className="rounded-xl bg-slate-800 px-3 py-1.5 text-white transition hover:bg-slate-900"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
