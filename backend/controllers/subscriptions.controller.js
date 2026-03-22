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
    console.log("User in request:", req.user.id);

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
              currency_code: "USD",
              value: planDetails.amount.toFixed(2),
            },
            description: `GolfGives ${planDetails.label} Subscription`,
            // Store user + plan so PayPal holds it for us
            custom_id: `${req.user.id}|${plan}`,
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

    console.log("Sending PayPal order:", {
      amount: planDetails.amount,
      currency: "USD",
    });

    // get approval URL to redirect user
    const approvalUrl = data.links.find((l) => l.rel === "approve")?.href;

    res.json({ orderId: data.id, approvalUrl });
  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── capture PayPal order after user approves ──
export const captureOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) return res.status(400).json({ error: "orderId is required" });

    // .maybeSingle() so new orders don't crash on 0 rows!
    const { data: alreadyProcessed } = await supabase
      .from("subscriptions")
      .select("id, paypal_order_id")
      .eq("paypal_order_id", orderId)
      .maybeSingle();

    if (alreadyProcessed) {
      console.log(`Order ${orderId} already processed. Skipping duplicate.`);
      return res.json({
        message: "Subscription already activated successfully",
      });
    }

    const token = await getPayPalToken();

    const orderResp = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${orderId}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const orderData = await orderResp.json();
    if (!orderResp.ok) throw new Error("Failed to verify original order");

    const customId = orderData.purchase_units[0]?.custom_id || "";
    const [userId, plan] = customId.split("|");

    if (!userId || !plan || userId !== req.user.id) {
      return res
        .status(400)
        .json({ error: "Invalid order metadata or user mismatch" });
    }

    let paymentStatus = orderData.status;

    if (paymentStatus !== "COMPLETED") {
      const captureResp = await fetch(
        `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const captureData = await captureResp.json();

      if (!captureResp.ok) {
        const isDuplicateRequest =
          JSON.stringify(captureData).includes("semantically incorrect") ||
          JSON.stringify(captureData).includes("ORDER_ALREADY_CAPTURED");

        if (isDuplicateRequest) {
          console.log("Parallel React capture ignored safely.");
          return res.json({
            message: "Capture in progress by another thread.",
          });
        }
        throw new Error(
          captureData.message || "Failed to capture PayPal order",
        );
      }
      paymentStatus = captureData.status;
    }

    if (paymentStatus !== "COMPLETED") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    const planDetails = PLANS[plan];
    const now = new Date();
    const periodEnd = new Date(now);

    if (plan === "monthly") {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // limit(1) and ORDER BY so it doesn't crash on multiple old subscriptions!
    // This grabs the exact subscription the Admin just cancelled and overwrites it.
    const { data: existingSubs } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const existingSub =
      existingSubs && existingSubs.length > 0 ? existingSubs[0] : null;

    const subPayload = {
      plan,
      status: SUBSCRIPTION_STATUS.active,
      paypal_order_id: orderId,
      amount_paid: planDetails.amount,
      current_period_start: now,
      current_period_end: periodEnd,
      updated_at: now,
    };

    let subscription;

    if (existingSub) {
      // Update existing/cancelled subscription
      const { data, error } = await supabase
        .from("subscriptions")
        .update(subPayload)
        .eq("id", existingSub.id)
        .select()
        .single();

      if (error) throw new Error(`DB Update Error: ${error.message}`);
      subscription = data;
    } else {
      // Insert brand new subscription
      const { data, error } = await supabase
        .from("subscriptions")
        .insert({
          user_id: req.user.id,
          ...subPayload,
        })
        .select()
        .single();

      if (error) throw new Error(`DB Insert Error: ${error.message}`);
      subscription = data;
    }

    const userEmail = req.user.email;
    const userName = req.user.user_metadata?.full_name || "Subscriber";

    try {
      await sendSubscriptionConfirmation(
        userEmail,
        userName,
        planDetails.label,
      );
    } catch (emailErr) {
      console.error("Email failed, but sub succeeded:", emailErr);
    }

    res.json({ subscription, message: "Subscription activated successfully" });
  } catch (err) {
    console.error("Capture Order Error:", err.message);
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
