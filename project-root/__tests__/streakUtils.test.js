import { updateStreak } from "../utils/streakUtils.js";

describe("updateStreak", () => {
  test("starts streak when no lastCompletedAt", () => {
    expect(updateStreak(null, 0)).toBe(1);
  });

  test("keeps streak if lesson completed today", () => {
    const today = new Date();
    expect(updateStreak(today, 3)).toBe(3);
  });

  test("increments streak if lesson completed yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(updateStreak(yesterday, 2)).toBe(3);
  });

  test("resets streak if gap > 1 day", () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    expect(updateStreak(lastWeek, 5)).toBe(1);
  });
});