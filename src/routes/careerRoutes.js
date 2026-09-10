import express from "express";
import {
  submitApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
  viewResumeFile,
} from "../controllers/careerController.js";
import { uploadCareerCv } from "../middleware/careerUpload.js";

const router = express.Router();

// Public route for job applicants
router.post("/apply", uploadCareerCv.single("cvFile"), submitApplication);

// Secure Resume File Viewer (Inline Preview)
router.get("/resume/:filename", viewResumeFile);

// Admin routes for managing job applications/queries
router.get("/", getAllApplications);
router.get("/:id", getApplicationById);
router.patch("/:id/status", updateApplicationStatus);
router.delete("/:id", deleteApplication);

export default router;
