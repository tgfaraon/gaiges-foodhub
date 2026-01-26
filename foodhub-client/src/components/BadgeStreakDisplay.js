import { useState } from "react";
import DashboardCard from "./DashboardCard";
import React from "react";
import "../styles/animations.css";

// Map badge names (from backend) to icons
const badgeIcons = {
  "Joined Gaige's Food Hub": "🥬",
  "Completed First Lesson": "🍳",
  "Consistency Badge": "🔥",
  "Weekly Warrior Badge": "🏆",
  "Master Chef Streak Badge": "🎉",
  "Apprentice Badge": "🔰",
  "Mise En Place Pro Badge": "🛠️",
  "Perfect Score Badge": "⭐",
  "Precision Badge": "🎯",
  "Culinary Artisan": "🍽️",
  "Technique Specialist": "📜",
  "Plating Wiz": "🍝🧙🏼‍♂️",
  "Culinary Mastery": "💎🥇",
};

const badgeRarity = {
  "Joined Gaige's Food Hub": "common",
  "Completed First Lesson": "common",
  "Consistency Badge": "common",
  "Weekly Warrior Badge": "rare",
  "Master Chef Streak Badge": "epic",
  "Apprentice Badge": "common",
  "Mise En Place Pro Badge": "rare",
  "Perfect Score Badge": "epic",
  "Precision Badge": "rare",
  "Culinary Artisan": "rare",
  "Technique Specialist": "epic",
  "Plating Wiz": "epic",
  "Culinary Mastery": "legendary",
};

const badgeDescriptions = {
  "Joined Gaige's Food Hub": "You’ve stepped into the kitchen. Welcome to your culinary journey.",
  "Completed First Lesson": "A strong start — you’ve taken your first real step toward kitchen confidence.",
  "Consistency Badge": "Three days of steady practice. Skill grows where habits live.",
  "Weekly Warrior Badge": "Seven days straight — real commitment to your craft.",
  "Master Chef Streak Badge": "Thirty days of dedication. This is the discipline great cooks are built on.",
  "Apprentice Badge": "Lessons 1–5 complete — you’ve mastered the fundamentals.",
  "Mise En Place Pro Badge": "Ten lessons down — your workflow is sharper and more intentional.",
  "Perfect Score Badge": "A flawless quiz performance — you nailed every detail.",
  "Precision Badge": "Scored 90%+ on a quiz after five lessons — impressive accuracy.",
  "Culinary Artisan": "Thirteen lessons complete — your technique is evolving into craftsmanship.",
  "Technique Specialist": "Twenty lessons complete — you’re moving with precision and confidence.",
  "Plating Wiz": "Twenty‑six lessons complete — your dishes look as good as they taste.",
  "Culinary Mastery": "All thirty lessons complete — you’ve earned your place at the top.",
};

export default function BadgeStreakDisplay({ progress }) {
  const [showUnlocked, setShowUnlocked] = useState(false);
  const [showAllBadges, setShowAllBadges] = useState(false);

  const unlockedBadges = progress?.badges || [];
  const streakCount = progress?.streakCount || 0;

  // Define all possible badges (aligned with backend names)
  const allBadges = Object.keys(badgeIcons);

  return (
    <DashboardCard title="Milestones & Badges" collapsible>
      {/* 🔥 Streak display */}
      <div className="streak-display">
        {streakCount > 1 ? (
          <p>
            Current streak: <strong>🔥 {streakCount}-day streak!</strong>
          </p>
        ) : (
          <p>No streak yet — complete lessons daily to build one!</p>
        )}
      </div>

      {/* ✅ Unlocked badges dropdown */}
      <div className="dropdown-section">
        <button
          className="dropdown-toggle"
          onClick={() => setShowUnlocked(!showUnlocked)}
        >
          <span>Unlocked Badges</span>
          <span className="caret">{showUnlocked ? "▾" : "▸"}</span>
        </button>
        {showUnlocked && (
          <div className="dropdown-content">
            <div className="badge-grid">
              {unlockedBadges.length > 0 ? (
                unlockedBadges.map((badge, idx) => (
                  <div key={idx} className="badge">
                    <span className="icon">{badgeIcons[badge] || "🏅"}</span>
                    <span className="label">{badge}</span>
                  </div>
                ))
              ) : (
                <p>No badges unlocked yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #ddd",
          margin: "1rem 0",
        }}
      />

      {/* ✅ Separate modal for all badges */}
      <button id="view-all-badges" onClick={() => setShowAllBadges(true)}>
        View All Badges
      </button>

      {showAllBadges && (
        <div id="badge-modal" className="modal">
          <div className="modal-content">
            <span
              id="close-badge-modal"
              className="close"
              onClick={() => setShowAllBadges(false)}
            >
              &times;
            </span>
            <h3>All Available Badges</h3>
            <ul>
              {allBadges.map((badge, idx) => (
                <li key={idx}>
                  <span className="icon">{badgeIcons[badge]}</span>{" "}
                  <span className="label">
                    {badge}
                    <span className={`rarity-dot rarity-${badgeRarity[badge]}`}></span>
                  </span>
                  <p className="description">{badgeDescriptions[badge]}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}