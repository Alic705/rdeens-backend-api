import mongoose from "mongoose";

const careerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxLength: 120,
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    jobTitle: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    experience: {
      type: String,
      required: [true, "Years of experience is required"],
      trim: true,
    },
    currentRole: {
      type: String,
      trim: true,
      default: "",
    },
    portfolioUrl: {
      type: String,
      trim: true,
      default: "",
    },
    coverLetter: {
      type: String,
      trim: true,
      default: "",
    },
    resumeUrl: {
      type: String,
      required: [true, "Resume/CV file is required"],
      trim: true,
    },
    resumeOriginalName: {
      type: String,
      trim: true,
      default: "",
    },
    resumeMimeType: {
      type: String,
      trim: true,
      default: "",
    },
    resumeSizeBytes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["new", "reviewed", "shortlisted", "rejected", "hired"],
      default: "new",
    },
    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Index for search & quick admin sorting
careerSchema.index({ createdAt: -1 });
careerSchema.index({ status: 1 });
careerSchema.index({ jobTitle: 1 });

const Career = mongoose.model("Career", careerSchema);

export default Career;
