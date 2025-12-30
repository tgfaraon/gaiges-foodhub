import request from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import User from "../models/Users.js";
import jwt from "jsonwebtoken";

jest.setTimeout(20000);

describe("Auth Routes", () => {
  let token;
  let registeredUsername;
  let registeredEmail;

  beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await User.deleteMany({});
});

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should register a new user", async () => {
    const uniqueSuffix = Date.now();
    registeredUsername = `testuser_${uniqueSuffix}`;
    registeredEmail = `test_${uniqueSuffix}@example.com`;

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Test",
        lastName: "User",
        username: registeredUsername,
        email: registeredEmail,
        password: "Password123!",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("token");

    token = res.body.token;
  });

  it("should login with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        username: registeredUsername,
        password: "Password123!",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("should reject login with invalid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        username: registeredUsername,
        password: "WrongPassword",
      });

    expect(res.statusCode).toBe(401);
  });

  it("should handle logout gracefully", async () => {
    const logoutToken = jwt.sign(
      { userId: "logoutUserId", role: "member" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${logoutToken}`);

    expect([200, 404]).toContain(res.statusCode);
  });
});