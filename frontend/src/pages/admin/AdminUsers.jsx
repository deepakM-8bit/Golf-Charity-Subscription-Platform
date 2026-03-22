/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, ChevronDown, ChevronUp, Pencil, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../lib/supabase.js";
import AdminLayout from "../../components/AdminLayout.jsx";
import SubscriptionBadge from "../../components/SubscriptionBadge.jsx";
import LoadingSpinner from "../../components/LoadingSpinner.jsx";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: "", role: "" });
  const [editingScore, setEditingScore] = useState(null);
  const [scoreForm, setScoreForm] = useState({ score: "", date_played: "" });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users");
      setUsers(res.users || []);
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetail = async (userId) => {
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...res.user } : u)),
      );
    } catch {
      toast.error("Failed to fetch user details");
    }
  };

  const handleExpandUser = (userId) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
      fetchUserDetail(userId);
    }
  };

  const handleEditUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}`, editForm);
      toast.success("User updated");
      setEditingUser(null);
      fetchUsers();
    } catch {
      toast.error("Failed to update user");
    }
  };

  const handleEditScore = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/scores`, {
        score_id: editingScore.id,
        score: parseInt(scoreForm.score),
        date_played: scoreForm.date_played,
      });
      toast.success("Score updated");
      setEditingScore(null);
      fetchUserDetail(userId);
    } catch {
      toast.error("Failed to update score");
    }
  };

  const handleUpdateSubscription = async (subId, status) => {
    try {
      await api.put(`/admin/subscriptions/${subId}`, { status });
      toast.success("Subscription updated");
      fetchUsers();
    } catch {
      toast.error("Failed to update subscription");
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
      <div className="max-w-5xl">
        {/* ── header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold font-['Syne'] flex items-center gap-3">
            <Users size={22} className="text-emerald-400" />
            Users
          </h1>
          <p className="text-zinc-500 mt-1">{users.length} total users</p>
        </div>

        {/* ── users list ── */}
        <div className="space-y-3">
          {users.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
            >
              {/* ── user row ── */}
              <div className="p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-sm">
                    {user.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    {editingUser === user.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editForm.full_name}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              full_name: e.target.value,
                            }))
                          }
                          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500 w-36"
                        />
                        <select
                          value={editForm.role}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, role: e.target.value }))
                          }
                          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                        >
                          <option value="subscriber">Subscriber</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleEditUser(user.id)}
                          className="p-1.5 bg-emerald-500 text-black rounded-lg"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="p-1.5 bg-zinc-700 text-white rounded-lg"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold">
                          {user.full_name || "No name"}
                        </p>
                        <p className="text-zinc-500 text-xs capitalize">
                          {user.role}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* subscription badge */}
                  {user.subscriptions?.[0] ? (
                    <SubscriptionBadge status={user.subscriptions[0].status} />
                  ) : (
                    <span className="text-xs text-zinc-600">
                      No subscription
                    </span>
                  )}

                  {/* edit button */}
                  {editingUser !== user.id && (
                    <button
                      onClick={() => {
                        setEditingUser(user.id);
                        setEditForm({
                          full_name: user.full_name || "",
                          role: user.role,
                        });
                      }}
                      className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                  )}

                  {/* expand button */}
                  <button
                    onClick={() => handleExpandUser(user.id)}
                    className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                  >
                    {expandedUser === user.id ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                </div>
              </div>

              {/* ── expanded details ── */}
              {expandedUser === user.id && (
                <div className="border-t border-zinc-800 p-5 space-y-5">
                  {/* subscription management */}
                  {user.subscriptions?.[0] && (
                    <div>
                      <p className="text-sm font-semibold text-zinc-400 mb-3">
                        Subscription
                      </p>
                      <div className="flex items-center justify-between flex-wrap gap-3 p-4 bg-zinc-800/50 rounded-xl">
                        <div>
                          <p className="text-sm capitalize">
                            {user.subscriptions[0].plan} plan
                          </p>
                          <p className="text-xs text-zinc-500">
                            Expires:{" "}
                            {new Date(
                              user.subscriptions[0].current_period_end,
                            ).toLocaleDateString("en-GB")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {["active", "cancelled", "lapsed"].map((status) => (
                            <button
                              key={status}
                              onClick={() =>
                                handleUpdateSubscription(
                                  user.subscriptions[0].id,
                                  status,
                                )
                              }
                              className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-all ${
                                user.subscriptions[0].status === status
                                  ? "bg-emerald-500 text-black font-bold"
                                  : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* scores */}
                  {user.scores?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-zinc-400 mb-3">
                        Golf Scores
                      </p>
                      <div className="space-y-2">
                        {user.scores.map((score) => (
                          <div key={score.id}>
                            {editingScore?.id === score.id ? (
                              <div className="flex gap-2 items-center p-3 bg-zinc-800/50 rounded-xl">
                                <input
                                  type="number"
                                  min="1"
                                  max="45"
                                  value={scoreForm.score}
                                  onChange={(e) =>
                                    setScoreForm((f) => ({
                                      ...f,
                                      score: e.target.value,
                                    }))
                                  }
                                  className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                                />
                                <input
                                  type="date"
                                  value={scoreForm.date_played}
                                  onChange={(e) =>
                                    setScoreForm((f) => ({
                                      ...f,
                                      date_played: e.target.value,
                                    }))
                                  }
                                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                                />
                                <button
                                  onClick={() => handleEditScore(user.id)}
                                  className="p-1.5 bg-emerald-500 text-black rounded-lg"
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  onClick={() => setEditingScore(null)}
                                  className="p-1.5 bg-zinc-700 text-white rounded-lg"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                  <span className="text-emerald-400 font-bold">
                                    {score.score}
                                  </span>
                                  <span className="text-zinc-500 text-sm">
                                    {new Date(
                                      score.date_played,
                                    ).toLocaleDateString("en-GB")}
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    setEditingScore(score);
                                    setScoreForm({
                                      score: score.score,
                                      date_played: score.date_played,
                                    });
                                  }}
                                  className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-lg transition-all"
                                >
                                  <Pencil size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* charity */}
                  {user.user_charities && (
                    <div>
                      <p className="text-sm font-semibold text-zinc-400 mb-2">
                        Charity
                      </p>
                      <div className="p-3 bg-zinc-800/50 rounded-xl flex justify-between">
                        <span className="text-sm">
                          {user.user_charities.charities?.name || "Unknown"}
                        </span>
                        <span className="text-emerald-400 text-sm">
                          {user.user_charities.contribution_percentage}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
