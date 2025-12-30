// routes/memberLessons.js
import express from "express";
import multer from "multer";

import authMiddleware, { protect } from "../middleware/authMiddleware.js";

import Lesson from "../models/Lesson.js";
import User from "../models/Users.js";
import LessonProgress from "../models/LessonProgress.js";

import { gradeQuiz } from "../utils/grader.js";
import { updateStreak } from "../utils/streakUtils.js";
import { awardBadges } from "../utils/badgeUtils.js";

const router = express.Router();

/* -------------------------------------------------------
   ✅ Multer setup for QUIZ file uploads only
------------------------------------------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

/* -------------------------------------------------------
   ✅ Save a lesson to user's savedLessons
------------------------------------------------------- */
router.post("/save/:lessonId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId; // ✅ correct JWT field
    const lessonId = req.params.lessonId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.savedLessons.includes(lessonId)) {
      user.savedLessons.push(lessonId);
      await user.save();
    }

    res.json({ message: "Lesson saved successfully" });
  } catch (err) {
    console.error("❌ Save lesson error:", err);
    res.status(500).json({ message: "Server error saving lesson" });
  }
});

/* -------------------------------------------------------
   ✅ Complete a lesson (NO QUIZ REQUIRED)
------------------------------------------------------- */
router.post("/:lessonId/complete", protect, async (req, res) => {
  try {
    const { lessonId } = req.params;

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const lessonNum = lesson.order;

    if (!user.completedLessons.includes(lessonNum)) {
      user.completedLessons.push(lessonNum);
      await user.save();
    }

    res.json({ message: "Lesson completed" });
  } catch (err) {
    console.error("❌ Error completing lesson:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------------------------------
   ✅ Lesson submission (QUIZ ONLY)
------------------------------------------------------- */
router.post(
  "/:lessonId/submit",
  protect,
  upload.single("workFile"),
  async (req, res) => {
    try {
      const { lessonId } = req.params;
      const userId = req.user.userId;

      /* ✅ Parse quiz answers */
      let answers = [];
      if (req.body?.answers) {
        try {
          answers = JSON.parse(req.body.answers);
        } catch (e) {
          console.error("❌ Failed to parse answers:", e);
        }
      }

      /* ✅ Load lesson */
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) return res.status(404).json({ message: "Lesson not found" });

      const lessonNum = lesson.order;

      /* ✅ Grade quiz */
      const gradingResults = await gradeQuiz(lesson.quiz || [], answers);
      const totalQuestions = gradingResults.length;
      const correctCount = gradingResults.filter((r) => r.correct).length;

      const requiredCorrect = Math.ceil(totalQuestions * 0.8);
      const passed = correctCount >= requiredCorrect;
      const allCorrect = correctCount === totalQuestions;

      /* ✅ Load or create progress */
      let progress = await LessonProgress.findOne({ userId });
      if (!progress) progress = new LessonProgress({ userId });

      /* ✅ Mark lesson complete + unlock next lesson */
      if (passed && !progress.completedLessons.includes(lessonNum)) {
        progress.completedLessons.push(lessonNum);

        const nextLesson = lessonNum + 1;

        if (nextLesson < 101 && !progress.unlockedLessons.includes(nextLesson)) {
          progress.unlockedLessons.push(nextLesson);
        }

        progress.currentLesson = nextLesson;
      }

      /* ✅ Update streak */
      progress.streakCount = updateStreak(
        progress.lastCompletedAt,
        progress.streakCount
      );
      progress.lastCompletedAt = new Date();
      progress.lastActivityDate = new Date();

      /* ✅ Award badges */
      const quizScore = Math.round((correctCount / totalQuestions) * 100);
      const newBadges = awardBadges(progress, quizScore);

      await progress.save();

      res.json({
        gradingResults,
        progress,
        nextLessonOrder: passed ? lessonNum + 1 : null,
        passed,
        allCorrect,
        uploadedFile: req.file ? req.file.filename : null,
        newlyAwarded: newBadges,
      });
    } catch (err) {
      console.error("❌ Lesson submission error:", err);
      res.status(500).json({ message: "Failed to submit lesson" });
    }
  }
);

export default router;