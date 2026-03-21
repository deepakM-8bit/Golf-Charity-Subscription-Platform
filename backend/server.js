import "dotenv/config";
import express from "express";
import cors from "cors";

import scoresRouter from "./routes/scores.js";

const app = express();

// ── middleware ──
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

// ── health check ──
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// ── routes ──
app.use("/api/scores", scoresRouter);

// ── global error handler ──
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
