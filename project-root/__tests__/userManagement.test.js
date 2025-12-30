import request from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import User from "../models/Users.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

jest.setTimeout(20000);

describe("User Management Routes", () => {
  let adminToken;
  let testUser;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    await User.deleteMany({}); // clear users

    // 🔑 Hash the password before saving so login works
    const hashedPassword = await bcrypt.hash("Password123!", 10);

    testUser = await User.create({
      firstName: "Test",
      lastName: "Member",
      username: "testmember",
      email: "member@example.com",
      password: hashedPassword,
      active: true,
      role: "member",
    });

    adminToken = jwt.sign(
      { userId: "adminUserId", role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  it("should deactivate a user", async () => {
    const res = await request(app)
      .put(`/api/admin/users/${testUser._id}/deactivate`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "User deactivated");

    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.active).toBe(false);
  });

  it("should prevent deactivated user from logging in", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "testmember", password: "Password123!" });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("message", "Account inactive");
  });

  it("should reactivate a user", async () => {
    const res = await request(app)
      .put(`/api/admin/users/${testUser._id}/reactivate`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "User reactivated");

    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.active).toBe(true);
  });

  it("should allow reactivated user to log in", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "testmember", password: "Password123!" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });
});