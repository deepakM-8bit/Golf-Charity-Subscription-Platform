import supabase from "../lib/supabase.js";
import { PLANS, SUBSCRIPTION_STATUS } from "../config/constants.js";
import { sendSubscriptionConfirmation } from "../utils/emailService.js";

const PAYPAL_API =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// ── get PayPal access token ──
const getPayPalToken = async () => {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const resp = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error_description || "PayPal auth failed");
  return data.access_token;
};

// ── create PayPal order ──
export const createOrder = async (req, res) => {
  try {
    const { plan } = req.body;
    console.log("User in request:", req.user);

    if (!["monthly", "yearly"].includes(plan)) {
      return res
        .status(400)
        .json({ error: "Invalid plan. Choose monthly or yearly." });
    }

    const planDetails = PLANS[plan];
    const token = await getPayPalToken();

    const resp = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "INR",
              value: String(Math.round(planDetails.amount)),
            },
            description: `GolfGives ${planDetails.label} Subscription`,
            custom_id: `${req.user.id}|${plan}`, // store user + plan for capture
          },
        ],
        application_context: {
          return_url: `${process.env.FRONTEND_URL}/subscribe/success`,
          cancel_url: `${process.env.FRONTEND_URL}/subscribe?cancelled=true`,
          brand_name: "GolfGives",
          user_action: "PAY_NOW",
        },
      }),
    });

    const data = await resp.json();
    if (!resp.ok)
      throw new Error(data.message || "Failed to create PayPal order");

    // get approval URL to redirect user
    const approvalUrl = data.links.find((l) => l.rel === "approve")?.href;

    res.json({ orderId: data.id, approvalUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── capture PayPal order after user approves ──
export const captureOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) return res.status(400).json({ error: "orderId is required" });

    const token = await getPayPalToken();

    const resp = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await resp.json();
    if (!resp.ok)
      throw new Error(data.message || "Failed to capture PayPal order");

    if (data.status !== "COMPLETED") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    // extract user + plan from custom_id
    const customId = data.purchase_units[0]?.custom_id || "";
    const [userId, plan] = customId.split("|");

    if (!userId || !plan) {
      return res.status(400).json({ error: "Invalid order metadata" });
    }

    const planDetails = PLANS[plan];
    const now = new Date();
    const periodEnd = new Date(now);

    // set period end based on plan
    if (plan === "monthly") {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // upsert subscription — handles both new and renewal
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          plan,
          status: SUBSCRIPTION_STATUS.active,
          paypal_order_id: data.id,
          amount_paid: planDetails.amount,
          current_period_start: now,
          current_period_end: periodEnd,
          updated_at: now,
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);

    // send confirmation email
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    const {
      data: { user },
    } = await supabase.auth.admin.getUserById(userId);

    await sendSubscriptionConfirmation(
      user.email,
      profile?.full_name || "Subscriber",
      planDetails.label,
    );

    res.json({ subscription, message: "Subscription activated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── get current subscription status ──
export const getStatus = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      return res.status(400).json({ error: error.message });
    }

    res.json({ subscription: data || null });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch subscription status" });
  }
};

// ── cancel subscription ──
export const cancelSubscription = async (req, res) => {
  try {
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", req.user.id)
      .eq("status", SUBSCRIPTION_STATUS.active)
      .single();

    if (error || !subscription) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    // mark as cancelled — user keeps access till period end
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: SUBSCRIPTION_STATUS.cancelled,
        updated_at: new Date(),
      })
      .eq("id", subscription.id);

    if (updateError) throw new Error(updateError.message);

    res.json({
      message:
        "Subscription cancelled. Access remains until end of billing period.",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
};
