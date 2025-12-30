import mongoose from "mongoose";

const lessonProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    completedLessons: { type: [Number], default: [] },
    unlockedLessons: { type: [Number], default: [1] },
    completedLessonsCount: { type: Number, default: 0 },
    currentLesson: { type: Number, default: 1 },
    badges: { type: [String], default: [] },

    streakCount: { type: Number, default: 0 },
    lastCompletedAt: { type: Date, default: null },

    lastActivityDate: { type: Date, default: Date.now },
    completionPercentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 🔑 Middleware to keep counts and percentages in sync
lessonProgressSchema.pre("save", function (next) {
  this.completedLessonsCount = this.completedLessons.length;

  const TOTAL_LESSONS = 30;

  const percentage = TOTAL_LESSONS > 0
    ? Math.round((this.completedLessonsCount / TOTAL_LESSONS) * 100)
    : 0;

  this.completionPercentage = Math.min(100, percentage);

  next();
});

const LessonProgress = mongoose.model("LessonProgress", lessonProgressSchema);

export default LessonProgress;