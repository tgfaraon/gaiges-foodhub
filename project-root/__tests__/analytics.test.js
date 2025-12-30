import request from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

describe("GET /api/admin/analytics", () => {
  let adminToken;

  beforeAll(async () => {
    // Connect to your test DB
    await mongoose.connect(process.env.MONGO_URI);

    // Generate a valid admin JWT using your secret
    adminToken = jwt.sign(
      { userId: "testAdminId", role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should return analytics data with valid token", async () => {
    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("totalUsers");
    expect(res.body).toHaveProperty("activeUsers");
    expect(res.body).toHaveProperty("lessonsCompleted");
  });

  it("should reject without token", async () => {
    const res = await request(app).get("/api/admin/analytics");
    expect(res.statusCode).toBe(401);
  });
});