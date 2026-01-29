import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/Users.js";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../utils/sendEmail.js";

const router = express.Router();

// ---- Login ----
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required." });
  }

  try {
    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (!user.active) {
      return res.status(403).json({ message: "Account inactive" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      token,
      user: {
        userId: user._id.toString(),
        role: user.role,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error("❌ Error logging in:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// ---- Register ----
router.post("/register", async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body;

  if (!firstName || !lastName || !username || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    });

    if (existingUser) {
      return res.status(409).json({ message: "Username or email already taken." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      role: "member",
      active: true,
    });

    try {
      await sendWelcomeEmail(newUser, `${process.env.FRONTEND_URL}/login`);
    } catch (mailErr) {
      console.warn("✉️ Welcome email failed (non-blocking):", mailErr?.message);
    }

    const token = jwt.sign(
      {
        userId: newUser._id.toString(),
        role: newUser.role,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        avatar: newUser.avatar,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "User registered successfully.",
      token,
      user: {
        userId: newUser._id.toString(),
        role: newUser.role,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        avatar: newUser.avatar,
      },
    });
  } catch (err) {
    console.error("❌ Error registering user:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// ---- Forgot Password ----
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset/${token}`;

    try {
      await sendPasswordResetEmail(user, resetLink);
    } catch (mailErr) {
      console.warn("✉️ Reset email failed (non-blocking):", mailErr?.message);
    }

    res.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error("❌ Error in forgot-password:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// ---- Reset Password ----
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("❌ Error in reset-password:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// ---- Logout ----
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully." });
});

export default router;