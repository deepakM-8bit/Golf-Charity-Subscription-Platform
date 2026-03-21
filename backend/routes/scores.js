import { Router } from "express";
import { requireAuth, requireSubscription } from "../middleware/auth.js";
import {
  getScores,
  addScore,
  editScore,
  deleteScore,
} from "../controllers/scores.controller.js";

const router = Router();

// all score routes require auth + active subscription
// subscription validated on every authenticated request
router.get("/", requireAuth, requireSubscription, getScores);
router.post("/", requireAuth, requireSubscription, addScore);
router.put("/:id", requireAuth, requireSubscription, editScore);
router.delete("/:id", requireAuth, requireSubscription, deleteScore);

export default router;
