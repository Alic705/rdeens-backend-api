import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { uploadToCloudinary } from "../config/cloudinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Memory storage so we can evaluate file or upload to Cloudinary/Disk dynamically
const storage = multer.memoryStorage();

// File filter (PDF, DOC, DOCX)
const fileFilter = (req, file, cb) => {
  const allowedExts = /\.pdf|\.doc|\.docx$/i;
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
  ];

  const extValid = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = allowedMimes.includes(file.mimetype) || extValid;

  if (extValid || mimeValid) {
    cb(null, true);
  } else {
    cb(
      new Error("Only PDF, DOC, and DOCX resume files are allowed"),
      false
    );
  }
};

export const uploadCareerCv = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for CV
  },
});

/**
 * Saves uploaded CV buffer safely:
 * 1. Uploads to Cloudinary if credentials are configured (Vercel-compatible)
 * 2. Writes to local disk (/src/uploads/resumes/) if in local dev environment
 * 3. Fallbacks to Base64 Data URI if file system is read-only (prevents EROFS 500 error on Vercel)
 */
export const saveResumeFile = async (file) => {
  if (!file || !file.buffer) {
    throw new Error("No file uploaded");
  }

  // 1. Try Cloudinary if environment variables are configured
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    try {
      const secureUrl = await uploadToCloudinary(file.buffer, "rdeens/resumes", "auto");
      if (secureUrl) return secureUrl;
    } catch (err) {
      console.warn("Cloudinary upload failed for CV, attempting fallback storage:", err.message);
    }
  }

  // 2. Try saving locally in src/uploads/resumes (for local dev)
  try {
    const resumesDir = path.join(__dirname, "..", "uploads", "resumes");
    if (!fs.existsSync(resumesDir)) {
      fs.mkdirSync(resumesDir, { recursive: true });
    }

    const ext = path.extname(file.originalname) || ".pdf";
    const uniqueFilename = `cv-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(resumesDir, uniqueFilename);

    await fs.promises.writeFile(filePath, file.buffer);
    return `/uploads/resumes/${uniqueFilename}`;
  } catch (fsErr) {
    console.warn("Local disk write failed (Vercel read-only filesystem detected), using Base64 fallback:", fsErr.message);
    // 3. Vercel Serverless Fallback: Return Base64 Data URI
    const mime = file.mimetype || "application/pdf";
    const base64Data = file.buffer.toString("base64");
    return `data:${mime};base64,${base64Data}`;
  }
};
