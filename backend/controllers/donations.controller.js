import supabase from "../lib/supabase.js";

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

// ── create donation order — not tied to gameplay ──
// independent donation option
export const createDonationOrder = async (req, res) => {
  try {
    const { charity_id, amount, note } = req.body;

    if (!charity_id)
      return res.status(400).json({ error: "charity_id is required" });
    if (!amount || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({ error: "Valid donation amount is required" });
    }

    // verify charity exists
    const { data: charity, error: charityError } = await supabase
      .from("charities")
      .select("id, name")
      .eq("id", charity_id)
      .single();

    if (charityError || !charity) {
      return res.status(404).json({ error: "Charity not found" });
    }

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
              value: Math.round(parseFloat(amount)).toString(),
            },
            description: `Donation to ${charity.name} via GolfGives`,
            custom_id: `${req.user.id}|${charity_id}|${amount}`,
          },
        ],
        application_context: {
          return_url: `${process.env.FRONTEND_URL}/dashboard?donated=true`,
          cancel_url: `${process.env.FRONTEND_URL}/dashboard?donation_cancelled=true`,
          brand_name: "GolfGives",
          user_action: "DONATE",
        },
      }),
    });

    const data = await resp.json();
    if (!resp.ok)
      throw new Error(data.message || "Failed to create donation order");

    // create pending donation record
    await supabase.from("donations").insert({
      user_id: req.user.id,
      charity_id,
      amount: parseFloat(amount),
      note,
      paypal_order_id: data.id,
      status: "pending",
    });

    const approvalUrl = data.links.find((l) => l.rel === "approve")?.href;
    res.json({ orderId: data.id, approvalUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── capture donation after PayPal approval ──
export const captureDonation = async (req, res) => {
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
    if (!resp.ok) throw new Error(data.message || "Failed to capture donation");

    if (data.status !== "COMPLETED") {
      return res.status(400).json({ error: "Donation payment not completed" });
    }

    // update donation status to completed
    const { error } = await supabase
      .from("donations")
      .update({ status: "completed" })
      .eq("paypal_order_id", orderId);

    if (error) throw new Error(error.message);

    res.json({ message: "Donation completed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── get user donation history ──
export const getMyDonations = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("donations")
      .select("*, charities(name, image_url)")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ donations: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch donations" });
  }
};

// ── get all donations — admin only ──
export const getAllDonations = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("donations")
      .select("*, charities(name), profiles(full_name)")
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ donations: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch donations" });
  }
};
