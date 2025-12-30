const Quiz = require("../models/Quiz");
const LessonProgress = require("../models/LessonProgress");
const { awardBadges } = require("../utils/badgeUtils");
const { updateStreak } = require("../utils/streakUtils");

// ✅ bring in the AI grader
const { callAIGrader } = require("../utils/aiGrader");

// SUBMIT quiz answer
exports.submitQuiz = async (req, res) => {
  try {
    const { answer } = req.body;
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // 🔑 Call AI grader instead of strict string match
    const gradingResult = await callAIGrader(
      {
        question: quiz.question,
        correctAnswer: quiz.correctAnswer,
        acceptedKeywords: quiz.acceptedKeywords || [],
        explanation: quiz.explanation,
        hint: quiz.hint,
      },
      answer
    );

    let payload = {
      correct: gradingResult.correct,
      message: gradingResult.correct
        ? gradingResult.feedback || "Correct answer!"
        : gradingResult.feedback || "Incorrect answer.",
      explanation: gradingResult.explanation,
      hint: gradingResult.hint,
    };

    // Progress tracking only if correct
    const lessonOrder = Number(quiz.lessonOrder ?? quiz.lessonId ?? NaN);
    if (gradingResult.correct && req.user && req.user.userId && !isNaN(lessonOrder)) {
      const userId = req.user.userId;
      let progress = await LessonProgress.findOne({ userId });
      if (!progress) progress = new LessonProgress({ userId });

      if (!progress.completedLessons.includes(lessonOrder)) {
        progress.completedLessons.push(lessonOrder);
      }

      progress.streakCount = updateStreak(progress.lastCompletedAt, progress.streakCount);
      progress.lastCompletedAt = new Date();
      progress.lastActivityDate = new Date();

      const nextLesson = lessonOrder + 1;
      if (progress.currentLesson <= lessonOrder) {
        progress.currentLesson = nextLesson;
      }
      if (!progress.unlockedLessons.includes(nextLesson)) {
        progress.unlockedLessons.push(nextLesson);
      }

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
};