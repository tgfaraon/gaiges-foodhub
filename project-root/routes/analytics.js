import express from "express";
import * as analyticsController from "../controllers/analyticsController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin-only: view all analytics
router.get("/", protect, adminOnly, analyticsController.getAllAnalytics);

// Admin-only: view analytics for a specific user
router.get("/:userId", protect, adminOnly, analyticsController.getUserAnalytics);

// Admin-only: update or insert analytics
router.put("/", protect, adminOnly, analyticsController.upsertAnalytics);

export default router;