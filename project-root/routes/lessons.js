// routes/lesson.js

import express from "express";
import mongoose from "mongoose";
import Lesson from "../models/Lesson.js";
import LessonProgress from "../models/LessonProgress.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { callAIGrader as gradeAnswer } from "../utils/aiGrader.js";
import { awardBadges } from "../utils/badgeUtils.js";
import { updateStreak } from "../utils/streakUtils.js";

const router = express.Router();

/* ---------------------------------------------
   PUBLIC: GET ALL LESSONS (ORDERED)
--------------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const lessons = await Lesson.find().sort({ order: 1 });
    res.json(lessons);
  } catch (err) {
    console.error("❌ Error fetching lessons:", err);
    res.status(500).json({ error: "Failed to fetch lessons" });
  }
});

/* ---------------------------------------------
   AUTH: GET LESSON BY ORDER (WITH GATING)
--------------------------------------------- */
router.get("/order/:order", protect, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const orderNum = Number(req.params.order);
    if (isNaN(orderNum)) {
      return res.status(400).json({ error: "Order must be a number" });
    }

    const lesson = await Lesson.findOne({ order: orderNum });
    if (!lesson) {
      return res.status(404).json({ error: `Lesson ${orderNum} not found` });
    }

    let progress = await LessonProgress.findOne({ userId });

    // First-time user: initialize progress
    if (!progress) {
      progress = new LessonProgress({
        userId,
        unlockedLessons: [1],
        currentLesson: 1,
        trainingComplete: false,
      });
      await progress.save();

      if (orderNum === 1) return res.json(lesson);
      return res
        .status(403)
        .json({ error: `Lesson ${orderNum} is locked until you unlock it.` });
    }

    const unlocked = new Set(progress.unlockedLessons || []);
    const currentLesson = progress.currentLesson || 1;

    const isAccessible =
      orderNum === 1 || unlocked.has(orderNum) || orderNum === currentLesson;

    if (!isAccessible) {
      return res.status(403).json({
        error: `Lesson ${orderNum} is locked. Current lesson is ${currentLesson}.`,
      });
    }

    res.json(lesson);
  } catch (err) {
    console.error("❌ Error fetching lesson by order:", err);
    res.status(500).json({ error: "Failed to fetch lesson" });
  }
});

/* ---------------------------------------------
   AUTH: GET GATED LESSON LIST
--------------------------------------------- */
router.get("/list", protect, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const progress = await LessonProgress.findOne({ userId });
    const currentLesson = progress?.currentLesson || 1;
    const unlocked = new Set(progress?.unlockedLessons || [1]);

    const lessons = await Lesson.find({}, "_id title order").sort({ order: 1 });

    const gatedLessons = lessons.map((l) => ({
      _id: l._id,
      title: l.title,
      order: l.order,
      locked: !(unlocked.has(l.order) || l.order === currentLesson || l.order === 1),
    }));

    res.json(gatedLessons);
  } catch (err) {
    console.error("❌ Error fetching lesson list:", err);
    res.status(500).json({ error: "Failed to fetch lesson list" });
  }
});

/* ---------------------------------------------
   ADMIN: CREATE LESSON
--------------------------------------------- */
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { title, order } = req.body;
    if (!title || !order) {
      return res.status(400).json({ error: "Title and order are required" });
    }

    const existing = await Lesson.findOne({ order });
    if (existing) {
      return res
        .status(400)
        .json({ error: `Lesson with order ${order} already exists` });
    }

    const lesson = new Lesson(req.body);
    await lesson.save();

    res.status(201).json({ message: "Lesson created successfully", lesson });
  } catch (err) {
    console.error("❌ Error creating lesson:", err);
    res.status(500).json({ error: "Failed to create lesson" });
  }
});

/* ---------------------------------------------
   ADMIN: UPDATE LESSON (QUIZ-PROOF)
--------------------------------------------- */
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    // Strip quiz out of the update payload so it cannot be overwritten here
    const { quiz, ...safeFields } = req.body;

    const updated = await Lesson.findByIdAndUpdate(
      req.params.id,
      safeFields,
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: "Lesson not found" });

    res.json({ message: "Lesson updated successfully", lesson: updated });
  } catch (err) {
    console.error("❌ Error updating lesson:", err);
    res.status(500).json({ error: "Failed to update lesson" });
  }
});

/* ---------------------------------------------
   ADMIN: DELETE LESSON
--------------------------------------------- */
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const deleted = await Lesson.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Lesson not found" });

    res.json({ message: "Lesson deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting lesson:", err);
    res.status(500).json({ error: "Failed to delete lesson" });
  }
});

