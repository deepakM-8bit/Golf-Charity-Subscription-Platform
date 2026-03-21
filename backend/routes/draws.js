import { Router } from "express";
import {
  requireAuth,
  requireSubscription,
  requireAdmin,
} from "../middleware/auth.js";
import {
  getPublishedDraws,
  getAllDraws,
  getDraw,
  createDraw,
  simulateDraw,
  publishDraw,
  getUserEntries,
  getUpcomingDraw,
} from "../controllers/draws.controller.js";

const router = Router();

// ── public routes ──
router.get("/", getPublishedDraws);
router.get("/upcoming", getUpcomingDraw);
router.get("/:id", getDraw);

// ── user routes — auth + subscription required ──
router.get("/user/entries", requireAuth, requireSubscription, getUserEntries);

// ── admin routes ──
router.get("/admin/all", requireAuth, requireAdmin, getAllDraws);
router.post("/", requireAuth, requireAdmin, createDraw);
router.post("/:id/simulate", requireAuth, requireAdmin, simulateDraw);
router.post("/:id/publish", requireAuth, requireAdmin, publishDraw);

export default router;
