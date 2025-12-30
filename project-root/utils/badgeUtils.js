// Immutable mapping: badges -> recipe lesson IDs (update IDs to match your data)
const recipeUnlocks = Object.freeze({
  "Perfect Score Badge": 99,
  "Weekly Warrior Badge": 100,
  "Apprentice Badge": 101,       // Reward Recipe 101
  "Culinary Artisan": 201,       // Reward Recipe 201 
  "Technique Specialist": 301,   // Reward Recipe 301
});

/**
 * Awards badges based on progress and optional quizScore.
 * - Ensures baseline and milestone badges
 * - Prevents duplicates
 * - Unlocks recipe lessons tied to newly awarded badges
 * - Returns the list of newly awarded badges (for UI notifications)
 *
 * @param {Object} progress - User progress document (mutable)
 * @param {number|null} quizScore - Latest quiz score (0-100) or null
 * @returns {string[]} newly awarded badges
 */
function awardBadges(progress, quizScore = null) {
  // Defensive defaults
  progress.badges = Array.isArray(progress.badges) ? progress.badges : [];
  progress.unlockedLessons = Array.isArray(progress.unlockedLessons)
    ? progress.unlockedLessons
    : [];
  progress.completedLessons = Array.isArray(progress.completedLessons)
    ? progress.completedLessons
    : [];

  progress.completedLessonsCount = progress.completedLessons.length;
  progress.streakCount = Number(progress.streakCount || 0);

  const currentBadges = new Set(progress.badges);
  const newBadges = [];

  /* ---------------------------------------------
     Baseline Badges
  --------------------------------------------- */

  if (!currentBadges.has("Joined Gaige's Food Hub")) {
    newBadges.push("Joined Gaige's Food Hub");
  }

  if (
    progress.completedLessonsCount >= 1 &&
    !currentBadges.has("First Lesson Complete")
  ) {
    newBadges.push("First Lesson Complete");
  }

  /* ---------------------------------------------
     Streak Badges
  --------------------------------------------- */

  if (progress.streakCount >= 3 && !currentBadges.has("Consistency Badge")) {
    newBadges.push("Consistency Badge");
  }

  if (progress.streakCount >= 7 && !currentBadges.has("Weekly Warrior Badge")) {
    newBadges.push("Weekly Warrior Badge");
  }

  if (
    progress.streakCount >= 30 &&
    !currentBadges.has("Master Chef Streak Badge")
  ) {
    newBadges.push("Master Chef Streak Badge");
  }

  /* ---------------------------------------------
     Completion Badges
  --------------------------------------------- */

  // Apprentice Badge — Complete Lessons 1–5
  if (
    progress.completedLessons.includes(1) &&
    progress.completedLessons.includes(2) &&
    progress.completedLessons.includes(3) &&
    progress.completedLessons.includes(4) &&
    progress.completedLessons.includes(5) &&
    !currentBadges.has("Apprentice Badge")
  ) {
    newBadges.push("Apprentice Badge");
  }

  // Journeyman Badge — Complete 10 lessons
  if (
    progress.completedLessonsCount >= 10 &&
    !currentBadges.has("Mise En Place Pro Badge")
  ) {
    newBadges.push("Mise En Place Pro Badge");
  }

  // ⭐ NEW: Culinary Artisan — Complete 13 lessons
  if (
    progress.completedLessonsCount >= 13 &&
    !currentBadges.has("Culinary Artisan")
  ) {
    newBadges.push("Culinary Artisan");
  }

  // ⭐ NEW: Technique Specialist — Complete 20 lessons
  if (
    progress.completedLessonsCount >= 20 &&
    !currentBadges.has("Technique Specialist")
  ) {
    newBadges.push("Technique Specialist");
  }

  // ⭐ NEW: Plating Wiz — Complete 13 lessons
  if (
    progress.completedLessonsCount >= 26 &&
    !currentBadges.has("Plating Wiz")
  ) {
    newBadges.push("Plating Wiz");
  }

  // ⭐ NEW: Culinary Mastery — Complete 30 lessons
  if (
    progress.completedLessonsCount >= 30 &&
    !currentBadges.has("Culinary Mastery")
  ) {
    newBadges.push("Culinary Mastery");
  }

  /* ---------------------------------------------
     Quiz Performance Badges
  --------------------------------------------- */

  const score = quizScore == null ? null : Number(quizScore);

  if (score === 100 && !currentBadges.has("Perfect Score Badge")) {
    newBadges.push("Perfect Score Badge");
  }

  if (
    score != null &&
    score >= 90 &&
    progress.completedLessonsCount >= 5 &&
    !currentBadges.has("Precision Badge")
  ) {
    newBadges.push("Precision Badge");
  }

  /* ---------------------------------------------
     Apply Badges (deduped)
  --------------------------------------------- */

  progress.badges = Array.from(new Set([...currentBadges, ...newBadges]));

  /* ---------------------------------------------
     Unlock Recipe Lessons Tied to Badges
  --------------------------------------------- */

  for (const badge of newBadges) {
    const lessonId = recipeUnlocks[badge];
    if (lessonId != null && !progress.unlockedLessons.includes(lessonId)) {
      progress.unlockedLessons.push(lessonId);
    }
  }

  return newBadges;
}

// ESM export
export { awardBadges, recipeUnlocks };