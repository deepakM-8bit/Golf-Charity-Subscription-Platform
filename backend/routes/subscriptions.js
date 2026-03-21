import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createOrder,
  captureOrder,
  getStatus,
  cancelSubscription,
} from "../controllers/subscriptions.controller.js";

const router = Router();

// ── public: create PayPal order (auth only, no subscription needed) ──
router.post("/create-order", requireAuth, createOrder);

// ── capture payment after PayPal approval ──
router.post("/capture-order", requireAuth, captureOrder);

// ── get current subscription status ──
router.get("/status", requireAuth, getStatus);

// ── cancel subscription ──
router.post("/cancel", requireAuth, cancelSubscription);

export default router;
