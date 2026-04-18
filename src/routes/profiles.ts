import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import {
  createProfile,
  getProfileById,
  getAllProfiles,
  deleteProfile,
} from "../services/profileService.js";
import axios from "axios";

const router = Router();

// ─── POST /api/profiles ───────────────────────────────
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;

    // Validation 1 — name is missing or empty
    if (name === undefined || name === null) {
      res.status(400).json({
        status: "error",
        message: "name is required",
      });
      return;
    }

    // Validation 2 — name must be a string
    if (typeof name !== "string") {
      res.status(422).json({
        status: "error",
        message: "name must be a string",
      });
      return;
    }

    // Validation 3 — name must not be empty after trimming
    if (name.trim() === "") {
      res.status(400).json({
        status: "error",
        message: "name is required",
      });
      return;
    }

    const { profile, alreadyExists } = await createProfile(name.trim());

    // Profile already existed — return 200 with message
    if (alreadyExists) {
      res.status(200).json({
        status: "success",
        message: "Profile already exists",
        data: profile,
      });
      return;
    }

    // Newly created — return 201
    res.status(201).json({
      status: "success",
      data: profile,
    });
  } catch (err: any) {
    // Edge case from external APIs (null gender, null age, no country)
    if (err.isApiError) {
      res.status(502).json({
        status: "error",
        message: err.message,
      });
      return;
    }

    // External API unreachable
    if (axios.isAxiosError(err)) {
      res.status(502).json({
        status: "error",
        message: "Failed to reach an external API. Please try again.",
      });
      return;
    }

    next(err);
  }
});

// ─── GET /api/profiles ────────────────────────────────
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract optional filter query params
    const { gender, country_id, age_group } = req.query;

    const profiles = await getAllProfiles({
      gender: typeof gender === "string" ? gender : undefined,
      country_id: typeof country_id === "string" ? country_id : undefined,
      age_group: typeof age_group === "string" ? age_group : undefined,
    });

    res.status(200).json({
      status: "success",
      count: profiles.length,
      data: profiles,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/profiles/:id ────────────────────────────
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const profile = await getProfileById(id);

    if (!profile) {
      res.status(404).json({
        status: "error",
        message: "Profile not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: profile,
    });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/profiles/:id ─────────────────────────
router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const result = await deleteProfile(id);

      if (!result) {
        res.status(404).json({
          status: "error",
          message: "Profile not found",
        });
        return;
      }

      // 204 No Content — no body, just the status code
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export default router;
