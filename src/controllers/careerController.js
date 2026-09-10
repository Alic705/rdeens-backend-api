import Career from "../models/career.js";
import { saveResumeFile } from "../middleware/careerUpload.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Submit Job Application (Public)
export const submitApplication = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      jobTitle,
      department,
      experience,
      currentRole,
      portfolioUrl,
      coverLetter,
    } = req.body;

    // Validation
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: "Full name is required" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email address is required" });
    }
    if (!jobTitle || !jobTitle.trim()) {
      return res.status(400).json({ success: false, message: "Job title is required" });
    }
    if (!experience || !experience.trim()) {
      return res.status(400).json({ success: false, message: "Experience level is required" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Resume/CV file is required" });
    }

    // Process file upload
    const resumeUrl = await saveResumeFile(req.file);

    const application = await Career.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || "").trim(),
      jobTitle: jobTitle.trim(),
      department: (department || "").trim(),
      experience: experience.trim(),
      currentRole: (currentRole || "").trim(),
      portfolioUrl: (portfolioUrl || "").trim(),
      coverLetter: (coverLetter || "").trim(),
      resumeUrl,
      resumeOriginalName: req.file.originalname,
      resumeMimeType: req.file.mimetype,
      resumeSizeBytes: req.file.size,
      status: "new",
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully! Our HR team will review your CV shortly.",
      data: {
        id: application._id,
        fullName: application.fullName,
        jobTitle: application.jobTitle,
        submittedAt: application.createdAt,
      },
    });
  } catch (error) {
    console.error("Career application submission error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit job application. Please try again.",
    });
  }
};

// 2. Get All Applications (Admin)
export const getAllApplications = async (req, res) => {
  try {
    const { status, jobTitle, search } = req.query;

    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (jobTitle && jobTitle !== "all") {
      filter.jobTitle = jobTitle;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { currentRole: searchRegex },
        { jobTitle: searchRegex },
      ];
    }

    const applications = await Career.find(filter).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.error("Fetch applications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job applications",
    });
  }
};

// 3. Get Single Application by ID (Admin)
export const getApplicationById = async (req, res) => {
  try {
    const application = await Career.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("Fetch application by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch application details",
    });
  }
};

// 4. Update Application Status & Admin Notes (Admin)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const updateFields = {};
    if (status) {
      const validStatuses = ["new", "reviewed", "shortlisted", "rejected", "hired"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value" });
      }
      updateFields.status = status;
    }

    if (adminNotes !== undefined) {
      updateFields.adminNotes = adminNotes;
    }

    const updatedApp = await Career.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedApp) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    res.status(200).json({
      success: true,
      message: "Application updated successfully",
      data: updatedApp,
    });
  } catch (error) {
    console.error("Update application status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update application",
    });
  }
};

// 5. Delete Application (Admin)
export const deleteApplication = async (req, res) => {
  try {
    const application = await Career.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    // Delete local resume file if applicable
    if (application.resumeUrl && application.resumeUrl.startsWith("/uploads/resumes/")) {
      const localPath = path.join(__dirname, "..", application.resumeUrl);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }

    await Career.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Delete application error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete application",
    });
  }
};

// 6. Direct Download Resume File (Admin)
export const viewResumeFile = async (req, res) => {
  try {
    const { filename } = req.params;

    // Security: Path traversal protection
    const safeFilename = path.basename(filename);
    const filePath = path.join(__dirname, "..", "uploads", "resumes", safeFilename);

    if (fs.existsSync(filePath)) {
      const downloadName = req.query.name || safeFilename;
      return res.download(filePath, downloadName);
    }

    // If file doesn't exist locally (e.g. Vercel deployment), lookup application by ID or filename in DB
    const app = await Career.findOne({
      $or: [
        { resumeUrl: new RegExp(safeFilename, "i") },
        { resumeUrl: { $regex: safeFilename } }
      ]
    }).lean();

    if (app && app.resumeUrl) {
      // 1. Base64 Data URI stored on Vercel
      if (app.resumeUrl.startsWith("data:")) {
        const matches = app.resumeUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1] || "application/pdf";
          const buffer = Buffer.from(matches[2], "base64");
          const downloadName = app.resumeOriginalName || safeFilename;

          res.setHeader("Content-Type", mimeType);
          res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
          return res.send(buffer);
        }
      }

      // 2. Remote / Cloudinary URL
      if (app.resumeUrl.startsWith("http://") || app.resumeUrl.startsWith("https://")) {
        let targetUrl = app.resumeUrl;
        // Fix for Cloudinary PDF URLs uploaded under /image/upload/ -> convert to /raw/upload/
        if (targetUrl.includes("cloudinary.com") && targetUrl.includes("/image/upload/")) {
          targetUrl = targetUrl.replace("/image/upload/", "/raw/upload/");
        }
        return res.redirect(targetUrl);
      }
    }

    res.status(404).json({
      success: false,
      message: "Resume file not found.",
    });
  } catch (error) {
    console.error("Download resume file error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download resume file",
    });
  }
};
