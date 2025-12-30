// controllers/settingsController.js
const Settings = require("../models/Settings");

// GET current site settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      // If no settings doc exists, create a default one
      const defaultSettings = new Settings();
      await defaultSettings.save();
      return res.json(defaultSettings);
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch site settings" });
  }
};

// UPDATE site settings
exports.updateSettings = async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      {},
      req.body,
      { new: true, upsert: true } // upsert ensures a doc always exists
    );
    res.json(settings);
  } catch (err) {
    res.status(400).json({ error: "Failed to update site settings" });
  }
};