/* ---------------------------------------------
   ADMIN: SAVE QUIZ (SAFE & ISOLATED)
--------------------------------------------- */
router.put("/:id/quiz", protect, adminOnly, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    // Only update quiz — nothing else
    lesson.quiz = req.body.quiz || [];
    await lesson.save();

    res.json({ message: "Quiz saved successfully", lesson });
  } catch (err) {
    console.error("❌ Error saving quiz:", err);
    res.status(500).json({ error: "Failed to save quiz" });
  }
});

/* ---------------------------------------------
   ADMIN: GET LESSON BY ID OR ORDER
--------------------------------------------- */
router.get("/:idOrOrder", protect, adminOnly, async (req, res) => {
  try {
    const { idOrOrder } = req.params;
    let lesson;

    if (mongoose.Types.ObjectId.isValid(idOrOrder)) {
      lesson = await Lesson.findById(idOrOrder);
    } else if (!isNaN(Number(idOrOrder))) {
      lesson = await Lesson.findOne({ order: Number(idOrOrder) });
    }

    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    res.json(lesson);
  } catch (err) {
    console.error("❌ Error fetching lesson:", err);
    res.status(500).json({ error: "Failed to fetch lesson" });
  }
});

/* ---------------------------------------------
   AUTH: MARK LESSON COMPLETE (WITH TRAINING COMPLETE)
--------------------------------------------- */
router.post("/complete", protect, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { lessonOrder, quizScore } = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const orderNum = Number(lessonOrder);
    if (isNaN(orderNum)) {
      return res.status(400).json({ error: "lessonOrder must be a number" });
    }

    let progress = await LessonProgress.findOne({ userId });
    if (!progress) {
      progress = new LessonProgress({
        userId,
        unlockedLessons: [1],
        currentLesson: 1,
        trainingComplete: false,
      });
    }

    // Mark completion (idempotent)
    if (!progress.completedLessons.includes(orderNum)) {
      progress.completedLessons.push(orderNum);
    }

    // Update streak
    progress.streakCount = updateStreak(
      progress.lastCompletedAt,
      progress.streakCount
    );
    const now = new Date();
    progress.lastCompletedAt = now;
    progress.lastActivityDate = now;

    // Determine if this is the last available lesson *right now*
    const totalLessons = await Lesson.countDocuments();
    const isFinalLesson = orderNum >= totalLessons;

    // Unlock next lesson only if it exists
    const nextLesson = orderNum + 1;
    if (!isFinalLesson) {
      if (progress.currentLesson <= orderNum) {
        progress.currentLesson = nextLesson;
      }
      if (!progress.unlockedLessons.includes(nextLesson)) {
        progress.unlockedLessons.push(nextLesson);
      }
    }

    // If this is the current end of the curriculum, mark training complete
    if (isFinalLesson) {
      progress.trainingComplete = true;
    } else if (progress.trainingComplete) {
      // Future-proof: if more lessons are added later, keep trainingComplete consistent
      progress.trainingComplete = false;
    }

    // Award badges (including Apprentice Badge + any recipe unlocks)
    const newBadges = awardBadges(progress, quizScore);

    await progress.save();

    res.json({
      message: isFinalLesson ? "Training complete" : "Lesson completed",
      trainingComplete: progress.trainingComplete,
      currentLesson: progress.currentLesson,
      completedLessons: progress.completedLessons,
      streakCount: progress.streakCount,
      badges: progress.badges,
      newlyAwarded: newBadges,
      unlockedLessons: progress.unlockedLessons,
      completionPercentage: progress.completionPercentage,
    });
  } catch (err) {
    console.error("❌ Error completing lesson:", err);
    res.status(500).json({ error: "Failed to complete lesson" });
  }
});

/* ---------------------------------------------
   AI QUIZ GRADING
--------------------------------------------- */
router.post("/grade", protect, async (req, res) => {
  try {
    const {
      question,
      userAnswer,
      correctAnswer,
      acceptedKeywords,
      explanation,
      hint,
    } = req.body;

    if (!userAnswer || !question) {
      return res
        .status(400)
        .json({ correct: false, feedback: "Missing answer or question." });
    }

    const result = await gradeAnswer({
      question,
      userAnswer,
      correctAnswer,
      acceptedKeywords,
      explanation,
      hint,
    });

    res.json(result);
  } catch (err) {
    console.error("❌ Error grading quiz:", err);
    res
      .status(500)
      .json({ correct: false, feedback: "Server error during grading." });
  }
});

export default router;