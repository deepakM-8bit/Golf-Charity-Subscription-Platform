import "dotenv/config";
import express from "express";
import cors from "cors";

import scoresRouter from "./routes/scores.js";
import subscriptionsRouter from "./routes/subscriptions.js";
import charitiesRouter from "./routes/charities.js";
import drawsRouter from "./routes/draws.js";
import winnersRouter from "./routes/winners.js";
import donationsRouter from "./routes/donations.js";

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
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/charities", charitiesRouter);
app.use("/api/draws", drawsRouter);
app.use("/api/winners", winnersRouter);
app.use("/api/donations", donationsRouter);

// ── global error handler ──
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
