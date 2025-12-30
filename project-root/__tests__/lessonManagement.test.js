import request from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import Lesson from "../models/Lesson.js";
import User from "../models/Users.js";
import jwt from "jsonwebtoken";

jest.setTimeout(20000);

describe("Lesson Management Routes", () => {
  let memberToken;
  let testUser;
  let testLesson;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    await User.deleteMany({});
    await Lesson.deleteMany({});

    testUser = await User.create({
      firstName: "Lesson",
      lastName: "Tester",
      username: "lessonTester",
      email: "lesson@example.com",
      password: "Password123!",
      active: true,
      role: "member",
      bookmarkedLessons: [], // initialize arrays
      completedLessons: [],
    });

    testLesson = await Lesson.create({
      title: "Test Lesson",
      content: "Sample content",
      order: 1, // required field
    });

    memberToken = jwt.sign(
      { userId: testUser._id, role: "member" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Lesson.deleteMany({});
    await mongoose.connection.close();
  });

  it("should allow user to bookmark a lesson", async () => {
    const res = await request(app)
      .post(`/api/memberLessons/${testLesson._id}/bookmark`)
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Lesson bookmarked");

    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.bookmarkedLessons).toContainEqual(testLesson._id);
  });

  it("should allow user to complete a lesson", async () => {
    const res = await request(app)
      .post(`/api/memberLessons/${testLesson._id}/complete`)
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Lesson completed");

    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.completedLessons).toContainEqual(testLesson._id);
  });

  it("should prevent bookmarking without token", async () => {
    const res = await request(app).post(`/api/memberLessons/${testLesson._id}/bookmark`);
    expect(res.statusCode).toBe(401);
  });

  it("should prevent completing without token", async () => {
    const res = await request(app).post(`/api/memberLessons/${testLesson._id}/complete`);
    expect(res.statusCode).toBe(401);
  });
});