/* eslint-disable no-unused-vars */
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Heart,
  Award,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { path: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { path: "/admin/users", label: "Users", Icon: Users },
  { path: "/admin/draws", label: "Draws", Icon: Trophy },
  { path: "/admin/charities", label: "Charities", Icon: Heart },
  { path: "/admin/winners", label: "Winners", Icon: Award },
];

const AdminLayout = ({ children }) => {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* ── sidebar ── */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col fixed h-full">
        {/* logo */}
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

        {/* nav items */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
          {NAV_ITEMS.map(({ path, label, Icon }) => {
            const isActive = pathname === path;
            return (
              <Link
                key={path}
                to={path}
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

        {/* sign out */}
        <div className="px-4 py-4 border-t border-zinc-800">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── main content ── */}
      <main className="ml-64 flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
};

export default AdminLayout;
