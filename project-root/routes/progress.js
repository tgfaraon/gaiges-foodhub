import express from "express";
import LessonProgress from "../models/LessonProgress.js";
import { protect } from "../middleware/authMiddleware.js";
import { updateStreak } from "../utils/streakUtils.js";
import { awardBadges } from "../utils/badgeUtils.js";

const router = express.Router();

/**
 * ---- Get current user's progress ----
 */
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    let progress = await LessonProgress.findOne({ userId });

    if (!progress) {
      // Initialize default progress if none exists
      progress = new LessonProgress({
        userId,
        completedLessons: [],
        unlockedLessons: [1], // Lesson One always unlocked
        streakCount: 0,
        lastCompletedAt: null,
        badges: ["Joined Gaige's Food Hub"], // baseline badge
        unlockedRecipes: [], // ensure field exists
      });
      await progress.save();
    }

    res.json(progress);
  } catch (err) {
    console.error("❌ Error fetching progress:", err.message);
    res.status(500).json({ message: "Failed to fetch progress" });
  }
});

/**
 * ---- Update progress after quiz submission ----
 */
router.post("/update", protect, async (req, res) => {
  try {
    const { lessonId, passed, quizScore } = req.body;
    const userId = req.user.userId;

    let progress = await LessonProgress.findOne({ userId });
    if (!progress) {
      progress = new LessonProgress({
        userId,
        completedLessons: [],
        unlockedLessons: [1],
        streakCount: 0,
        lastCompletedAt: null,
        badges: ["Joined Gaige's Food Hub"],
        unlockedRecipes: [],
      });
    }

    // ---- Handle streaks ----
    progress.streakCount = updateStreak(progress.lastCompletedAt, progress.streakCount);
    progress.lastCompletedAt = new Date();

    // ---- Mark lesson as completed if passed ----
    if (passed && !progress.completedLessons.includes(Number(lessonId))) {
      progress.completedLessons.push(Number(lessonId));

      // Unlock next lesson (numeric progression)
      const nextLesson = Number(lessonId) + 1;
      if (!progress.unlockedLessons.includes(nextLesson)) {
        progress.unlockedLessons.push(nextLesson);
      }
    }

    // ⭐⭐⭐ NEW: Unlock Culinary Artisan badge + reward recipe for Lesson 13 ⭐⭐⭐
    if (Number(lessonId) === 13 && passed) {
      // Ensure arrays exist
      if (!progress.badges) progress.badges = [];
      if (!progress.unlockedRecipes) progress.unlockedRecipes = [];

      // Badge unlock
      if (!progress.badges.includes("Culinary Artisan")) {
        progress.badges.push("Culinary Artisan");
      }

      // Reward recipe unlock
      if (!progress.unlockedRecipes.includes("Recipe 201")) {
        progress.unlockedRecipes.push("Recipe 201");
      }
    }

    // ---- Award badges (includes quiz performance) ----
    const newBadges = awardBadges(progress, quizScore);

    await progress.save();

    res.json({
      ...progress.toObject(),
      newlyAwarded: newBadges,
      completionPercentage: progress.completionPercentage,
    });
  } catch (err) {
    console.error("❌ Error updating progress:", err.message);
    res.status(500).json({ message: "Failed to update progress" });
  }
});

export default router;