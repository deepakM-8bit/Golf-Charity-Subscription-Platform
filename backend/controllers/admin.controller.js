import supabase from "../lib/supabase.js";
import { SUBSCRIPTION_STATUS } from "../config/constants.js";

// ── analytics overview — PRD Section 11 ──
export const getAnalytics = async (req, res) => {
  try {
    const [
      { count: totalUsers },
      { count: activeSubscribers },
      { data: draws },
      { data: winners },
      { data: donations },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", SUBSCRIPTION_STATUS.active),
      supabase
        .from("draws")
        .select("total_pool, pool_5match, status")
        .eq("status", "published"),
      supabase
        .from("winners")
        .select("prize_amount, payout_status, verification_status"),
      supabase.from("donations").select("amount, status"),
      // .eq("status", "completed"),
    ]);

    const totalPrizePool =
      draws?.reduce((sum, d) => sum + (parseFloat(d.total_pool) || 0), 0) || 0;
    const totalPaidOut =
      winners
        ?.filter((w) => w.payout_status === "paid")
        .reduce((sum, w) => sum + (parseFloat(w.prize_amount) || 0), 0) || 0;
    const pendingVerification =
      winners?.filter(
        (w) => w.verification_status === "pending" && w.prize_amount,
      ).length || 0;
    const totalDonations =
      donations?.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0) || 0;

    res.json({
      analytics: {
        totalUsers: totalUsers || 0,
        activeSubscribers: activeSubscribers || 0,
        totalPrizePool: totalPrizePool.toFixed(2),
        totalPaidOut: totalPaidOut.toFixed(2),
        pendingVerification,
        totalDonations: totalDonations.toFixed(2),
        totalDraws: draws?.length || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};

// ── get all users with subscription info ──
export const getUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "*, subscriptions(plan, status, current_period_end), user_charities(contribution_percentage, charities(name))",
      )
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ users: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// ── get single user full details ──
export const getUser = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "*, subscriptions(*), user_charities(*, charities(*)), winners(*, draws(draw_month))",
      )
      .eq("id", req.params.id)
      .single();

    if (error || !data)
      return res.status(404).json({ error: "User not found" });

    // get scores separately — ordered correctly
    const { data: scores } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", req.params.id)
      .order("date_played", { ascending: false });

    res.json({ user: { ...data, scores } });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// ── update user profile — admin ──
export const updateUser = async (req, res) => {
  try {
    const { full_name, role } = req.body;

    const { data, error } = await supabase
      .from("profiles")
      .update({ full_name, role, updated_at: new Date() })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "User not found" });

    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
};

// ── edit user score — admin ──
// admin can edit golf scores
export const editUserScore = async (req, res) => {
  try {
    const { score_id, score, date_played } = req.body;

    if (!score_id || !score || !date_played) {
      return res
        .status(400)
        .json({ error: "score_id, score and date_played are required" });
    }

    const { data, error } = await supabase
      .from("scores")
      .update({ score: parseInt(score), date_played, updated_at: new Date() })
      .eq("id", score_id)
      .eq("user_id", req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Score not found" });

    res.json({ score: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to update score" });
  }
};

// ── manage subscription status — admin ──
export const updateSubscription = async (req, res) => {
  try {
    const { status } = req.body;

    if (!Object.values(SUBSCRIPTION_STATUS).includes(status)) {
      return res.status(400).json({ error: "Invalid subscription status" });
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .update({ status, updated_at: new Date() })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Subscription not found" });

    res.json({ subscription: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to update subscription" });
  }
};
