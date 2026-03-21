import supabase from "../lib/supabase.js";
import {
  SCORE_MIN,
  SCORE_MAX,
  DRAW_NUMBERS_COUNT,
} from "../config/constants.js";

// ── generate 5 unique random numbers (1-45) ──
export const generateRandomDraw = () => {
  const numbers = new Set();
  while (numbers.size < DRAW_NUMBERS_COUNT) {
    numbers.add(
      Math.floor(Math.random() * (SCORE_MAX - SCORE_MIN + 1)) + SCORE_MIN,
    );
  }
  return [...numbers].sort((a, b) => a - b);
};

// ── algorithmic draw — weighted by most AND least frequent user scores ──
// weighted by most/least frequent user scores
export const generateAlgorithmicDraw = async () => {
  try {
    const { data: scores, error } = await supabase
      .from("scores")
      .select("score");

    // fallback to random if no scores exist
    if (error || !scores || scores.length === 0) {
      return generateRandomDraw();
    }

    // build frequency map
    const freqMap = {};
    scores.forEach(({ score }) => {
      freqMap[score] = (freqMap[score] || 0) + 1;
    });

    const sorted = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .map(([score]) => parseInt(score));

    const result = new Set();

    // pick top 3 most frequent
    for (let i = 0; i < sorted.length && result.size < 3; i++) {
      result.add(sorted[i]);
    }

    // pick bottom 2 least frequent
    for (let i = sorted.length - 1; i >= 0 && result.size < 5; i--) {
      result.add(sorted[i]);
    }

    // fill remaining with random if not enough unique scores
    while (result.size < DRAW_NUMBERS_COUNT) {
      result.add(
        Math.floor(Math.random() * (SCORE_MAX - SCORE_MIN + 1)) + SCORE_MIN,
      );
    }

    return [...result].sort((a, b) => a - b);
  } catch (err) {
    // safe fallback
    return generateRandomDraw();
  }
};

// ── count how many user scores match draw numbers ──
export const countMatches = (userScores, drawNumbers) => {
  if (!userScores || !drawNumbers || userScores.length === 0) return 0;
  return userScores.filter((score) => drawNumbers.includes(score)).length;
};
