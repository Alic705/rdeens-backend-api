import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage configuration
const storage = multer.memoryStorage();

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
    fileSize: 25 * 1024 * 1024, // 25MB per image
    fieldSize: 50 * 1024 * 1024, // 50MB for rich HTML content / embedded visuals
  },
});

export const uploadBlogImages = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "detailImage", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
  { name: "image", maxCount: 1 },
  { name: "file", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);
