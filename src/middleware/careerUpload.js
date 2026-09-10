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
 * - Uses compact filename format (e.g. cv-m2k8x9p.pdf) to ensure short URL paths.
 * - Writes to src/uploads/resumes/ locally or /tmp/resumes/ on Vercel serverless to prevent EROFS & URI_TOO_LONG errors.
 */
export const saveResumeFile = async (file) => {
  if (!file || !file.buffer) {
    throw new Error("No file uploaded");
  }

  const ext = path.extname(file.originalname).toLowerCase() || ".pdf";
  // Compact short filename format (e.g. cv-m2k8x9p.pdf)
  const shortFilename = `cv-${Date.now().toString(36)}${ext}`;

  // Determine writable directory (/tmp/resumes on Vercel serverless, src/uploads/resumes locally)
  let targetDir = path.join(__dirname, "..", "uploads", "resumes");
  
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    targetDir = path.join("/tmp", "resumes");
  }

  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const filePath = path.join(targetDir, shortFilename);
    await fs.promises.writeFile(filePath, file.buffer);
    return `/uploads/resumes/${shortFilename}`;
  } catch (err) {
    // Backup try using /tmp/resumes if main folder write failed
    try {
      const tmpDir = path.join("/tmp", "resumes");
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      const tmpPath = path.join(tmpDir, shortFilename);
      await fs.promises.writeFile(tmpPath, file.buffer);
      return `/uploads/resumes/${shortFilename}`;
    } catch (fallbackErr) {
      console.error("Resume file write failed:", fallbackErr);
      throw new Error("Failed to save resume file");
    }
  }
};
