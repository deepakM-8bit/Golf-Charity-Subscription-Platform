// ── PRD Section 05: Score rules ──
export const SCORE_MIN = 1;
export const SCORE_MAX = 45;
export const MAX_SCORES_PER_USER = 5;

// ── PRD Section 07: Prize pool distribution ──
export const PRIZE_POOL_PERCENTAGES = {
  5: 0.4, // 5-match → 40% (jackpot, rolls over)
  4: 0.35, // 4-match → 35%
  3: 0.25, // 3-match → 25%
};

// ── PRD Section 07: Jackpot rollover ──
export const JACKPOT_MATCH = 5;

// ── PRD Section 08: Charity contribution ──
export const MIN_CHARITY_CONTRIBUTION = 10;
export const MAX_CHARITY_CONTRIBUTION = 100;

// ── PRD Section 06: Draw match types ──
export const DRAW_NUMBERS_COUNT = 5;
export const MATCH_TYPES = [3, 4, 5];

// ── PRD Section 04: Subscription plans ──
export const PLANS = {
  monthly: { label: "Monthly", amount: 89.0, currency: "USD" },
  yearly: { label: "Yearly", amount: 859.0, currency: "USD" },
};

// ── Prize pool contribution per subscriber ──
export const PRIZE_POOL_CONTRIBUTION_MONTHLY = 5.0;
export const PRIZE_POOL_CONTRIBUTION_YEARLY = 50.0;

// ── User roles ──
export const ROLES = {
  admin: "admin",
  subscriber: "subscriber",
};

// ── Subscription statuses ──
export const SUBSCRIPTION_STATUS = {
  active: "active",
  cancelled: "cancelled",
  lapsed: "lapsed",
  inactive: "inactive",
};

// ── Draw statuses ──
export const DRAW_STATUS = {
  pending: "pending",
  simulated: "simulated",
  published: "published",
};

// ── Draw types ──
export const DRAW_TYPE = {
  random: "random",
  algorithmic: "algorithmic",
};

// ── Winner verification statuses ──
export const VERIFICATION_STATUS = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
};

// ── Payout statuses ──
export const PAYOUT_STATUS = {
  pending: "pending",
  paid: "paid",
};
