import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import Quiz from "../models/Quiz.js";
import LessonProgress from "../models/LessonProgress.js";
import { awardBadges } from "../utils/badgeUtils.js";
import { updateStreak } from "../utils/streakUtils.js";

const router = express.Router();

// ---- Public: Get all quizzes ----
router.get("/", async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    console.error("❌ Error fetching quizzes:", err.message);
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
});

// ---- Public: Get quiz by ID ----
router.get("/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    res.json(quiz);
  } catch (err) {
    console.error("❌ Error fetching quiz:", err.message);
    res.status(500).json({ error: "Failed to fetch quiz" });
  }
});

// ---- Admin: Create a new quiz ----
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();
    res.status(201).json({ message: "Quiz created successfully", quiz });
  } catch (err) {
    console.error("❌ Error creating quiz:", err.message);
    res.status(500).json({ error: "Failed to create quiz" });
  }
});

// ---- Admin: Update a quiz ----
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const updated = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Quiz not found" });
    res.json({ message: "Quiz updated successfully", quiz: updated });
  } catch (err) {
    console.error("❌ Error updating quiz:", err.message);
    res.status(500).json({ error: "Failed to update quiz" });
  }
});

// ---- Admin: Delete a quiz ----
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const deleted = await Quiz.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Quiz not found" });
    res.json({ message: "Quiz deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting quiz:", err.message);
    res.status(500).json({ error: "Failed to delete quiz" });
  }
});

// ---- Authenticated: Submit quiz answer (updates progress + badges) ----
router.post("/:id/submit", protect, async (req, res) => {
  try {
    const { answer } = req.body;
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Normalize answers
    const submitted = String(answer || "").trim().toLowerCase();
    const correct = String(quiz.correctAnswer || "").trim().toLowerCase();
    const isCorrect = submitted === correct;

    let payload = {
      correct: isCorrect,
      message: isCorrect ? "Correct answer!" : "Incorrect answer.",
    };

    if (isCorrect && req.user && req.user.userId) {
      const userId = req.user.userId;
      let progress = await LessonProgress.findOne({ userId });
      if (!progress) progress = new LessonProgress({ userId });

      // Mark lesson complete (deduped)
      const lessonOrder = Number(quiz.lessonOrder ?? quiz.lessonId ?? NaN);
      if (!isNaN(lessonOrder) && !progress.completedLessons.includes(lessonOrder)) {
        progress.completedLessons.push(lessonOrder);
      }

      // Update streak
      progress.streakCount = updateStreak(progress.lastCompletedAt, progress.streakCount);
      progress.lastCompletedAt = new Date();
      progress.lastActivityDate = new Date();

      // Unlock next lesson
      if (!isNaN(lessonOrder)) {
        const nextLesson = lessonOrder + 1;
        if (progress.currentLesson <= lessonOrder) {
          progress.currentLesson = nextLesson;
        }
        if (!progress.unlockedLessons.includes(nextLesson)) {
          progress.unlockedLessons.push(nextLesson);
        }
      }

      // Award badges (quiz performance badges use score = 100 for exact correctness)
      const newBadges = awardBadges(progress, 100);

      await progress.save();

      payload = {
        ...payload,
        currentLesson: progress.currentLesson,
        streakCount: progress.streakCount,
        badges: progress.badges,
        newlyAwarded: newBadges,
        unlockedLessons: progress.unlockedLessons,
        completionPercentage: progress.completionPercentage,
      };
    }

    res.json(payload);
  } catch (err) {
    console.error("❌ Quiz submission failed:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;