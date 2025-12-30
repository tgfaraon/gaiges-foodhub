import { useState } from "react";
import DashboardCard from "./DashboardCard";
import React from "react";

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
                  <span className="label">{badge}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}