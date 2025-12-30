// controllers/lessonController.js
const mongoose = require("mongoose");
const Lesson = require("../models/Lesson");
const LessonProgress = require("../models/LessonProgress");
const { gradeAnswer } = require("../utils/aiGrader");
const { awardBadges } = require("../utils/badgeUtils");
const { updateStreak } = require("../utils/streakUtils");

// ---- Public: Get all lessons (ordered list) ----
exports.getAllLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find().sort({ order: 1 });
    res.json(lessons);
  } catch (err) {
    console.error("❌ Error fetching lessons:", err);
    res.status(500).json({ error: "Failed to fetch lessons" });
  }
};

// ---- Authenticated: Get lesson by order (with gating) ----
exports.getLessonByOrder = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const orderNum = Number(req.params.order);
    if (isNaN(orderNum)) return res.status(400).json({ error: "Order must be a number" });

    const lesson = await Lesson.findOne({ order: orderNum });
    if (!lesson) return res.status(404).json({ error: `Lesson ${orderNum} not found` });

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const progress = await LessonProgress.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    const currentLesson = progress?.currentLesson || 1;

    if (lesson.order > currentLesson) {
      return res.status(403).json({
        error: `Lesson ${lesson.order} is locked until you complete Lesson ${currentLesson}`,
      });
    }

    res.json(lesson);
  } catch (err) {
    console.error("❌ Error fetching lesson by order:", err);
    res.status(500).json({ error: "Failed to fetch lesson" });
  }
};

// ---- Authenticated: Get gated lesson list ----
exports.getLessonList = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const progress = await LessonProgress.findOne({ userId });
    const currentLesson = progress?.currentLesson || 1;

    const lessons = await Lesson.find({}, "_id title order").sort({ order: 1 });
    const gatedLessons = lessons.map((l) => ({
      _id: l._id,
      title: l.title,
      order: l.order,
      locked: l.order > currentLesson,
    }));

    res.json(gatedLessons);
  } catch (err) {
    console.error("❌ Error fetching lesson list:", err);
    res.status(500).json({ error: "Failed to fetch lesson list" });
  }
};

// ---- Authenticated: Get single lesson by ID ----
exports.getLessonById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });

    const lesson = await Lesson.findById(id);
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    res.json(lesson);
  } catch (err) {
    console.error("❌ Error fetching lesson:", err);
    res.status(500).json({ error: "Failed to fetch lesson" });
  }
};

// ---- Admin: Create lesson ----
exports.createLesson = async (req, res) => {
  try {
    const lesson = new Lesson(req.body);
    await lesson.save();
    res.status(201).json(lesson);
  } catch (err) {
    console.error("❌ Error creating lesson:", err);
    res.status(500).json({ error: "Failed to create lesson" });
  }
};

// ---- Admin: Update lesson ----
exports.updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });

    const updatedLesson = await Lesson.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedLesson) return res.status(404).json({ error: "Lesson not found" });

    res.json(updatedLesson);
  } catch (err) {
    console.error("❌ Error updating lesson:", err);
    res.status(500).json({ error: "Failed to update lesson" });
  }
};

// ---- Admin: Delete lesson ----
exports.deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });

    const lesson = await Lesson.findByIdAndDelete(id);
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    res.json({ message: "Lesson deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting lesson:", err);
    res.status(500).json({ error: "Failed to delete lesson" });
  }
};

// ---- Quiz grading (AI-powered, standalone utility) ----
exports.gradeQuizAnswer = async (req, res) => {
  try {
    const { question, userAnswer, correctAnswer, acceptedKeywords, explanation, hint } = req.body;
    if (!userAnswer || !question) {
      return res.status(400).json({ correct: false, feedback: "Missing answer or question." });
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
    res.status(500).json({ correct: false, feedback: "Server error during grading." });
  }
};

// ---- Authenticated: Mark a lesson complete and advance gating ----
exports.completeLesson = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    const { lessonOrder, quizScore } = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const orderNum = Number(lessonOrder);
    if (isNaN(orderNum)) return res.status(400).json({ error: "lessonOrder must be a number" });

    let progress = await LessonProgress.findOne({ userId });
    if (!progress) {
      progress = new LessonProgress({ userId });
    }

    // Track unlocked lessons BEFORE awarding badges
    const unlockedBefore = new Set(progress.unlockedLessons);

    // Add completion (deduped)
    if (!progress.completedLessons.includes(orderNum)) {
      progress.completedLessons.push(orderNum);
    }

    // Update streak
    progress.streakCount = updateStreak(progress.lastCompletedAt, progress.streakCount);
    progress.lastCompletedAt = new Date();
    progress.lastActivityDate = new Date();

    // Advance gating
    const nextLesson = orderNum + 1;
    if (progress.currentLesson <= orderNum) {
      progress.currentLesson = nextLesson;
    }
    if (!progress.unlockedLessons.includes(nextLesson)) {
      progress.unlockedLessons.push(nextLesson);
    }

    // Award badges (this may unlock reward recipes)
    const newBadges = awardBadges(progress, quizScore);

    // Track unlocked lessons AFTER awarding badges
    const unlockedAfter = new Set(progress.unlockedLessons);

    // Compute newly unlocked recipe lessons
    const newlyUnlockedRecipes = [...unlockedAfter].filter(
      (lessonId) => !unlockedBefore.has(lessonId)
    );

    await progress.save();

    res.json({
      message: "Lesson completed",
      currentLesson: progress.currentLesson,
      completedLessons: progress.completedLessons,
      streakCount: progress.streakCount,
      badges: progress.badges,
      newlyAwarded: newBadges,
      newlyUnlockedRecipes,        // ⭐ NEW: reward recipe unlocks
      unlockedLessons: progress.unlockedLessons,
      completionPercentage: progress.completionPercentage
    });
  } catch (err) {
    console.error("❌ Error completing lesson:", err);
    res.status(500).json({ error: "Failed to complete lesson" });
  }
};