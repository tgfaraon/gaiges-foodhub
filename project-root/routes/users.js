import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/Users.js";
import LessonProgress from "../models/LessonProgress.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ---- Member Registration ----
// POST /api/users/register
router.post("/register", async (req, res) => {
  try {
    const { firstName, username, email, password } = req.body;

    if (!firstName || !username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      username,
      email,
      password: hashedPassword,
      role: "member",
      avatar: null, // initialize avatar field
    });

    await user.save();

    await LessonProgress.create({
      userId: user._id,
      completedLessons: [],
      badges: ["Joined Gaige's Food Hub"],
      streak: 0,
    });

    const tokenPayload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "Member registered successfully",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error("Registration failed:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---- Member/Admin Login ----
// POST /api/users/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const tokenPayload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error("Login failed:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---- Save or update cooking preferences ----
router.post("/preferences", protect, async (req, res) => {
  try {
    const { goal, diets } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.preferences = {
      goal: goal || user.preferences?.goal || "meal-prep",
      diets: Array.isArray(diets) ? diets : user.preferences?.diets || [],
    };

    await user.save();
    res.json(user.preferences);
  } catch (err) {
    console.error("Failed to save preferences:", err);
    res.status(500).json({ error: "Failed to save preferences" });
  }
});

router.get("/preferences", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.preferences || { goal: "meal-prep", diets: [] });
  } catch (err) {
    console.error("Failed to load preferences:", err);
    res.status(500).json({ error: "Failed to load preferences" });
  }
});

// ---- Update current user's account ----
// PUT /api/users/account
router.put("/account", protect, async (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (name) user.firstName = name; // or user.name if you prefer a single field
    if (email) user.email = email;
    if (password) user.password = password; // ⚠️ hash before saving in production
    if (avatar) user.avatar = avatar;

    await user.save();
    res.json({ message: "Account updated successfully", account: {
      name: user.firstName,
      email: user.email,
      avatar: user.avatar
    }});
  } catch (err) {
    console.error("Failed to update account:", err);
    res.status(500).json({ error: "Failed to update account" });
  }
});

// ---- Get account settings ----
router.get("/account", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      name: user.firstName,
      email: user.email,
      avatar: user.avatar,
      role: user.role,   // ✅ include role
    });
  } catch (err) {
    console.error("Failed to load account:", err);
    res.status(500).json({ error: "Failed to load account" });
  }
});

// ---- Reset a member's progress (admin only) ----
router.put("/:id/reset-progress", protect, adminOnly, async (req, res) => {
  try {
    const userId = req.params.id;
    const progress = await LessonProgress.findOne({ userId });

    if (!progress) {
      return res.status(404).json({ error: "Progress record not found" });
    }

    progress.completedLessons = [];
    progress.badges = ["Joined Gaige's Food Hub"];
    progress.streak = 0;
    await progress.save();

    res.json({ message: "Progress reset successfully." });
  } catch (err) {
    console.error("Progress reset failed:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---- Reset password (admin only) ----
router.put("/:id/reset-password", protect, adminOnly, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ error: "New password is required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: `Password reset successful for ${user.username}` });
  } catch (err) {
    console.error("Password reset failed:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---- Promote a user to admin — only gfhadmin can do this ----
router.put("/:id/promote", protect, adminOnly, async (req, res) => {
  try {
    const requesterUsername = req.user.username;
    if (requesterUsername !== "gfhadmin") {
      return res.status(403).json({ error: "Only gfhadmin can assign admin roles" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.role = "admin";
    await user.save();

    res.json({ message: `${user.email} has been promoted to admin.` });
  } catch (err) {
    console.error("Admin promotion failed:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---- Demote user by ID (admin only) ----
router.put("/:id/demote", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.username === "gfhadmin") {
      return res.status(403).json({ error: "Cannot demote the primary admin account" });
    }

    user.role = "member";
    await user.save();

    res.json({ message: `${user.email} has been demoted to member.` });
  } catch (err) {
    console.error("Admin demotion failed:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---- List all users (admin only) ----
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, "firstName username email role avatar");
    res.json(users);
  } catch (err) {
    console.error("Failed to fetch users:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---- Get saved items for current user ----
router.get("/saved", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ items: user.savedItems || [] });
  } catch (err) {
    console.error("Failed to fetch saved content:", err);
    res.status(500).json({ error: "Failed to fetch saved content" });
  }
});

// ---- Save a lesson to current user's saved items ----
router.post("/saved", protect, async (req, res) => {
  try {
    const { lessonId } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.savedItems.includes(lessonId)) {
      user.savedItems.push(lessonId);
      await user.save();
    }

    res.json({ message: "Lesson saved", items: user.savedItems });
  } catch (err) {
    console.error("Failed to save lesson:", err);
    res.status(500).json({ error: "Failed to save lesson" });
  }
});

// ---- Remove a saved lesson ----
router.delete("/saved/:lessonId", protect, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.savedItems = user.savedItems.filter((id) => id !== lessonId);
    await user.save();

    res.json({ message: "Lesson removed", items: user.savedItems });
  } catch (err) {
    console.error("Failed to remove saved lesson:", err);
    res.status(500).json({ error: "Failed to remove saved lesson" });
  }
});

// ---- Delete a user account (admin only) ----
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.username === "gfhadmin") {
      return res.status(403).json({ error: "Cannot delete the primary admin account" });
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: `User ${user.email} has been deleted.` });
  } catch (err) {
    console.error("User deletion failed:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;