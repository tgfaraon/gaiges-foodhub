import Analytics from "../models/Analytics.js";

// ---- GET all analytics ----
export const getAllAnalytics = async (req, res) => {
  try {
    const analytics = await Analytics.find()
      .populate("userId", "name email")
      .populate("lessonId", "title order");
    res.json({ analytics });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};

// ---- GET analytics for a specific user ----
export const getUserAnalytics = async (req, res) => {
  try {
    const analytics = await Analytics.find({ userId: req.params.userId })
      .populate("lessonId", "title order");
    if (!analytics || analytics.length === 0) {
      return res.status(404).json({ error: "No analytics found for this user" });
    }
    res.json({ analytics });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user analytics" });
  }
};

// ---- CREATE or UPDATE analytics entry ----
export const upsertAnalytics = async (req, res) => {
  try {
    const { userId, lessonId, completionPercentage } = req.body;
    const analytics = await Analytics.findOneAndUpdate(
      { userId, lessonId },
      { completionPercentage },
      { new: true, upsert: true }
    );
    res.json({ analytics });
  } catch (err) {
    res.status(400).json({ error: "Failed to update analytics" });
  }
};