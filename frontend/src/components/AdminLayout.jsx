/* eslint-disable no-unused-vars */
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Heart,
  Award,
  LogOut,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/UseAuth.js";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { path: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { path: "/admin/users", label: "Users", Icon: Users },
  { path: "/admin/draws", label: "Draws", Icon: Trophy },
  { path: "/admin/charities", label: "Charities", Icon: Heart },
  { path: "/admin/winners", label: "Winners", Icon: Award },
];

// ── NavLinks moved outside AdminLayout to fix react-hooks/static-components ──
const NavLinks = ({ pathname, onNavigate, onSignOut }) => (
  <>
    <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
      {NAV_ITEMS.map(({ path, label, Icon }) => {
        const isActive = pathname === path;
        return (
          <Link
            key={path}
            to={path}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </nav>
    <div className="px-4 py-4 border-t border-zinc-800">
      <button
        onClick={onSignOut}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
      >
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  </>
);

export default function AdminLayout({ children }) {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* ── desktop sidebar ── */}
      <aside className="hidden md:flex w-64 border-r border-zinc-800 flex-col fixed h-full z-40">
        <div className="px-6 py-5 border-b border-zinc-800">
          <Link
            to="/"
            className="text-xl font-bold font-['Syne'] flex items-center gap-2"
          >
            <span className="text-emerald-400">⬡</span>
            <span>GolfGives</span>
          </Link>
          <div className="flex items-center gap-1.5 mt-1">
            <Shield size={12} className="text-yellow-400" />
            <span className="text-xs text-yellow-400 font-semibold">
              Admin Panel
            </span>
          </div>
        </div>
        <NavLinks
          pathname={pathname}
          onNavigate={() => {}}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* ── mobile header ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-950 border-b border-zinc-800 px-4 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="text-lg font-bold font-['Syne'] flex items-center gap-2"
        >
          <span className="text-emerald-400">⬡</span>
          <span>GolfGives</span>
          <span className="text-xs text-yellow-400 font-semibold ml-1">
            Admin
          </span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── mobile sidebar drawer ── */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-zinc-950 border-r border-zinc-800 z-50 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-yellow-400" />
            <span className="text-xs text-yellow-400 font-semibold">
              Admin Panel
            </span>
          </div>
        </div>
        <NavLinks
          pathname={pathname}
          onNavigate={() => setSidebarOpen(false)}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* ── main content ── */}
      <main className="md:ml-64 flex-1 p-6 md:p-8 pt-20 md:pt-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
