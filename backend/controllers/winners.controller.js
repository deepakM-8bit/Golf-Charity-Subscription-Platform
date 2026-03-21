import supabase from "../lib/supabase.js";
import {
  uploadWinnerProof,
  getWinnerProofUrl,
} from "../utils/uploadService.js";
import { sendProofApproved, sendProofRejected } from "../utils/emailService.js";
import { VERIFICATION_STATUS, PAYOUT_STATUS } from "../config/constants.js";

// ── get user's own winnings ──
export const getMyWinnings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("winners")
      .select("*, draws(draw_month, draw_numbers)")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ winners: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch winnings" });
  }
};

// ── upload proof screenshot ──
// winner uploads screenshot of scores
export const uploadProof = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "Proof file is required" });
    }

    // verify winner belongs to this user
    const { data: winner, error: winnerError } = await supabase
      .from("winners")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .single();

    if (winnerError || !winner) {
      return res.status(404).json({ error: "Winner record not found" });
    }

    if (winner.verification_status === VERIFICATION_STATUS.approved) {
      return res.status(400).json({ error: "Proof already approved" });
    }

    // upload to Supabase Storage private bucket
    const filePath = await uploadWinnerProof(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      req.user.id,
    );

    const { data, error } = await supabase
      .from("winners")
      .update({
        proof_url: filePath,
        verification_status: VERIFICATION_STATUS.pending,
        updated_at: new Date(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json({ winner: data, message: "Proof submitted for review" });
  } catch (err) {
    res.status(500).json({ error: "Failed to upload proof" });
  }
};

// ── get all winners — admin only ──
export const getAllWinners = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("winners")
      .select("*, profiles(full_name), draws(draw_month, draw_numbers)")
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ winners: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch winners" });
  }
};

// ── get winner proof signed URL — admin only ──
export const getProofUrl = async (req, res) => {
  try {
    const { data: winner, error } = await supabase
      .from("winners")
      .select("proof_url")
      .eq("id", req.params.id)
      .single();

    if (error || !winner)
      return res.status(404).json({ error: "Winner not found" });
    if (!winner.proof_url)
      return res.status(404).json({ error: "No proof uploaded yet" });

    const signedUrl = await getWinnerProofUrl(winner.proof_url);
    res.json({ url: signedUrl });
  } catch (err) {
    res.status(500).json({ error: "Failed to get proof URL" });
  }
};

// ── verify winner — admin approve or reject ──
// admin review → approve or reject
export const verifyWinner = async (req, res) => {
  try {
    const { verification_status, admin_notes } = req.body;

    if (!Object.values(VERIFICATION_STATUS).includes(verification_status)) {
      return res.status(400).json({ error: "Invalid verification status" });
    }

    if (verification_status === VERIFICATION_STATUS.pending) {
      return res
        .status(400)
        .json({ error: "Cannot set status back to pending" });
    }

    const { data: winner, error: winnerError } = await supabase
      .from("winners")
      .select("*, profiles(full_name)")
      .eq("id", req.params.id)
      .single();

    if (winnerError || !winner)
      return res.status(404).json({ error: "Winner not found" });

    const { data, error } = await supabase
      .from("winners")
      .update({
        verification_status,
        admin_notes,
        updated_at: new Date(),
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // get user email for notification
    const {
      data: { user },
    } = await supabase.auth.admin.getUserById(winner.user_id);
    const userName = winner.profiles?.full_name || "Subscriber";

    // send email based on decision
    if (verification_status === VERIFICATION_STATUS.approved) {
      await sendProofApproved(user.email, userName, winner.prize_amount);
    } else if (verification_status === VERIFICATION_STATUS.rejected) {
      await sendProofRejected(user.email, userName, admin_notes);
    }

    res.json({
      winner: data,
      message: `Winner ${verification_status} successfully`,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to verify winner" });
  }
};

// ── mark payout as paid — admin only ──
// payment states pending → paid
export const markPaid = async (req, res) => {
  try {
    const { data: winner, error: winnerError } = await supabase
      .from("winners")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (winnerError || !winner)
      return res.status(404).json({ error: "Winner not found" });

    // must be approved before marking as paid
    if (winner.verification_status !== VERIFICATION_STATUS.approved) {
      return res
        .status(400)
        .json({ error: "Winner must be approved before marking as paid" });
    }

    if (winner.payout_status === PAYOUT_STATUS.paid) {
      return res.status(400).json({ error: "Already marked as paid" });
    }

    const { data, error } = await supabase
      .from("winners")
      .update({
        payout_status: PAYOUT_STATUS.paid,
        updated_at: new Date(),
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json({ winner: data, message: "Payout marked as paid" });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark payout" });
  }
};
