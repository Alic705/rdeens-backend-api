import express from 'express';
import {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  getProjectBySlug
} from '../controllers/projectController.js';

import { validateProject } from '../validators/projectValidator.js';
import { protect, admin } from '../middleware/authMiddleware.js';

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import os from 'os';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL);
const uploadsDir = isVercel
  ? path.join(os.tmpdir(), 'uploads', 'projects')
  : path.join(__dirname, '../uploads/projects');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.warn('Project uploads directory notice:', e.message);
}

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
    const uniqueName =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/i;

  const extValid = allowedTypes.test(
    path.extname(file.originalname)
  );

  const mimeValid = allowedTypes.test(file.mimetype);

  if (extValid && mimeValid) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

router.get('/all', getProjects);

router.get('/:slug', getProjectBySlug);

router.post(
  '/',
  protect,
  admin,
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]),
  validateProject,
  createProject
);

router.put(
  '/:id',
  protect,
   admin,
   upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]),
   validateProject,
   updateProject
);

router.delete(
  '/:id',
  protect,
  admin,
  deleteProject
);

export default router;