import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import User from "../models/Users.js";
import Lesson from "../models/Lesson.js";

const router = express.Router();

// 📊 Get user analytics
router.get("/analytics", protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ active: true });
    const lessonsCompleted = await Lesson.aggregate([
      { $group: { _id: null, total: { $sum: "$completedCount" } } },
    ]);
    res.json({
      totalUsers,
      activeUsers,
      lessonsCompleted: lessonsCompleted[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// 👥 Manage users
router.get("/users", protect, adminOnly, async (req, res) => {
  const users = await User.find({}, "username email role active");
  res.json(users);
});

router.put("/users/:id/role", protect, adminOnly, async (req, res) => {
  const { role } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User role updated", user });
});

router.put("/users/:id/deactivate", protect, adminOnly, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User deactivated", user });
});

router.put("/users/:id/reactivate", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User reactivated", user });
  } catch (err) {
    console.error("❌ Error reactivating user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📣 Promote lessons/recipes
router.put("/lessons/:id/promote", protect, adminOnly, async (req, res) => {
  const lesson = await Lesson.findByIdAndUpdate(
    req.params.id,
    { promoted: true },
    { new: true }
  );
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });
  res.json({ message: "Lesson promoted", lesson });
});

export default router;