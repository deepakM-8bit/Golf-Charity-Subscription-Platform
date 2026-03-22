/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, Check, X, DollarSign, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../lib/supabase.js";
import AdminLayout from "../../components/AdminLayout.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";

const VERIFICATION_COLORS = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

const PAYOUT_COLORS = {
  pending: "text-zinc-500",
  paid: "text-emerald-400",
};

export default function AdminWinners() {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectNotes, setRejectNotes] = useState({});
  const [showRejectInput, setShowRejectInput] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    setLoading(true);
    try {
      const res = await api.get("/winners");
      setWinners(res.winners || []);
    } catch {
      toast.error("Failed to fetch winners");
    } finally {
      setLoading(false);
    }
  };

  const handleViewProof = async (winnerId) => {
    try {
      const res = await api.get(`/winners/${winnerId}/proof-url`);
      window.open(res.url, "_blank");
    } catch {
      toast.error("Failed to get proof URL");
    }
  };

  const handleVerify = async (winnerId, status) => {
    setActionLoading(winnerId + "_verify");
    try {
      await api.put(`/winners/${winnerId}/verify`, {
        verification_status: status,
        admin_notes: rejectNotes[winnerId] || "",
      });
      toast.success(`Winner ${status} successfully`);
      setShowRejectInput(null);
      fetchWinners();
    } catch (err) {
      toast.error(err.error || "Failed to verify winner");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (winnerId) => {
    setActionLoading(winnerId + "_payout");
    try {
      await api.put(`/winners/${winnerId}/payout`, {});
      toast.success("Payout marked as paid");
      fetchWinners();
    } catch (err) {
      toast.error(err.error || "Failed to mark payout");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = winners.filter((w) => {
    if (filter === "all") return true;
    if (filter === "pending") return w.verification_status === "pending";
    if (filter === "approved") return w.verification_status === "approved";
    if (filter === "unpaid")
      return (
        w.verification_status === "approved" && w.payout_status === "pending"
      );
    return true;
  });

  if (loading)
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );

  const pendingCount = winners.filter(
    (w) => w.verification_status === "pending",
  ).length;

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        {/* ── header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-['Syne'] flex items-center gap-3">
            <Award size={22} className="text-emerald-400" />
            Winners
          </h1>
          <p className="text-zinc-500 mt-1">{winners.length} total winners</p>
        </div>

        {/* ── pending alert ── */}
        {pendingCount > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <Award className="text-yellow-400 flex-shrink-0" size={18} />
            <p className="text-yellow-400 text-sm font-semibold">
              {pendingCount} winner{pendingCount > 1 ? "s" : ""} awaiting proof
              verification
            </p>
          </div>
        )}

        {/* ── filter tabs ── */}
        <div className="flex gap-2 flex-wrap mb-6">
          {[
            { key: "all", label: "All" },
            { key: "pending", label: `Pending (${pendingCount})` },
            { key: "approved", label: "Approved" },
            { key: "unpaid", label: "Unpaid" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === tab.key
                  ? "bg-emerald-500 text-black"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── winners list ── */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Award className="text-zinc-700 mx-auto mb-4" size={48} />
            <p className="text-zinc-500">No winners found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((winner, i) => (
              <motion.div
                key={winner.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
              >
                {/* ── winner info ── */}
                <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                  <div>
                    <p className="font-bold font-['Syne']">
                      {winner.profiles?.full_name || "Unknown User"}
                    </p>
                    <p className="text-zinc-500 text-sm">
                      {winner.match_type}-Number Match ·{" "}
                      {new Date(winner.draws?.draw_month).toLocaleDateString(
                        "en-GB",
                        {
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </p>
                    <p className="text-emerald-400 font-bold mt-1">
                      ${parseFloat(winner.prize_amount || 0).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`text-xs border rounded-full px-3 py-1 capitalize ${VERIFICATION_COLORS[winner.verification_status]}`}
                    >
                      {winner.verification_status}
                    </span>
                    <span
                      className={`text-xs font-semibold capitalize ${PAYOUT_COLORS[winner.payout_status]}`}
                    >
                      {winner.payout_status}
                    </span>
                  </div>
                </div>

                {/* ── proof section ── */}
                <div className="flex flex-wrap gap-3">
                  {/* view proof button */}
                  {winner.proof_url && (
                    <button
                      onClick={() => handleViewProof(winner.id)}
                      className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-sm transition-all"
                    >
                      <ExternalLink size={12} />
                      View Proof
                    </button>
                  )}

                  {!winner.proof_url &&
                    winner.verification_status === "pending" && (
                      <span className="text-xs text-zinc-600 self-center">
                        No proof uploaded yet
                      </span>
                    )}

                  {/* approve/reject buttons */}
                  {winner.verification_status === "pending" &&
                    winner.proof_url && (
                      <>
                        <button
                          onClick={() => handleVerify(winner.id, "approved")}
                          disabled={actionLoading === winner.id + "_verify"}
                          className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50"
                        >
                          <Check size={12} />
                          Approve
                        </button>

                        {showRejectInput === winner.id ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              type="text"
                              placeholder="Rejection reason..."
                              value={rejectNotes[winner.id] || ""}
                              onChange={(e) =>
                                setRejectNotes((n) => ({
                                  ...n,
                                  [winner.id]: e.target.value,
                                }))
                              }
                              className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 w-48"
                            />
                            <button
                              onClick={() =>
                                handleVerify(winner.id, "rejected")
                              }
                              disabled={actionLoading === winner.id + "_verify"}
                              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50"
                            >
                              <X size={12} />
                              Confirm Reject
                            </button>
                            <button
                              onClick={() => setShowRejectInput(null)}
                              className="text-zinc-500 hover:text-white text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowRejectInput(winner.id)}
                            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold px-4 py-2 rounded-xl text-sm transition-all"
                          >
                            <X size={12} />
                            Reject
                          </button>
                        )}
                      </>
                    )}

                  {/* mark as paid button */}
                  {winner.verification_status === "approved" &&
                    winner.payout_status === "pending" && (
                      <button
                        onClick={() => handleMarkPaid(winner.id)}
                        disabled={actionLoading === winner.id + "_payout"}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50"
                      >
                        <DollarSign size={12} />
                        {actionLoading === winner.id + "_payout"
                          ? "Processing..."
                          : "Mark as Paid"}
                      </button>
                    )}

                  {/* admin notes if rejected */}
                  {winner.verification_status === "rejected" &&
                    winner.admin_notes && (
                      <p className="text-xs text-red-400 self-center">
                        Reason: {winner.admin_notes}
                      </p>
                    )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
