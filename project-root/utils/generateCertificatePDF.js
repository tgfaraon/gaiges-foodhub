import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

export default async function generateCertificatePDF({
    firstName,
    lastName,
    certificateId,
    completionDate }) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([800, 600]);
    const fullName = `${firstName} ${lastName}`;

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Food Hub brand colors 
    const beige = rgb(0.96, 0.93, 0.90);        // #F5EEE6 
    const caramel = rgb(0.76, 0.60, 0.42);      // #C19A6B 
    const espresso = rgb(0.19, 0.11, 0.04);     // #311D0A

    // Background fill 
    page.drawRectangle({
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        color: beige,
    });

    // Optional border 
    page.drawRectangle({
        x: 30,
        y: 30,
        width: 740,
        height: 540,
        borderColor: espresso,
        borderWidth: 1.5,
    });

    // Logo 
    try {
        const logoPath = path.join(process.cwd(), "public", "logo512.png");
        const logoBytes = fs.readFileSync(logoPath);
        const logoImage = await pdfDoc.embedPng(logoBytes);

        const logoWidth = 125;
        const logoHeight = (logoImage.height / logoImage.width) * logoWidth;

        page.drawImage(logoImage, {
            x: (800 - logoWidth) / 2,
            y: 470,
            width: logoWidth,
            height: logoHeight,
        });
    } catch (err) {
        console.error("Logo not found:", err);
    }

    const { width, height } = page.getSize();

    // 🏆 Title 
    const title = "Gaige's Food Hub Culinary Mastery Certificate";

    // Font sizes to match modal styling 
    const fillSize = 32;
    const strokeSize = 32;

    // Measure text width for centering 
    const titleWidth = bold.widthOfTextAtSize(title, fillSize);
    const centerX = (width - titleWidth) / 2;

    // Espresso stroke (outline) 
    page.drawText(title, {
        x: centerX - 0.70,
        y: 422,
        size: strokeSize,
        font: bold,
        color: espresso,
    });

    // Caramel fill 
    page.drawText(title, {
        x: centerX,
        y: 420,
        size: fillSize,
        font: bold,
        color: caramel,
    });

    // Decorative line under title 
    page.drawLine({
        start: { x: 80, y: 405 },
        end: { x: width - 80, y: 405 },
        thickness: 2,
        color: caramel,
    });

    // Awarded to 
    page.drawText("Awarded to:", {
        x: 80,
        y: 350,
        size: 18,
        font: bold,
        color: espresso,
    });

    page.drawText(fullName, {
        x: 80,
        y: 320,
        size: 28,
        font: bold,
        color: espresso,
    });

    // Body text 
    page.drawText("For successfully completing the Food Hub Culinary Mastery Track.", {
        x: 80,
        y: 280,
        size: 16,
        font,
        color: espresso,
    });

    // Completion info 
    page.drawText(`Completion Date: ${completionDate}`, {
        x: 80,
        y: 240,
        size: 14,
        font,
        color: espresso,
    });

    page.drawText(`Certificate ID: ${certificateId}`, {
        x: 80,
        y: 220,
        size: 14,
        font,
        color: espresso,
    });

    // Signature block 
    page.drawText("Tyler Gaige Faraon", {
        x: 500,
        y: 150,
        size: 18,
        font: bold,
        color: espresso,
    });

    page.drawText("Founder, Gaige's Food Hub", {
        x: 500,
        y: 130,
        size: 14,
        font,
        color: espresso,
    });

    // 🥇 Seal (bottom-left placement) 
    try {
        const sealPath = path.join(process.cwd(), "public", "seal.png"); // rename if needed 
        const sealBytes = fs.readFileSync(sealPath);
        const sealImage = await pdfDoc.embedPng(sealBytes);

        // Adjust scale to your preferred size 
        const sealDims = sealImage.scale(0.11);

        page.drawImage(sealImage, {
            x: 60, // left margin 
            y: 97, // bottom margin 
            width: sealDims.width,
            height: sealDims.height,
        });
    } catch (err) {
        console.warn("Seal not found:", err.message);
    }

    // Bottom line 
    page.drawLine({
        start: { x: 80, y: 100 },
        end: { x: 720, y: 100 },
        thickness: 1.5,
        color: caramel,
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}