import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { useAuth } from "../contexts/UseAuth.js";

const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async (e) => {
    if (e) e.preventDefault();

    console.log("Navbar sign out clicked");

    await signOut();
  };

  return (
    <nav className="fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-zinc-950/80 border-b border-zinc-800/50">
      {/* ── logo ── */}
      <Link
        to="/"
        className="text-xl font-bold font-['Syne'] flex items-center gap-2"
      >
        <span className="text-emerald-400">⬡</span>
        <span>GolfGives</span>
      </Link>

      {/* ── desktop nav ── */}
      <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
        <Link to="/charities" className="hover:text-white transition-colors">
          Charities
        </Link>
        <Link to="/draws" className="hover:text-white transition-colors">
          Draws
        </Link>

        {!user ? (
          <>
            <Link to="/auth" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              to="/subscribe"
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-2 rounded-full transition-all hover:scale-105"
            >
              Join Now
            </Link>
          </>
        ) : (
          <>
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                <Shield size={14} />
                Admin
              </Link>
            )}
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <LayoutDashboard size={14} />
              Dashboard
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-red-400 transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </>
        )}
      </div>

      {/* ── mobile menu button ── */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden text-zinc-400 hover:text-white transition-colors"
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* ── mobile menu ── */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex flex-col gap-4 md:hidden">
          <Link
            to="/charities"
            onClick={() => setMenuOpen(false)}
            className="text-zinc-400 hover:text-white"
          >
            Charities
          </Link>
          <Link
            to="/draws"
            onClick={() => setMenuOpen(false)}
            className="text-zinc-400 hover:text-white"
          >
            Draws
          </Link>
          {!user ? (
            <>
              <Link
                to="/auth"
                onClick={() => setMenuOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                to="/subscribe"
                onClick={() => setMenuOpen(false)}
                className="bg-emerald-500 text-black font-bold px-5 py-2 rounded-full text-center"
              >
                Join Now
              </Link>
            </>
          ) : (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="text-yellow-400"
                >
                  Admin Panel
                </Link>
              )}
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="text-left text-red-400"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
