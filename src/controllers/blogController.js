import mongoose from "mongoose";
import Blog, { generateSlug } from "../models/blog.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to ensure unique slug
async function getUniqueSlug(baseTitle, existingId = null) {
  let baseSlug = generateSlug(baseTitle);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (existingId) {
      query._id = { $ne: existingId };
    }
    const exists = await Blog.findOne(query);
    if (!exists) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

// 1. CREATE: New Blog (Admin)
export const createBlog = async (req, res) => {
  try {
    const {
      title,
      tag,
      description,
      sectionTitle,
      sectionDescription,
      extraTitle,
      extraDescription,
      status,
      isFeatured,
    } = req.body;

    let checklists = req.body.checklists || [];
    if (typeof checklists === "string") {
      try {
        checklists = JSON.parse(checklists);
      } catch {
        checklists = checklists
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    if (checklists.length > 5) {
      return res.status(400).json({
        success: false,
        message: "Checklists cannot exceed 5 items",
      });
    }

    const files = req.files || {};
    let coverImage = req.body.coverImage || "";
    let detailImage = req.body.detailImage || "";

    if (files.coverImage && files.coverImage[0]) {
      coverImage = `/uploads/blogs/${files.coverImage[0].filename}`;
    } else if (files.thumbnail && files.thumbnail[0]) {
      coverImage = `/uploads/blogs/${files.thumbnail[0].filename}`;
    }

    if (files.detailImage && files.detailImage[0]) {
      detailImage = `/uploads/blogs/${files.detailImage[0].filename}`;
    } else if (files.images && files.images[0]) {
      detailImage = `/uploads/blogs/${files.images[0].filename}`;
    }

    if (!coverImage) {
      return res.status(400).json({
        success: false,
        message: "Cover image is required",
      });
    }

    if (!detailImage) {
      detailImage = coverImage; // Fallback to cover image if detail image not uploaded separately
    }

    const slug = await getUniqueSlug(title);

    const authorData = {
      name: req.user?.name || "Super Admin",
      role: "Rdeens Editorial Team",
      bio: "Published and managed by Rdeens Admin team. Delivering high quality technical insights and digital strategies.",
    };

    const blog = await Blog.create({
      title: title.trim(),
      slug,
      tag: tag.trim(),
      description: description.trim(),
      coverImage,
      publishedDate: new Date(), // Server forces current timestamp (immutable)
      checklists,
      sectionTitle: sectionTitle.trim(),
      sectionDescription: sectionDescription.trim(),
      detailImage,
      extraTitle: (extraTitle || "").trim(),
      extraDescription: (extraDescription || "").trim(),
      author: authorData,
      status: status || "published",
      isFeatured: Boolean(isFeatured),
    });

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Create blog error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create blog",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// 2. GET: Public Published Blogs Listing
export const getBlogs = async (req, res) => {
  try {
    const { tag, search } = req.query;
    const filter = { status: "published" };

    if (tag && tag !== "All") {
      filter.tag = new RegExp(`^${tag}$`, "i");
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const blogs = await Blog.find(filter)
      .select("title slug tag description coverImage publishedDate checklists isFeatured createdAt")
      .sort({ publishedDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs,
    });
  } catch (error) {
    console.error("Get blogs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
    });
  }
};

// 3. GET: Single Blog Detail by Slug (Public)
export const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    let blog = null;

    if (slug) {
      blog = await Blog.findOne({ slug: new RegExp(`^${slug}$`, "i") });
      if (!blog && mongoose.Types.ObjectId.isValid(slug)) {
        blog = await Blog.findById(slug);
      }
    }

    // Smart fallback: if requested slug doesn't exist (e.g. old legacy link), return the latest published blog
    if (!blog) {
      blog = await Blog.findOne({ status: "published" }).sort({ publishedDate: -1, createdAt: -1 });
    }

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error("Get blog by slug error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
    });
  }
};

// 4. GET: All Blogs for Admin Table
export const getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs,
    });
  } catch (error) {
    console.error("Get all blogs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all blogs",
    });
  }
};

// 5. UPDATE: Blog by ID (Admin)
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.checklists && typeof updateData.checklists === "string") {
      try {
        updateData.checklists = JSON.parse(updateData.checklists);
      } catch {
        updateData.checklists = updateData.checklists
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    if (updateData.checklists && updateData.checklists.length > 5) {
      return res.status(400).json({
        success: false,
        message: "Checklists cannot exceed 5 items",
      });
    }

    // Delete publishedDate from updateData so it cannot be tampered with
    delete updateData.publishedDate;

    const files = req.files || {};
    if (files.coverImage && files.coverImage[0]) {
      updateData.coverImage = `/uploads/blogs/${files.coverImage[0].filename}`;
    } else if (files.thumbnail && files.thumbnail[0]) {
      updateData.coverImage = `/uploads/blogs/${files.thumbnail[0].filename}`;
    }

    if (files.detailImage && files.detailImage[0]) {
      updateData.detailImage = `/uploads/blogs/${files.detailImage[0].filename}`;
    } else if (files.images && files.images[0]) {
      updateData.detailImage = `/uploads/blogs/${files.images[0].filename}`;
    }

    if (typeof updateData.isFeatured !== "undefined") {
      updateData.isFeatured = updateData.isFeatured === true || updateData.isFeatured === "true";
    }

    if (updateData.title) {
      updateData.slug = await getUniqueSlug(updateData.title, id);
    }

    const blog = await Blog.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Update blog error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update blog",
    });
  }
};

// 6. DELETE: Blog by ID (Admin)
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Clean up uploaded images if local
    [blog.coverImage, blog.detailImage].forEach((imgPath) => {
      if (imgPath && imgPath.startsWith("/uploads/blogs/")) {
        const fullPath = path.join(__dirname, "..", imgPath);
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
          } catch (e) {
            console.warn("Could not remove file:", fullPath);
          }
        }
      }
    });

    await Blog.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error("Delete blog error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete blog",
    });
  }
};
