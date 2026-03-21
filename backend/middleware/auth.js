import supabase from "../lib/supabase.js";
import { ROLES, SUBSCRIPTION_STATUS } from "../config/constants.js";

// ── verify Supabase JWT token ──
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Unauthorized — no token provided" });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res
        .status(401)
        .json({ error: "Unauthorized — invalid or expired token" });
    }

    req.user = user;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return res
        .status(401)
        .json({ error: "Unauthorized — profile not found" });
    }

    req.profile = profile;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ error: "Unauthorized — token verification failed" });
  }
};

// ── check active subscription on every protected route ──
// real-time subscription status check on every authenticated request
export const requireSubscription = async (req, res, next) => {
  try {
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("status", SUBSCRIPTION_STATUS.active)
      .single();

    if (error || !subscription) {
      return res.status(403).json({
        error: "Active subscription required",
        code: "SUBSCRIPTION_REQUIRED",
      });
    }

    // auto-lapse if period expired
    if (new Date(subscription.current_period_end) < new Date()) {
      await supabase
        .from("subscriptions")
        .update({ status: SUBSCRIPTION_STATUS.lapsed, updated_at: new Date() })
        .eq("id", subscription.id);

      return res.status(403).json({
        error: "Subscription has expired — please renew",
        code: "SUBSCRIPTION_EXPIRED",
      });
    }

    req.subscription = subscription;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Subscription check failed" });
  }
};

// ── require admin role ──
export const requireAdmin = (req, res, next) => {
  if (!req.profile || req.profile.role !== ROLES.admin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};
