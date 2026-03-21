import supabase from "../lib/supabase.js";
import { SCORE_MIN, SCORE_MAX } from "../config/constants.js";

// ── get user scores — reverse chronological ──
export const getScores = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", req.user.id)
      .order("date_played", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ scores: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch scores" });
  }
};

// ── add new score — rolling logic handled by DB trigger ──
export const addScore = async (req, res) => {
  try {
    const { score, date_played } = req.body;

    if (!score || !date_played) {
      return res
        .status(400)
        .json({ error: "Score and date_played are required" });
    }

    const parsedScore = parseInt(score);

    if (
      isNaN(parsedScore) ||
      parsedScore < SCORE_MIN ||
      parsedScore > SCORE_MAX
    ) {
      return res.status(400).json({
        error: `Score must be between ${SCORE_MIN} and ${SCORE_MAX} (Stableford format)`,
      });
    }

    // validate date
    const parsedDate = new Date(date_played);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // future date check
    if (parsedDate > new Date()) {
      return res.status(400).json({ error: "Date cannot be in the future" });
    }

    const { data, error } = await supabase
      .from("scores")
      .insert({
        user_id: req.user.id,
        score: parsedScore,
        date_played,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ score: data, message: "Score added successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add score" });
  }
};

// ── edit existing score ──
export const editScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, date_played } = req.body;

    if (!score || !date_played) {
      return res
        .status(400)
        .json({ error: "Score and date_played are required" });
    }

    const parsedScore = parseInt(score);

    if (
      isNaN(parsedScore) ||
      parsedScore < SCORE_MIN ||
      parsedScore > SCORE_MAX
    ) {
      return res.status(400).json({
        error: `Score must be between ${SCORE_MIN} and ${SCORE_MAX} (Stableford format)`,
      });
    }

    const parsedDate = new Date(date_played);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    if (parsedDate > new Date()) {
      return res.status(400).json({ error: "Date cannot be in the future" });
    }

    // ensure score belongs to this user
    const { data, error } = await supabase
      .from("scores")
      .update({
        score: parsedScore,
        date_played,
        updated_at: new Date(),
      })
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Score not found" });

    res.json({ score: data, message: "Score updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update score" });
  }
};

// ── delete score ──
export const deleteScore = async (req, res) => {
  try {
    const { id } = req.params;

    // ensure score belongs to this user
    const { data, error } = await supabase
      .from("scores")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Score not found" });

    res.json({ message: "Score deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete score" });
  }
};
