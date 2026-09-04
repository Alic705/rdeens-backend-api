import Project from "../models/Project.js";
import sanitizeHtml from "sanitize-html";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sanitizeContent = (html) => {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "b",
      "i",
      "img",
      "h1",
      "h2",
      "h3",
      "ul",
      "li",
      "ol",
      "br",
    ],
    allowedAttributes: { img: ["src", "alt", "class"] },
    allowedSchemes: ["http", "https"],
  });
};

// CREATE
export const createProject = async (req, res) => {
  try {
    const {
      title,
      shortDescription,
      description,
      category,
      status,
      isFeatured,
      client,
      liveUrl,
      technologies,
    } = req.body;

    const files = req.files || {};

    if (!files.thumbnail?.[0]) {
      return res.status(400).json({
        success: false,
        message: "Thumbnail is required",
      });
    }

    const thumbnailFile = files.thumbnail[0];
    const imageFiles = files.images || [];

    const project = await Project.create({
      title,
      shortDescription,
      description: sanitizeContent(description),
      thumbnail: `/uploads/projects/${thumbnailFile.filename}`,
      images: imageFiles.map((file) => `/uploads/projects/${file.filename}`),
      category,
      status,
      isFeatured,
      client,
      liveUrl,
      technologies,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create project",
    });
  }
};

export const getProjectBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const project = await Project.findOne({ slug })
      .populate("category", "name slug")
      .populate("createdBy", "name email");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await project.save({ validateBeforeSave: false });

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error(" Get project error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch project",
    });
  }
};

// GET ALL
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("category", "name slug")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
};

//  UPDATE
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.description) {
      updateData.description = sanitizeContent(updateData.description);
    }

    const files = req.files || {};
    const thumbnailFile = files.thumbnail?.[0];
    const imageFiles = files.images || [];

    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (thumbnailFile) {
      if (existingProject.thumbnail) {
        const oldPath = path.join(__dirname, "..", existingProject.thumbnail);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      updateData.thumbnail = `/uploads/projects/${thumbnailFile.filename}`;
    }

    if (imageFiles.length > 0) {
      existingProject.images.forEach((img) => {
        const imgPath = path.join(__dirname, "..", img);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      });

      updateData.images = imageFiles.map(
        (file) => `/uploads/projects/${file.filename}`,
      );
    }

    const updatedProject = await Project.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update project",
    });
  }
};

//  DELETE
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.thumbnail) {
      const thumbPath = path.join(__dirname, "..", project.thumbnail);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    }

    if (project.images?.length) {
      project.images.forEach((img) => {
        const imgPath = path.join(__dirname, "..", img);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      });
    }

    await Project.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete project",
    });
  }
};
