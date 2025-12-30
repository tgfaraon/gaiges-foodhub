import { awardBadges } from "../utils/badgeUtils.js";

describe("awardBadges", () => {
  let progress;

  beforeEach(() => {
    progress = {
      badges: [],
      completedLessons: [],
      streakCount: 0,
    };
  });

  test("awards 'Joined Gaige's Food Hub' on first lesson", () => {
    progress.completedLessons = [1];
    const newBadges = awardBadges(progress, 100);
    expect(newBadges).toContain("Joined Gaige's Food Hub");
    expect(progress.badges).toContain("Joined Gaige's Food Hub");
  });

  test("awards 'Completed First Lesson' when lesson 1 is done", () => {
    progress.completedLessons = [1];
    const newBadges = awardBadges(progress, 100);
    expect(newBadges).toContain("First Lesson Complete");
  });

  test("awards 'Perfect Score Badge' when quizScore is 100", () => {
    progress.completedLessons = [2];
    const newBadges = awardBadges(progress, 100);
    expect(newBadges).toContain("Perfect Score Badge");
  });

  test("does not duplicate badges", () => {
    progress.completedLessons = [1];
    progress.badges = ["Completed First Lesson"];
    const newBadges = awardBadges(progress, 100);
    expect(newBadges).not.toContain("Completed First Lesson");
  });
});