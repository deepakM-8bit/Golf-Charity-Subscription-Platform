import supabase from "../lib/supabase.js";
import {
  PRIZE_POOL_PERCENTAGES,
  PRIZE_POOL_CONTRIBUTION_MONTHLY,
  PRIZE_POOL_CONTRIBUTION_YEARLY,
  JACKPOT_MATCH,
  SUBSCRIPTION_STATUS,
} from "../config/constants.js";

// ── calculate total prize pool from active subscribers ──
export const calculatePrizePool = async (carriedOver = 0) => {
  try {
    const { data: activeSubs, error } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("status", SUBSCRIPTION_STATUS.active);

    if (error || !activeSubs)
      return { total: 0, breakdown: {}, subscriberCount: 0 };

    // calculate pool from each subscriber based on plan
    let totalPool = carriedOver;
    activeSubs.forEach(({ plan }) => {
      totalPool +=
        plan === "monthly"
          ? PRIZE_POOL_CONTRIBUTION_MONTHLY
          : PRIZE_POOL_CONTRIBUTION_YEARLY;
    });

    const breakdown = {
      pool_5match: parseFloat(
        (totalPool * PRIZE_POOL_PERCENTAGES[5]).toFixed(2),
      ),
      pool_4match: parseFloat(
        (totalPool * PRIZE_POOL_PERCENTAGES[4]).toFixed(2),
      ),
      pool_3match: parseFloat(
        (totalPool * PRIZE_POOL_PERCENTAGES[3]).toFixed(2),
      ),
    };

    return {
      total: parseFloat(totalPool.toFixed(2)),
      breakdown,
      subscriberCount: activeSubs.length,
    };
  } catch (err) {
    return { total: 0, breakdown: {}, subscriberCount: 0 };
  }
};

// ── split prize equally among winners in same tier ──
export const splitPrize = (poolAmount, winnerCount) => {
  if (!winnerCount || winnerCount === 0) return 0;
  return parseFloat((poolAmount / winnerCount).toFixed(2));
};

// ── get jackpot carryover from last published draw ──
// jackpot rolls over if no 5-match winner
export const getJackpotCarryover = async () => {
  try {
    const { data: lastDraw, error } = await supabase
      .from("draws")
      .select("id, pool_5match")
      .eq("status", "published")
      .order("draw_month", { ascending: false })
      .limit(1)
      .single();

    if (error || !lastDraw) return 0;

    // check if last draw had a 5-match winner
    const { data: jackpotWinner } = await supabase
      .from("winners")
      .select("id")
      .eq("draw_id", lastDraw.id)
      .eq("match_type", JACKPOT_MATCH)
      .limit(1)
      .single();

    // no 5-match winner → carry over jackpot pool
    if (!jackpotWinner) {
      return parseFloat(lastDraw.pool_5match || 0);
    }

    return 0;
  } catch (err) {
    return 0;
  }
};

// ── calculate charity contribution amount from subscription ──
// min 10% of subscription fee goes to charity
export const calculateCharityContribution = (
  subscriptionAmount,
  contributionPercentage,
) => {
  if (!subscriptionAmount || !contributionPercentage) return 0;
  return parseFloat(
    (subscriptionAmount * (contributionPercentage / 100)).toFixed(2),
  );
};
