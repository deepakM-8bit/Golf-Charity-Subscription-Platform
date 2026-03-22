/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Plus, Play, CheckCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../lib/supabase.js";
import AdminLayout from "../../components/AdminLayout.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";

const STATUS_COLORS = {
  pending: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  simulated: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function AdminDraws() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [simulation, setSimulation] = useState(null);
  const [createForm, setCreateForm] = useState({
    draw_month: "",
    draw_type: "random",
  });

  useEffect(() => {
    fetchDraws();
  }, []);

  const fetchDraws = async () => {
    setLoading(true);
    try {
      const res = await api.get("/draws/admin/all");
      setDraws(res.draws || []);
    } catch {
      toast.error("Failed to fetch draws");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading("create");
    try {
      await api.post("/draws", createForm);
      toast.success("Draw created!");
      setShowCreateForm(false);
      setCreateForm({ draw_month: "", draw_type: "random" });
      fetchDraws();
    } catch (err) {
      toast.error(err.error || "Failed to create draw");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSimulate = async (drawId) => {
    setActionLoading(drawId + "_simulate");
    setSimulation(null);
    try {
      const res = await api.post(`/draws/${drawId}/simulate`, {});
      setSimulation({ drawId, ...res.simulation });
      toast.success("Simulation complete! Review results before publishing.");
      fetchDraws();
    } catch (err) {
      toast.error(err.error || "Failed to simulate draw");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublish = async (drawId) => {
    setActionLoading(drawId + "_publish");
    try {
      const res = await api.post(`/draws/${drawId}/publish`, {});
      toast.success(`Draw published! ${res.winnersCreated} winner(s) created.`);
      setSimulation(null);
      fetchDraws();
    } catch (err) {
      toast.error(err.error || "Failed to publish draw");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        {/* ── header ── */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold font-['Syne'] flex items-center gap-3">
              <Trophy size={22} className="text-yellow-400" />
              Draws
            </h1>
            <p className="text-zinc-500 mt-1">
              Create, simulate and publish monthly draws
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
          >
            <Plus size={16} />
            New Draw
          </button>
        </div>

        {/* ── create form ── */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6"
          >
            <h2 className="font-bold font-['Syne'] mb-4">Create New Draw</h2>
            <form onSubmit={handleCreate} className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-48">
                <label className="block text-sm text-zinc-400 mb-1">
                  Draw Month
                </label>
                <input
                  type="date"
                  required
                  value={createForm.draw_month}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, draw_month: e.target.value }))
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex-1 min-w-48">
                <label className="block text-sm text-zinc-400 mb-1">
                  Draw Type
                </label>
                <select
                  value={createForm.draw_type}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, draw_type: e.target.value }))
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="random">Random</option>
                  <option value="algorithmic">Algorithmic</option>
                </select>
              </div>
              <div className="flex items-end gap-3">
                <button
                  type="submit"
                  disabled={actionLoading === "create"}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
                >
                  {actionLoading === "create" ? "Creating..." : "Create Draw"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ── simulation results ── */}
        {simulation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-500/5 border border-yellow-500/30 rounded-2xl p-6 mb-6"
          >
            <h2 className="font-bold font-['Syne'] text-yellow-400 mb-4">
              Simulation Results
            </h2>
            <div className="flex flex-wrap gap-3 mb-4">
              <div>
                <p className="text-xs text-zinc-500 mb-2">Draw Numbers</p>
                <div className="flex gap-2">
                  {simulation.drawNumbers?.map((num, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-yellow-400 font-bold text-sm"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[5, 4, 3].map((match) => (
                <div
                  key={match}
                  className="text-center p-3 bg-zinc-900 rounded-xl"
                >
                  <p className="text-xs text-zinc-500">{match}-Match Winners</p>
                  <p className="text-xl font-bold font-['Syne']">
                    {simulation.potentialWinners?.[match]?.length || 0}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-zinc-500 text-sm">
              Total entries: {simulation.totalEntries} · Review above then
              publish when ready.
            </p>
          </motion.div>
        )}

        {/* ── draws list ── */}
        {draws.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="text-zinc-700 mx-auto mb-4" size={48} />
            <p className="text-zinc-500">
              No draws yet. Create your first draw above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {draws.map((draw, i) => (
              <motion.div
                key={draw.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                  <div>
                    <h2 className="font-bold font-['Syne']">
                      {new Date(draw.draw_month).toLocaleDateString("en-GB", {
                        month: "long",
                        year: "numeric",
                      })}
                    </h2>
                    <p className="text-zinc-500 text-sm capitalize">
                      {draw.draw_type} · {draw.active_subscriber_count}{" "}
                      subscribers
                    </p>
                  </div>
                  <span
                    className={`text-xs border rounded-full px-3 py-1 capitalize ${STATUS_COLORS[draw.status]}`}
                  >
                    {draw.status}
                  </span>
                </div>

                {/* prize pools */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    {
                      label: "5-Match",
                      value: draw.pool_5match,
                      color: "text-emerald-400",
                    },
                    {
                      label: "4-Match",
                      value: draw.pool_4match,
                      color: "text-yellow-400",
                    },
                    {
                      label: "3-Match",
                      value: draw.pool_3match,
                      color: "text-teal-400",
                    },
                  ].map((tier, j) => (
                    <div
                      key={j}
                      className="text-center p-3 bg-zinc-800/50 rounded-xl"
                    >
                      <p className="text-xs text-zinc-500">{tier.label}</p>
                      <p className={`font-bold font-['Syne'] ${tier.color}`}>
                        ${parseFloat(tier.value || 0).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* draw numbers if simulated */}
                {draw.draw_numbers && (
                  <div className="flex gap-2 mb-4">
                    {draw.draw_numbers.map((num, j) => (
                      <div
                        key={j}
                        className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm"
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                )}

                {/* action buttons */}
                <div className="flex gap-3 flex-wrap">
                  {draw.status === "pending" && (
                    <button
                      onClick={() => handleSimulate(draw.id)}
                      disabled={actionLoading === draw.id + "_simulate"}
                      className="flex items-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
                    >
                      <Play size={14} />
                      {actionLoading === draw.id + "_simulate"
                        ? "Simulating..."
                        : "Simulate"}
                    </button>
                  )}

                  {draw.status === "simulated" && (
                    <>
                      <button
                        onClick={() => handleSimulate(draw.id)}
                        disabled={actionLoading === draw.id + "_simulate"}
                        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
                      >
                        <Play size={14} />
                        Re-Simulate
                      </button>
                      <button
                        onClick={() => handlePublish(draw.id)}
                        disabled={actionLoading === draw.id + "_publish"}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
                      >
                        <CheckCircle size={14} />
                        {actionLoading === draw.id + "_publish"
                          ? "Publishing..."
                          : "Publish Results"}
                      </button>
                    </>
                  )}

                  {draw.status !== "published" && (
                    <button
                      onClick={async () => {
                        try {
                          await api.delete(`/draws/${draw.id}`);
                          toast.success("Draw deleted");
                          fetchDraws();
                        } catch (err) {
                          toast.error(err.error || "Failed to delete draw");
                        }
                      }}
                      className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  )}

                  {draw.status === "published" && (
                    <span className="flex items-center gap-2 text-emerald-400 text-sm">
                      <CheckCircle size={14} />
                      Published on{" "}
                      {new Date(draw.published_at).toLocaleDateString("en-GB")}
                    </span>
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
