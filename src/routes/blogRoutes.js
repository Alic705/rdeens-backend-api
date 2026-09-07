import express from "express";
import {
  createBlog,
  getBlogs,
  getBlogBySlug,
  getAllBlogsAdmin,
  updateBlog,
  deleteBlog,
  uploadInlineImage,
} from "../controllers/blogController.js";
import { validateBlog } from "../validators/blogValidator.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { uploadBlogImages, upload } from "../middleware/upload.js";

const router = express.Router();

// Public Routes
router.get("/", getBlogs);
router.get("/all", protect, admin, getAllBlogsAdmin);
router.get("/:slug", getBlogBySlug);

// Admin Protected Routes
router.post(
  "/upload-image",
  protect,
  admin,
  upload.single("image"),
  uploadInlineImage
);

router.post("/", protect, admin, uploadBlogImages, validateBlog, createBlog);
router.put("/:id", protect, admin, uploadBlogImages, validateBlog, updateBlog);
router.delete("/:id", protect, admin, deleteBlog);

export default router;