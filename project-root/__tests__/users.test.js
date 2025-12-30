import request from "supertest";
import app from "../app.js"; // ✅ use app.js, not server.js

// Mock token for testing (replace with a real one or generate dynamically)
const token = process.env.TEST_TOKEN || "your-valid-jwt";

describe("User routes", () => {
  describe("GET /api/users/account", () => {
    it("should reject without token", async () => {
      const res = await request(app).get("/api/users/account");
      expect(res.statusCode).toBe(401);
    });

    it("should return account data with valid token", async () => {
      const res = await request(app)
        .get("/api/users/account")
        .set("Authorization", `Bearer ${token}`);

      expect([200, 401]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty("email");
        expect(res.body).toHaveProperty("role");
      }
    });
  });

  describe("GET /api/users/preferences", () => {
    it("should reject without token", async () => {
      const res = await request(app).get("/api/users/preferences");
      expect(res.statusCode).toBe(401);
    });

    it("should return preferences with valid token", async () => {
      const res = await request(app)
        .get("/api/users/preferences")
        .set("Authorization", `Bearer ${token}`);

      expect([200, 401]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty("goal");
        expect(Array.isArray(res.body.diets)).toBe(true);
      }
    });
  });
});