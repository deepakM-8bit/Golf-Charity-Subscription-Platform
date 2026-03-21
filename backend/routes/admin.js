import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  getAnalytics,
  getUsers,
  getUser,
  updateUser,
  editUserScore,
  updateSubscription,
} from "../controllers/admin.controller.js";

const router = Router();

// ── all admin routes require auth + admin role ──
router.use(requireAuth, requireAdmin);

// ── analytics ──
router.get("/analytics", getAnalytics);

// ── user management ──
router.get("/users", getUsers);
router.get("/users/:id", getUser);
router.put("/users/:id", updateUser);
router.put("/users/:id/scores", editUserScore);

// ── subscription management ──
router.put("/subscriptions/:id", updateSubscription);

export default router;
