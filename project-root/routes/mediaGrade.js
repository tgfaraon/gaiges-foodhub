import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import LessonProgress from "../models/LessonProgress.js";
import { awardBadges } from "../utils/badgeUtils.js";
import { callAIGraderForMedia } from "../utils/aiMediaGrader.js";

const router = express.Router();

// ✅ Multer config for images + videos
const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter(req, file, cb) {
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");
    if (!isImage && !isVideo) {
      return cb(new Error("Only image or video uploads are allowed"));
    }
    cb(null, true);
  },
});

/* ---------------------------------------------
   ✅ Submit photo or video for AI grading
--------------------------------------------- */
router.post("/submit-media", protect, upload.single("media"), async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    if (!req.file) {
      return res.status(400).json({ error: "No media uploaded" });
    }

    const isVideo = req.file.mimetype.startsWith("video/");
    const isImage = req.file.mimetype.startsWith("image/");

    // ✅ Call AI grader (supports both)
    const feedback = await callAIGraderForMedia({
      buffer: req.file.buffer,
      type: isVideo ? "video" : "image",
      mimetype: req.file.mimetype,
    });

    // ✅ Load user progress
    let progress = await LessonProgress.findOne({ userId });
    if (!progress) {
      progress = new LessonProgress({
        userId,
        unlockedLessons: [1],
        currentLesson: 1,
        trainingComplete: false,
      });
    }

    // ✅ Award badges (optional)
    const newBadges = awardBadges(progress, null);

    await progress.save();

    res.json({
      message: "Media graded successfully",
      mediaType: isVideo ? "video" : "image",
      feedback,
      badges: progress.badges,
      newlyAwarded: newBadges,
    });

  } catch (err) {
    console.error("❌ Error grading media:", err);
    res.status(500).json({ error: "Failed to grade media" });
  }
});

export default router;