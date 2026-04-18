// src/app.ts
import express from "express";
import cors from "cors";
import profilesRouter from "./routes/profiles.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Stage 1 API is running" });
});

app.use("/api/profiles", profilesRouter);

app.use(errorHandler);

export default app;
