/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Trophy,
  Heart,
  Award,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { api } from "../../lib/supabase.js";
import AdminLayout from "../../components/AdminLayout.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";

const StatCard = ({
  label,
  value,
  icon: Icon,
  color = "emerald",
  suffix = "",
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
  >
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
        color === "emerald"
          ? "bg-emerald-500/10"
          : color === "yellow"
            ? "bg-yellow-500/10"
            : color === "rose"
              ? "bg-rose-500/10"
              : "bg-teal-500/10"
      }`}
    >
      <Icon
        size={18}
        className={
          color === "emerald"
            ? "text-emerald-400"
            : color === "yellow"
              ? "text-yellow-400"
              : color === "rose"
                ? "text-rose-400"
                : "text-teal-400"
        }
      />
    </div>
    <p className="text-zinc-500 text-sm mb-1">{label}</p>
    <p className="text-2xl font-bold font-['Syne']">
      {suffix}
      {value}
    </p>
  </motion.div>
);

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/analytics")
      .then((d) => setAnalytics(d.analytics))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        {/* ── header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-['Syne']">Dashboard</h1>
          <p className="text-zinc-500 mt-1">Platform overview and analytics</p>
        </div>

        {/* ── stats grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Users"
            value={analytics?.totalUsers || 0}
            icon={Users}
            color="emerald"
          />
          <StatCard
            label="Active Subscribers"
            value={analytics?.activeSubscribers || 0}
            icon={TrendingUp}
            color="teal"
          />
          <StatCard
            label="Total Draws"
            value={analytics?.totalDraws || 0}
            icon={Trophy}
            color="yellow"
          />
          <StatCard
            label="Total Prize Pool"
            value={analytics?.totalPrizePool || "0.00"}
            icon={Award}
            color="emerald"
            suffix="$"
          />
          <StatCard
            label="Total Paid Out"
            value={analytics?.totalPaidOut || "0.00"}
            icon={Award}
            color="teal"
            suffix="$"
          />
          <StatCard
            label="Total Donations"
            value={analytics?.totalDonations || "0.00"}
            icon={Heart}
            color="rose"
            suffix="$"
          />
        </div>

        {/* ── pending verifications alert ── */}
        {analytics?.pendingVerification > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-8 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Award className="text-yellow-400" size={20} />
              <div>
                <p className="font-semibold text-yellow-400">
                  {analytics.pendingVerification} winner
                  {analytics.pendingVerification > 1 ? "s" : ""} awaiting
                  verification
                </p>
                <p className="text-zinc-500 text-sm">
                  Review and approve proof submissions
                </p>
              </div>
            </div>
            <Link
              to="/admin/winners"
              className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 text-sm font-semibold"
            >
              Review <ArrowRight size={14} />
            </Link>
          </motion.div>
        )}

        {/* ── quick links ── */}
        <div>
          <h2 className="text-lg font-bold font-['Syne'] mb-4">
            Quick Actions
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                to: "/admin/draws",
                label: "Manage Draws",
                desc: "Create, simulate and publish monthly draws",
                icon: Trophy,
                color: "yellow",
              },
              {
                to: "/admin/users",
                label: "Manage Users",
                desc: "View and edit user profiles and subscriptions",
                icon: Users,
                color: "emerald",
              },
              {
                to: "/admin/charities",
                label: "Manage Charities",
                desc: "Add, edit and delete charity listings",
                icon: Heart,
                color: "rose",
              },
              {
                to: "/admin/winners",
                label: "Verify Winners",
                desc: "Review proof submissions and process payouts",
                icon: Award,
                color: "teal",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={item.to}
                  className="flex items-center gap-4 p-5 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl transition-all group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      item.color === "emerald"
                        ? "bg-emerald-500/10"
                        : item.color === "yellow"
                          ? "bg-yellow-500/10"
                          : item.color === "rose"
                            ? "bg-rose-500/10"
                            : "bg-teal-500/10"
                    }`}
                  >
                    <item.icon
                      size={18}
                      className={
                        item.color === "emerald"
                          ? "text-emerald-400"
                          : item.color === "yellow"
                            ? "text-yellow-400"
                            : item.color === "rose"
                              ? "text-rose-400"
                              : "text-teal-400"
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-zinc-500 text-sm">{item.desc}</p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-zinc-600 group-hover:text-white transition-colors"
                  />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
