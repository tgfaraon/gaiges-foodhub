import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/Users.js";
import Certificate from "../models/Certificate.js";
import { sendCertificateEmail } from "../utils/sendEmail.js";
import generateCertificatePDF from "../utils/generateCertificatePDF.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/issue", protect, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const certificateId = `FH-${Date.now().toString().slice(-6)}`;

        // Save certificate record
        await Certificate.create({
            userId,
            certificateId,
            issuedAt: new Date(),
        });

        // Generate PDF buffer
        const pdfBuffer = await generateCertificatePDF({
            firstName: user.firstName,
            lastName: user.lastName,
            certificateId,
            completionDate: new Date().toLocaleDateString(),
        });

        // Send certificate email
        await sendCertificateEmail(user, pdfBuffer);

        res.json({
            message: "Certificate issued and emailed successfully",
            certificateId,
        });
    } catch (err) {
        console.error("❌ Certificate issuing error:", err);
        res.status(500).json({ error: "Failed to issue certificate" });
    }
});

// GET /api/certificates/:userId 
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const cert = await Certificate.findOne({ userId });

        if (!cert) {
            return res.json({ exists: false });
        }

        res.json({
            exists: true,
            certificateId: cert.certificateId,
            completionDate: cert.issuedAt.toLocaleDateString(),
            firstName: req.user.firstName,
            lastName: req.user.lastName,
        });
    } catch (err) {
        console.error("❌ Certificate lookup error:", err);
        res.status(500).json({ error: "Failed to fetch certificate" });
    }
});

// GET /api/certificates/:userId/pdf 
router.get("/:userId/pdf", protect, async (req, res) => {
    try {
        const token =
            req.query.token ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);

        if (!token) {
            return res.status(401).json({ error: "Unauthorized: missing token" });
        }

        // Verify token manually 
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ error: "Unauthorized: invalid token" });
        }

        const { userId } = req.params;

        const user = await User.findById(userId);
        const cert = await Certificate.findOne({ userId });

        if (!user || !cert) {
            return res.status(404).json({ error: "Certificate not found" });
        }

        const pdfBuffer = await generateCertificatePDF({
            firstName: user.firstName,
            lastName: user.lastName,
            certificateId: cert.certificateId,
            completionDate: cert.issuedAt.toLocaleDateString(),
        });

        res.setHeader("Content-Type", "application/pdf");
        res.send(pdfBuffer);
    } catch (err) {
        console.error("❌ PDF fetch error:", err);
        res.status(500).json({ error: "Failed to load certificate PDF" });
    }
});

// POST /api/certificates/resend 
router.post("/resend", protect, async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);
        const cert = await Certificate.findOne({ userId });

        if (!user || !cert) {
            return res.status(404).json({ error: "Certificate not found" });
        }
        const pdfBuffer = await generateCertificatePDF({
            firstName: user.firstName,
            lastName: user.lastName,
            certificateId: cert.certificateId,
            completionDate: cert.issuedAt.toLocaleDateString(),
        });

        await sendCertificateEmail(user, pdfBuffer);

        res.json({ message: "Certificate email resent successfully" });
    } catch (err) {
        console.error("❌ Resend error:", err);
        res.status(500).json({ error: "Failed to resend certificate" });
    }
});

export default router;