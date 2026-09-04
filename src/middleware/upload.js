import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory safely
const isVercel = Boolean(process.env.VERCEL);
const uploadsDir = isVercel
  ? path.join(os.tmpdir(), "uploads", "blogs")
  : path.join(__dirname, "../uploads/blogs");

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.warn("Blog uploads directory notice:", e.message);
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
    } catch {}
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter (only images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/i;
  const extValid = allowedTypes.test(path.extname(file.originalname));
  const mimeValid = allowedTypes.test(file.mimetype);

  if (extValid && mimeValid) {
    cb(null, true);
  } else {
    cb(
      new Error("Only image files are allowed (jpeg, jpg, png, gif, webp, svg)"),
      false
    );
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per image
  },
});

export const uploadBlogImages = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "detailImage", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);
