import express from 'express';
import {
  createTestimonial,
  getTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
  
} from '../controllers/testimonialController.js';
import { validateTestimonial } from '../validators/testimonialValidator.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// multer
const uploadsDir = path.join(__dirname, '../uploads/testimonials');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/i;
  const extValid = allowedTypes.test(path.extname(file.originalname));
  const mimeValid = allowedTypes.test(file.mimetype);
  
  if (extValid && mimeValid) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }  // 5MB
});


router.get('/', getTestimonials);
router.get('/:id', getTestimonialById);
router.post('/', 
  protect, 
  admin, 
  upload.fields([
    { name: 'logo', maxCount: 1 },
  
  ]),
  validateTestimonial,
  createTestimonial
);
router.put('/:id', 
  protect, 
  admin, 
  upload.fields([
    { name: 'logo', maxCount: 1 },
  ]),
  validateTestimonial,
  updateTestimonial
);
router.delete('/:id', protect, admin, deleteTestimonial);


export default router;

