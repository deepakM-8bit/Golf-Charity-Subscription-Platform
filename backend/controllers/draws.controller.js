import supabase from "../lib/supabase.js";
import {
  generateRandomDraw,
  generateAlgorithmicDraw,
  countMatches,
} from "../utils/drawEngine.js";
import {
  calculatePrizePool,
  splitPrize,
  getJackpotCarryover,
} from "../utils/prizeCalculator.js";
import { sendDrawResults, sendWinnerAlert } from "../utils/emailService.js";
import {
  DRAW_STATUS,
  DRAW_TYPE,
  MATCH_TYPES,
  PRIZE_POOL_PERCENTAGES,
} from "../config/constants.js";

// ── get all published draws — public ──
export const getPublishedDraws = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .eq("status", DRAW_STATUS.published)
      .order("draw_month", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ draws: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch draws" });
  }
};

// ── get all draws — admin only ──
export const getAllDraws = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .order("draw_month", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ draws: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch draws" });
  }
};

// ── get single draw ──
export const getDraw = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error || !data)
      return res.status(404).json({ error: "Draw not found" });
    res.json({ draw: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch draw" });
  }
};

// ── create draw — admin only ──
export const createDraw = async (req, res) => {
  try {
    const { draw_month, draw_type } = req.body;

    if (!draw_month) {
      return res
        .status(400)
        .json({ error: "draw_month is required (YYYY-MM-DD)" });
    }

    // check draw for this month doesn't already exist
    const { data: existing } = await supabase
      .from("draws")
      .select("id")
      .eq("draw_month", draw_month)
      .single();

    if (existing) {
      return res
        .status(400)
        .json({ error: "Draw for this month already exists" });
    }

    // get jackpot carryover from previous draw
    const carriedOver = await getJackpotCarryover();

    // calculate prize pools
    const { total, breakdown, subscriberCount } =
      await calculatePrizePool(carriedOver);

    const { data, error } = await supabase
      .from("draws")
      .insert({
        draw_month,
        draw_type: draw_type || DRAW_TYPE.random,
        status: DRAW_STATUS.pending,
        jackpot_carried_over: carriedOver,
        total_pool: total,
        pool_5match: breakdown.pool_5match,
        pool_4match: breakdown.pool_4match,
        pool_3match: breakdown.pool_3match,
        active_subscriber_count: subscriberCount,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ draw: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to create draw" });
  }
};

// ── simulate draw — admin only ──
// simulation/pre-analysis mode before official publish
export const simulateDraw = async (req, res) => {
  try {
    const { data: draw, error: drawError } = await supabase
      .from("draws")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (drawError || !draw)
      return res.status(404).json({ error: "Draw not found" });

    if (draw.status === DRAW_STATUS.published) {
      return res.status(400).json({ error: "Draw already published" });
    }

    // generate draw numbers based on type
    const drawNumbers =
      draw.draw_type === DRAW_TYPE.algorithmic
        ? await generateAlgorithmicDraw()
        : generateRandomDraw();

    // get all active subscribers
    const { data: activeSubs } = await supabase
      .from("subscriptions")
      .select("user_id")
      .eq("status", "active");

    const entries = [];
    const potentialWinners = { 5: [], 4: [], 3: [] };

    // snapshot scores for each subscriber + count matches
    for (const sub of activeSubs || []) {
      const { data: userScores } = await supabase
        .from("scores")
        .select("score")
        .eq("user_id", sub.user_id);

      const scores = userScores?.map((s) => s.score) || [];
      const matched = countMatches(scores, drawNumbers);

      entries.push({
        draw_id: req.params.id,
        user_id: sub.user_id,
        user_scores: scores,
        numbers_matched: matched,
      });

      if (matched >= 3) {
        potentialWinners[matched]?.push(sub.user_id);
      }
    }

    // upsert entries — allows re-simulation
    if (entries.length > 0) {
      await supabase
        .from("draw_entries")
        .upsert(entries, { onConflict: "draw_id,user_id" });
    }

    // update draw with numbers + simulated status
    const { data: updated, error: updateError } = await supabase
      .from("draws")
      .update({
        draw_numbers: drawNumbers,
        status: DRAW_STATUS.simulated,
        updated_at: new Date(),
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (updateError)
      return res.status(400).json({ error: updateError.message });

    res.json({
      draw: updated,
      simulation: {
        drawNumbers,
        totalEntries: entries.length,
        potentialWinners,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to simulate draw" });
  }
};

// ── publish draw — admin only ──
// admin controls publishing of draw results
export const publishDraw = async (req, res) => {
  try {
    const { data: draw, error: drawError } = await supabase
      .from("draws")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (drawError || !draw)
      return res.status(404).json({ error: "Draw not found" });

    if (draw.status !== DRAW_STATUS.simulated) {
      return res
        .status(400)
        .json({ error: "Draw must be simulated before publishing" });
    }

    // get all winning entries (3+ matches)
    const { data: winningEntries } = await supabase
      .from("draw_entries")
      .select("*")
      .eq("draw_id", req.params.id)
      .gte("numbers_matched", 3);

    // group winners by match type
    const groups = { 5: [], 4: [], 3: [] };
    for (const entry of winningEntries || []) {
      if (groups[entry.numbers_matched]) {
        groups[entry.numbers_matched].push(entry);
      }
    }

    // create winner records with split prizes
    const winnersToInsert = [];
    const poolMap = {
      5: draw.pool_5match,
      4: draw.pool_4match,
      3: draw.pool_3match,
    };

    for (const matchType of MATCH_TYPES) {
      const group = groups[matchType];
      if (group.length === 0) continue;

      const prizePerWinner = splitPrize(poolMap[matchType], group.length);

      for (const entry of group) {
        winnersToInsert.push({
          draw_id: req.params.id,
          user_id: entry.user_id,
          match_type: matchType,
          prize_amount: prizePerWinner,
        });
      }
    }

    if (winnersToInsert.length > 0) {
      await supabase.from("winners").insert(winnersToInsert);
    }

    // publish the draw
    const { data: published, error: publishError } = await supabase
      .from("draws")
      .update({
        status: DRAW_STATUS.published,
        published_at: new Date(),
        updated_at: new Date(),
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (publishError)
      return res.status(400).json({ error: publishError.message });

    // send emails to all participants
    const { data: allEntries } = await supabase
      .from("draw_entries")
      .select("user_id, numbers_matched")
      .eq("draw_id", req.params.id);

    for (const entry of allEntries || []) {
      const {
        data: { user },
      } = await supabase.auth.admin.getUserById(entry.user_id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", entry.user_id)
        .single();

      // send draw results email to everyone
      await sendDrawResults(
        user.email,
        profile?.full_name || "Subscriber",
        draw.draw_month,
        draw.draw_numbers,
        entry.numbers_matched,
      );

      // send winner alert to winners
      if (entry.numbers_matched >= 3) {
        const winner = winnersToInsert.find((w) => w.user_id === entry.user_id);
        if (winner) {
          await sendWinnerAlert(
            user.email,
            profile?.full_name || "Subscriber",
            entry.numbers_matched,
            winner.prize_amount,
          );
        }
      }
    }

    res.json({
      draw: published,
      winnersCreated: winnersToInsert.length,
      message: "Draw published successfully",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to publish draw" });
  }
};

// Delete the draws
export const deleteDraw = async (req, res) => {
  try {
    const { data: draw } = await supabase
      .from("draws")
      .select("status")
      .eq("id", req.params.id)
      .single();

    if (!draw) return res.status(404).json({ error: "Draw not found" });

    if (draw.status === "published") {
      return res.status(400).json({ error: "Cannot delete a published draw" });
    }

    await supabase.from("draw_entries").delete().eq("draw_id", req.params.id);
    await supabase.from("draws").delete().eq("id", req.params.id);

    res.json({ message: "Draw deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete draw" });
  }
};

// ── get user draw entries ──
export const getUserEntries = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("draw_entries")
      .select(
        "*, draws(draw_month, draw_numbers, status, pool_5match, pool_4match, pool_3match)",
      )
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ entries: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch draw entries" });
  }
};

// ── get upcoming draw ──
export const getUpcomingDraw = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .in("status", [DRAW_STATUS.pending, DRAW_STATUS.simulated])
      .order("draw_month", { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      return res.status(400).json({ error: error.message });
    }

    res.json({ upcomingDraw: data || null });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch upcoming draw" });
  }
};
