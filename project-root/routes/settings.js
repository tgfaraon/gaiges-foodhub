import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import Setting from "../models/Settings.js";

const router = express.Router();

// ---- Public: Get all settings ----
router.get("/", async (req, res) => {
  try {
    const settings = await Setting.find();
    res.json(settings);
  } catch (err) {
    console.error("❌ Error fetching settings:", err.message);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// ---- Admin: Update a setting ----
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const updated = await Setting.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Setting not found" });
    res.json({ message: "Setting updated successfully", setting: updated });
  } catch (err) {
    console.error("❌ Error updating setting:", err.message);
    res.status(500).json({ error: "Failed to update setting" });
  }
});

// ---- Admin: Create a new setting ----
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const setting = new Setting(req.body);
    await setting.save();
    res.status(201).json({ message: "Setting created successfully", setting });
  } catch (err) {
    console.error("❌ Error creating setting:", err.message);
    res.status(500).json({ error: "Failed to create setting" });
  }
});

// ---- Admin: Delete a setting ----
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const deleted = await Setting.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Setting not found" });
    res.json({ message: "Setting deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting setting:", err.message);
    res.status(500).json({ error: "Failed to delete setting" });
  }
});

export default router;