/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Star } from "lucide-react";
import { api } from "../lib/supabase.js";
import Layout from "../components/Layout.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

export default function Draws() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .publicGet("/draws")
      .then((d) => setDraws(d.draws || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* ── header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <Trophy className="text-yellow-400" size={24} />
          </div>
          <h1 className="text-4xl font-bold font-['Syne'] mb-3">
            Monthly Draws
          </h1>
          <p className="text-zinc-400 max-w-md mx-auto">
            Results from all published draws. Subscribe to participate in
            upcoming draws.
          </p>
        </motion.div>

        {/* ── draws list ── */}
        {draws.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="text-zinc-700 mx-auto mb-4" size={48} />
            <p className="text-zinc-500">
              No draws published yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {draws.map((draw, i) => (
              <motion.div
                key={draw.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
              >
                {/* draw header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold font-['Syne']">
                      {new Date(draw.draw_month).toLocaleDateString("en-GB", {
                        month: "long",
                        year: "numeric",
                      })}
                    </h2>
                    <p className="text-zinc-500 text-sm capitalize">
                      {draw.draw_type} draw · {draw.active_subscriber_count}{" "}
                      participants
                    </p>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-3 py-1">
                    Published
                  </span>
                </div>

                {/* winning numbers */}
                <div className="mb-6">
                  <p className="text-sm text-zinc-500 mb-3">Winning Numbers</p>
                  <div className="flex flex-wrap gap-3">
                    {draw.draw_numbers?.map((num, j) => (
                      <div
                        key={j}
                        className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg"
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                </div>

                {/* prize pools */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: "5 Match",
                      pool: draw.pool_5match,
                      color: "emerald",
                      jackpot: true,
                    },
                    {
                      label: "4 Match",
                      pool: draw.pool_4match,
                      color: "yellow",
                      jackpot: false,
                    },
                    {
                      label: "3 Match",
                      pool: draw.pool_3match,
                      color: "teal",
                      jackpot: false,
                    },
                  ].map((tier, j) => (
                    <div
                      key={j}
                      className={`p-4 rounded-xl border text-center ${
                        tier.color === "emerald"
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : tier.color === "yellow"
                            ? "border-yellow-500/20 bg-yellow-500/5"
                            : "border-teal-500/20 bg-teal-500/5"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center gap-1 mb-1 ${
                          tier.color === "emerald"
                            ? "text-emerald-400"
                            : tier.color === "yellow"
                              ? "text-yellow-400"
                              : "text-teal-400"
                        }`}
                      >
                        {tier.jackpot && <Star size={12} />}
                        <span className="text-xs font-semibold">
                          {tier.label}
                        </span>
                      </div>
                      <p
                        className={`font-bold font-['Syne'] ${
                          tier.color === "emerald"
                            ? "text-emerald-400"
                            : tier.color === "yellow"
                              ? "text-yellow-400"
                              : "text-teal-400"
                        }`}
                      >
                        ${parseFloat(tier.pool || 0).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* jackpot carryover notice */}
                {draw.jackpot_carried_over > 0 && (
                  <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-2">
                    <Star size={14} />
                    Jackpot carried over: $
                    {parseFloat(draw.jackpot_carried_over).toFixed(2)}
                  </div>
                )}

                {/* total pool */}
                <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between text-sm">
                  <span className="text-zinc-500">Total Prize Pool</span>
                  <span className="font-bold text-white">
                    ${parseFloat(draw.total_pool || 0).toFixed(2)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
