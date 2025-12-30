import jwt from "jsonwebtoken";

/* -------------------------------------------------------
   ✅ Core authentication middleware
   - Accepts "Authorization: Bearer <token>" OR "<token>"
   - Verifies JWT
   - Attaches decoded user payload to req.user
------------------------------------------------------- */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized: missing token" });
  }

  // Extract token from "Bearer <token>" or raw token
  const parts = authHeader.split(" ");
  const token =
    parts.length === 2 && parts[0] === "Bearer" ? parts[1] : authHeader;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: invalid token format" });
  }

  try {
    // Optional: decode without verifying (useful for debugging expiration)
    const decodedPreview = jwt.decode(token);
    if (decodedPreview?.exp) {
      console.log(
        `🕒 Token exp: ${decodedPreview.exp}, now: ${Math.floor(
          Date.now() / 1000
        )}`
      );
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded payload (userId, role, email, etc.)
    req.user = decoded;

    console.log(
      `✅ Authenticated: ${
        decoded.username || decoded.email || decoded.userId
      } (role: ${decoded.role})`
    );

    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    return res
      .status(401)
      .json({ error: "Unauthorized: invalid or expired token" });
  }
};

/* -------------------------------------------------------
   ✅ Alias: protect()
   - Many routes already use protect()
   - Keep it for backward compatibility
------------------------------------------------------- */
export const protect = authMiddleware;

/* -------------------------------------------------------
   ✅ Admin-only middleware
   - Must be used AFTER authMiddleware/protect
------------------------------------------------------- */
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized: no user context" });
  }

  const role = (req.user.role || "").toLowerCase();
  if (role !== "admin") {
    return res.status(403).json({ error: "Forbidden: admin only" });
  }

  console.log(
    `👑 Admin access granted: ${
      req.user.username || req.user.email || req.user.userId
    }`
  );

  next();
};

export default authMiddleware;