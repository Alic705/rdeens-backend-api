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
 * Saves uploaded CV buffer reliably to local disk (/src/uploads/resumes/)
 * avoiding Cloudinary PDF HTTP 401 access restrictions.
 */
export const saveResumeFile = async (file) => {
  if (!file || !file.buffer) {
    throw new Error("No file uploaded");
  }

  // Save locally in src/uploads/resumes
  const resumesDir = path.join(__dirname, "..", "uploads", "resumes");
  if (!fs.existsSync(resumesDir)) {
    fs.mkdirSync(resumesDir, { recursive: true });
  }

  const ext = path.extname(file.originalname) || ".pdf";
  const uniqueFilename = `cv-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const filePath = path.join(resumesDir, uniqueFilename);

  await fs.promises.writeFile(filePath, file.buffer);

  // Return relative web URL served by Express backend
  return `/uploads/resumes/${uniqueFilename}`;
};
