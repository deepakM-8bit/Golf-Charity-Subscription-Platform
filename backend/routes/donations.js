import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createDonationOrder,
  captureDonation,
  getMyDonations,
  getAllDonations,
} from "../controllers/donations.controller.js";

const router = Router();

// ── user routes — auth required ──
router.post("/create-order", requireAuth, createDonationOrder);
router.post("/capture", requireAuth, captureDonation);
router.get("/my", requireAuth, getMyDonations);

// ── admin routes ──
router.get("/", requireAuth, getAllDonations);

export default router;
