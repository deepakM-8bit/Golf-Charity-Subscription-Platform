import { Router } from "express";
import multer from "multer";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import {
  getCharities,
  getCharity,
  createCharity,
  updateCharity,
  deleteCharity,
  getUserCharity,
  setUserCharity,
} from "../controllers/charities.controller.js";

const router = Router();

// ── multer config — memory storage, no disk writes ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG and WebP images are allowed"));
    }
  },
});

// ── public routes ──
router.get("/", getCharities);
router.get("/:id", getCharity);

// ── user routes — auth required ──
router.get("/user/selection", requireAuth, getUserCharity);
router.post("/user/selection", requireAuth, setUserCharity);

// ── admin routes ──
router.post(
  "/",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  createCharity,
);
router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  updateCharity,
);
router.delete("/:id", requireAuth, requireAdmin, deleteCharity);

export default router;
