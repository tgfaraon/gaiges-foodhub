/**
 * Updates streak count based on last completion date.
 * - If lesson completed yesterday → increment streak
 * - If lesson completed today → keep streak
 * - If gap > 1 day → reset streak to 1
 *
 * @param {Date|null} lastCompletedAt - Date of last completed lesson
 * @param {number} currentStreak - Current streak count
 * @returns {number} updated streak count
 */
function updateStreak(lastCompletedAt, currentStreak) {
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (!lastCompletedAt) {
    // First lesson completed → start streak
    return 1;
  }

  const last = new Date(lastCompletedAt);
  const lastMidnight = new Date(last.getFullYear(), last.getMonth(), last.getDate());

  const diffDays = Math.floor(
    (todayMidnight - lastMidnight) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    // Same day → streak unchanged
    return currentStreak;
  } else if (diffDays === 1) {
    // Consecutive day → increment streak
    return currentStreak + 1;
  } else {
    // Missed days → reset streak
    return 1;
  }
}

// ✅ Proper ESM export
export { updateStreak };