/* eslint-disable no-unused-vars */
import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CreditCard,
  Target,
  Heart,
  Trophy,
  Award,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Upload,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../lib/supabase.js";
import { useAuth } from "../contexts/UseAuth.js";
import Layout from "../components/Layout.jsx";
import ScoreCard from "../components/ScoreCard.jsx";
import SubscriptionBadge from "../components/SubscriptionBadge.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function Dashboard() {
  // Pulled refreshSubscription from useAuth to fix the desync
  const { profile, subscription, refreshSubscription } = useAuth();

  // ── state ──
  const [scores, setScores] = useState([]);
  const [charitySelection, setCharitySelection] = useState(null);
  const [charities, setCharities] = useState([]);
  const [drawEntries, setDrawEntries] = useState([]);
  const [upcomingDraw, setUpcomingDraw] = useState(null);
  const [winnings, setWinnings] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── score form state ──
  const [scoreForm, setScoreForm] = useState({ score: "", date_played: "" });
  const [editingScore, setEditingScore] = useState(null);
  const [scoreLoading, setScoreLoading] = useState(false);

  // ── charity state ──
  const [editingCharity, setEditingCharity] = useState(false);
  const [selectedCharity, setSelectedCharity] = useState("");
  const [contribution, setContribution] = useState(10);

  // ── proof upload state ──
  const [uploadingProof, setUploadingProof] = useState(null);

  // ── donation state ──
  const [donationAmount, setDonationAmount] = useState("");
  const [donating, setDonating] = useState(false);

  // search params
  const [searchParams, setSearchParams] = useSearchParams();

  const captureAttempted = useRef(false);

  useEffect(() => {
    refreshSubscription().catch(console.error);

    // PayPal automatically appends ?token=<ORDER_ID> to your return URL!
    const paypalToken = searchParams.get("token");
    const donated = searchParams.get("donated");
    const donationCancelled = searchParams.get("donation_cancelled");

    if (donated === "true" && paypalToken && !captureAttempted.current) {
      captureAttempted.current = true; // Lock it so it only runs once

      // Capture the donation payment
      api
        .post("/donations/capture", { orderId: paypalToken })
        .then(() => {
          toast.success(
            "Donation completed! Thank you for your generosity 💚",
            {
              duration: 5000,
            },
          );
          setSearchParams({}); // Clean the URL so it doesn't run again on refresh
          fetchAll(); // Refresh dashboard so the new donation shows in history
        })
        .catch((err) => {
          console.error("Capture error:", err);
          toast.error("Donation capture failed. Please contact support.");
          setSearchParams({});
          fetchAll();
        });
    } else if (donationCancelled === "true") {
      toast.error("Donation cancelled.");
      setSearchParams({});
      fetchAll();
    } else if (!donated) {
      // Normal dashboard load
      fetchAll();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // allSettled ensures the dashboard loads even if one route fails
      const results = await Promise.allSettled([
        api.get("/scores"),
        api.get("/charities/user/selection"),
        api.publicGet("/charities"),
        api.get("/draws/user/entries"),
        api.publicGet("/draws/upcoming"),
        api.get("/winners/my"),
      ]);

      setScores(
        results[0].status === "fulfilled" ? results[0].value.scores : [],
      );

      const charityRes =
        results[1].status === "fulfilled"
          ? results[1].value
          : { selection: null };
      setCharitySelection(charityRes.selection);

      setCharities(
        results[2].status === "fulfilled" ? results[2].value.charities : [],
      );
      setDrawEntries(
        results[3].status === "fulfilled" ? results[3].value.entries : [],
      );
      setUpcomingDraw(
        results[4].status === "fulfilled"
          ? results[4].value.upcomingDraw
          : null,
      );
      setWinnings(
        results[5].status === "fulfilled" ? results[5].value.winners : [],
      );

      if (charityRes.selection) {
        setSelectedCharity(charityRes.selection.charity_id);
        setContribution(charityRes.selection.contribution_percentage);
      }
    } catch (err) {
      toast.error("Failed to load dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── add score ──
  const handleAddScore = async (e) => {
    e.preventDefault();
    setScoreLoading(true);
    try {
      await api.post("/scores", scoreForm);
      toast.success("Score added!");
      setScoreForm({ score: "", date_played: "" });
      const res = await api.get("/scores");
      setScores(res.scores);
    } catch (err) {
      toast.error(err.error || "Failed to add score");
    } finally {
      setScoreLoading(false);
    }
  };

  // ── edit score ──
  const handleEditScore = async () => {
    setScoreLoading(true);
    try {
      await api.put(`/scores/${editingScore.id}`, {
        score: editingScore.score,
        date_played: editingScore.date_played,
      });
      toast.success("Score updated!");
      setEditingScore(null);
      const res = await api.get("/scores");
      setScores(res.scores);
    } catch (err) {
      toast.error(err.error || "Failed to update score");
    } finally {
      setScoreLoading(false);
    }
  };

  // ── delete score ──
  const handleDeleteScore = async (id) => {
    try {
      await api.delete(`/scores/${id}`);
      toast.success("Score deleted");
      setScores(scores.filter((s) => s.id !== id));
    } catch (err) {
      toast.error(err.error || "Failed to delete score");
    }
  };

  // ── update charity selection ──
  const handleUpdateCharity = async () => {
    try {
      const res = await api.post("/charities/user/selection", {
        charity_id: selectedCharity,
        contribution_percentage: contribution,
      });
      setCharitySelection(res.selection);
      setEditingCharity(false);
      toast.success("Charity updated!");
    } catch (err) {
      toast.error(err.error || "Failed to update charity");
    }
  };

  // ── upload proof ──
  const handleProofUpload = async (winnerId, file) => {
    setUploadingProof(winnerId);
    try {
      const formData = new FormData();
      formData.append("proof", file);
      await api.upload(`/winners/${winnerId}/proof`, formData);
      toast.success("Proof submitted for review!");
      const res = await api.get("/winners/my");
      setWinnings(res.winners);
    } catch (err) {
      toast.error(err.error || "Failed to upload proof");
    } finally {
      setUploadingProof(null);
    }
  };

  // ── independent donation ──
  const handleDonation = async () => {
    const amountNum = parseFloat(donationAmount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setDonating(true);
    try {
      // Force the amount into a 2-decimal string to satisfy PayPal's strict schema
      const formattedAmount = amountNum.toFixed(2);

      const { approvalUrl } = await api.post("/donations/create-order", {
        charity_id: charitySelection?.charity_id,
        amount: formattedAmount,
      });
      window.location.assign(approvalUrl);
    } catch (err) {
      toast.error(err.error || err.message || "Failed to create donation");
    } finally {
      setDonating(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const totalWon = winnings.reduce((sum, w) => sum + (w.prize_amount || 0), 0);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* ── header ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold font-['Syne']">
            Welcome back, {profile?.full_name || "Golfer"} 👋
          </h1>
          <p className="text-zinc-500 mt-1">Here's your GolfGives overview</p>
        </motion.div>

        {/* ── MODULE 1: Subscription Status ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="text-emerald-400" size={20} />
            <h2 className="font-bold font-['Syne']">Subscription</h2>
          </div>
          {subscription ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <SubscriptionBadge status={subscription.status} />
                <p className="text-zinc-400 text-sm capitalize mt-2">
                  {subscription.plan} plan
                </p>
                <p className="text-zinc-500 text-xs">
                  Renews:{" "}
                  {new Date(subscription.current_period_end).toLocaleDateString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    await api.post("/subscriptions/cancel", {});
                    toast.success("Subscription cancelled");
                    refreshSubscription(); // Refresh state after cancelling
                  } catch (err) {
                    toast.error(err.error || "Failed to cancel");
                  }
                }}
                className="text-sm text-red-400 hover:text-red-300 border border-red-500/30 px-4 py-2 rounded-xl transition-all"
              >
                Cancel Subscription
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-zinc-500">No active subscription</p>
              <Link
                to="/subscribe"
                className="bg-emerald-500 text-black font-bold px-4 py-2 rounded-xl text-sm"
              >
                Subscribe Now
              </Link>
            </div>
          )}
        </motion.div>

        {/* ── MODULE 2: Score Entry ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Target className="text-emerald-400" size={20} />
            <h2 className="font-bold font-['Syne']">Golf Scores</h2>
            <span className="text-xs text-zinc-500 ml-auto">
              {scores.length}/5 scores
            </span>
          </div>

          {/* scores list */}
          <div className="space-y-3 mb-6">
            {scores.length === 0 && (
              <p className="text-zinc-500 text-sm">
                No scores yet. Add your first score below.
              </p>
            )}
            {scores.map((score) =>
              editingScore?.id === score.id ? (
                <div
                  key={score.id}
                  className="flex gap-2 p-4 border border-emerald-500/30 rounded-xl bg-emerald-500/5"
                >
                  <input
                    type="number"
                    min="1"
                    max="45"
                    value={editingScore.score}
                    onChange={(e) =>
                      setEditingScore({
                        ...editingScore,
                        score: e.target.value,
                      })
                    }
                    className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="date"
                    value={editingScore.date_played}
                    onChange={(e) =>
                      setEditingScore({
                        ...editingScore,
                        date_played: e.target.value,
                      })
                    }
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleEditScore}
                    disabled={scoreLoading}
                    className="p-2 bg-emerald-500 text-black rounded-lg"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => setEditingScore(null)}
                    className="p-2 bg-zinc-700 text-white rounded-lg"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <ScoreCard
                  key={score.id}
                  score={score}
                  onEdit={setEditingScore}
                  onDelete={handleDeleteScore}
                />
              ),
            )}
          </div>

          {/* add score form */}
          <form onSubmit={handleAddScore} className="flex flex-wrap gap-3">
            <input
              type="number"
              min="1"
              max="45"
              placeholder="Score (1-45)"
              value={scoreForm.score}
              onChange={(e) =>
                setScoreForm((f) => ({ ...f, score: e.target.value }))
              }
              required
              className="w-36 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500"
            />
            <input
              type="date"
              value={scoreForm.date_played}
              onChange={(e) =>
                setScoreForm((f) => ({ ...f, date_played: e.target.value }))
              }
              required
              max={new Date().toISOString().split("T")[0]}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={scoreLoading}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
            >
              <Plus size={14} />
              {scoreLoading ? "Adding..." : "Add Score"}
            </button>
          </form>
        </motion.div>

        {/* ── MODULE 3: Charity ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Heart className="text-rose-400" size={20} />
            <h2 className="font-bold font-['Syne']">Charity Support</h2>
            <button
              onClick={() => setEditingCharity(!editingCharity)}
              className="ml-auto text-zinc-500 hover:text-white transition-colors"
            >
              <Pencil size={14} />
            </button>
          </div>

          {charitySelection ? (
            <div>
              <div className="flex items-center gap-4 mb-4">
                {charitySelection.charities?.image_url && (
                  <img
                    src={charitySelection.charities.image_url}
                    alt={charitySelection.charities.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold">
                    {charitySelection.charities?.name}
                  </p>
                  <p className="text-emerald-400 text-sm font-semibold">
                    {charitySelection.contribution_percentage}% of subscription
                  </p>
                </div>
              </div>

              {editingCharity && (
                <div className="space-y-4 mt-4 pt-4 border-t border-zinc-800">
                  <select
                    value={selectedCharity}
                    onChange={(e) => setSelectedCharity(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    {charities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-zinc-400">
                        Contribution
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {contribution}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={contribution}
                      onChange={(e) =>
                        setContribution(parseInt(e.target.value))
                      }
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <button
                    onClick={handleUpdateCharity}
                    className="w-full bg-emerald-500 text-black font-bold py-2.5 rounded-xl text-sm"
                  >
                    Save Changes
                  </button>
                </div>
              )}

              {/* independent donation */}
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-sm text-zinc-400 mb-3">
                  Make an independent donation
                </p>
                <div className="flex flex-wrap gap-3">
                  <input
                    type="number"
                    placeholder="Amount ($)"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleDonation}
                    disabled={donating}
                    className="flex items-center gap-2 bg-rose-500 hover:bg-rose-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
                  >
                    <Heart size={14} />
                    {donating ? "Processing..." : "Donate"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-zinc-500 text-sm">No charity selected</p>
              <Link
                to="/onboarding"
                className="text-emerald-400 text-sm flex items-center gap-1"
              >
                Choose charity <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </motion.div>

        {/* ── MODULE 4: Draw Participation ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="text-yellow-400" size={20} />
            <h2 className="font-bold font-['Syne']">Draw Participation</h2>
          </div>

          {upcomingDraw && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-4">
              <p className="text-yellow-400 text-sm font-semibold">
                Upcoming Draw
              </p>
              <p className="text-white font-bold">
                {new Date(upcomingDraw.draw_month).toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-zinc-500 text-xs mt-1">
                {scores.length > 0
                  ? "✅ You are eligible"
                  : "⚠️ Add scores to be eligible"}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {drawEntries.length === 0 && (
              <p className="text-zinc-500 text-sm">No draws entered yet.</p>
            )}
            {drawEntries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-800"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {new Date(entry.draws?.draw_month).toLocaleDateString(
                      "en-GB",
                      { month: "long", year: "numeric" },
                    )}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Numbers:{" "}
                    {entry.draws?.draw_numbers?.join(", ") || "Pending"}
                  </p>
                </div>
                <div
                  className={`text-sm font-bold ${
                    entry.numbers_matched >= 3
                      ? "text-emerald-400"
                      : "text-zinc-500"
                  }`}
                >
                  {entry.numbers_matched} matched
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── MODULE 5: Winnings ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={5}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Award className="text-emerald-400" size={20} />
            <h2 className="font-bold font-['Syne']">Winnings</h2>
            {totalWon > 0 && (
              <span className="ml-auto text-emerald-400 font-bold">
                ${totalWon.toFixed(2)} total
              </span>
            )}
          </div>

          {winnings.length === 0 ? (
            <p className="text-zinc-500 text-sm">
              No winnings yet. Keep playing!
            </p>
          ) : (
            <div className="space-y-4">
              {winnings.map((winner) => (
                <div
                  key={winner.id}
                  className="p-4 rounded-xl border border-zinc-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">
                        {winner.match_type}-Number Match — $
                        {winner.prize_amount}
                      </p>
                      <p className="text-zinc-500 text-xs">
                        {new Date(winner.draws?.draw_month).toLocaleDateString(
                          "en-GB",
                          { month: "long", year: "numeric" },
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          winner.verification_status === "approved"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : winner.verification_status === "rejected"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {winner.verification_status}
                      </span>
                      <p
                        className={`text-xs mt-1 ${
                          winner.payout_status === "paid"
                            ? "text-emerald-400"
                            : "text-zinc-500"
                        }`}
                      >
                        {winner.payout_status}
                      </p>
                    </div>
                  </div>

                  {/* proof upload */}
                  {winner.verification_status === "pending" &&
                    !winner.proof_url && (
                      <div className="mt-3">
                        <label className="flex items-center gap-2 cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300 px-4 py-2.5 rounded-xl transition-all w-fit">
                          <Upload size={14} />
                          {uploadingProof === winner.id
                            ? "Uploading..."
                            : "Upload Proof"}
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files[0]) {
                                handleProofUpload(winner.id, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  {winner.proof_url &&
                    winner.verification_status === "pending" && (
                      <p className="text-xs text-yellow-400 mt-2">
                        ✓ Proof submitted — awaiting review
                      </p>
                    )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
