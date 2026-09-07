import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import connectDb from "./src/config/db.js";
import Category from "./src/models/Category.js";
import User from "./src/models/user.js";
import Blog from "./src/models/blog.js";
import Project from "./src/models/Project.js";
import ProjectCategory from "./src/models/ProjectCategory.js";

import Testimonial from "./src/models/testimonial.js";

import authRoutes from "./src/routes/authRoutes.js";
import blogRoutes from "./src/routes/blogRoutes.js";
import testimonialRoutes from "./src/routes/testimonialRoutes.js";
import contactRoutes from "./src/routes/contactRoutes.js";
import categoryRoutes from "./src/routes/categoryRoutes.js";
import projectRoutes from "./src/routes/projectRoutes.js";
import projectCategoryRoutes from "./src/routes/projectCategoryRoutes.js";
import mailRouter from "./src/routes/mailerRoutes.js";
import faqRoutes from "./src/routes/faqRoutes.js";

dotenv.config();
connectDb();

const app = express();
const PORT = process.env.PORT || 5001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = [
  "http://localhost:4200",
  "http://localhost:4001",
  "http://localhost:4000",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:4200",
  "http://127.0.0.1:4001",
  "http://127.0.0.1:4000",
  "http://127.0.0.1:3000",
  "https://rdeens.com",
  "https://www.rdeens.com",
];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^http:\/\/localhost(:\d+)?$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
        /\.vercel\.app$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in production for API clients
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["Content-Length", "Authorization"],
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "src", "uploads")));

// Health Check Routes
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Rdeens Backend API is running successfully.",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Rdeens REST API v1.0 operational.",
    endpoints: [
      "/api/blogs",
      "/api/contact",
      "/api/auth",
      "/api/testimonials",
      "/api/projects",
      "/api/categories",
      "/api/faqs",
    ],
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/project-categories", projectCategoryRoutes);
app.use("/api/mail", mailRouter);
app.use("/api/faqs", faqRoutes);

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, next) => {
  console.error(" Global Error:", err.stack);

  if (err.code === "LIMIT_FILE_SIZE" || err.code === "LIMIT_FIELD_VALUE") {
    return res.status(400).json({
      success: false,
      message: "File or content size too large. Max 25MB allowed.",
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "title";
    return res.status(400).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  if (err.message.includes("Only image files")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  });
});

export default app;
