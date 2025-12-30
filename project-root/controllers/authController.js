import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/Users.js";

const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
  throw new Error("JWT_SECRET must be defined in .env");
}

export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required." });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    const { password: _, ...safeUser } = user.toObject();
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error("❌ Error in login controller:", err);
    res.status(500).json({ message: "Server error." });
  }
}

export async function register(req, res) {
  const { firstName, lastName, username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Username, email, and password required." });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      role: "member",
    });

    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username, role: newUser.role },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    const { password: _, ...safeUser } = newUser.toObject();
    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    console.error("❌ Error in register controller:", err);
    res.status(500).json({ message: "Server error." });
  }
}