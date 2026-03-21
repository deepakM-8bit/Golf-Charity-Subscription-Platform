import { Router } from "express";
import multer from "multer";
import {
  requireAuth,
  requireSubscription,
  requireAdmin,
} from "../middleware/auth.js";
import {
  getMyWinnings,
  uploadProof,
  getAllWinners,
  getProofUrl,
  verifyWinner,
  markPaid,
} from "../controllers/winners.controller.js";

const router = Router();

// ── multer config for proof uploads — 10MB max ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP and PDF files are allowed"));
    }
  },
});

// ── user routes ──
router.get("/my", requireAuth, requireSubscription, getMyWinnings);
router.post(
  "/:id/proof",
  requireAuth,
  requireSubscription,
  upload.single("proof"),
  uploadProof,
);

// ── admin routes ──
router.get("/", requireAuth, requireAdmin, getAllWinners);
router.get("/:id/proof-url", requireAuth, requireAdmin, getProofUrl);
router.put("/:id/verify", requireAuth, requireAdmin, verifyWinner);
router.put("/:id/payout", requireAuth, requireAdmin, markPaid);

export default router;
