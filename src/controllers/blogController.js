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
  if (!baseSlug) {
    baseSlug = "post-" + Date.now();
  }
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
      content,
      excerpt,
      description,
      tag,
      tags,
      author,
      status,
      isFeatured,
      metaTitle,
      metaDescription,
      sectionTitle,
      sectionDescription,
      extraTitle,
      extraDescription,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // Process Checklists if provided
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

    // Process Tags if provided
    let parsedTags = [];
    if (Array.isArray(tags)) {
      parsedTags = tags;
    } else if (typeof tags === "string") {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    if (tag && !parsedTags.includes(tag.trim())) {
      parsedTags.unshift(tag.trim());
    }

    // Process Uploaded Files
    const files = req.files || {};
    let coverImage = req.body.coverImage || "";
    let detailImage = req.body.detailImage || "";

    if (files.coverImage && files.coverImage[0]) {
      coverImage = `/uploads/blogs/${files.coverImage[0].filename}`;
    } else if (files.thumbnail && files.thumbnail[0]) {
      coverImage = `/uploads/blogs/${files.thumbnail[0].filename}`;
    } else if (files.image && files.image[0]) {
      coverImage = `/uploads/blogs/${files.image[0].filename}`;
    } else if (files.file && files.file[0]) {
      coverImage = `/uploads/blogs/${files.file[0].filename}`;
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
      detailImage = coverImage;
    }

    // Normalized Excerpt & Description sync
    const finalExcerpt = (excerpt || description || "").trim();
    const finalDescription = (description || excerpt || "").trim();

    // Auto-synthesize rich content if only legacy sections provided
    let finalContent = (content || "").trim();
    if (!finalContent && (sectionDescription || sectionTitle)) {
      const parts = [];
      if (finalDescription) {
        parts.push(`<p class="lead-text">${finalDescription}</p>`);
      }
      if (checklists && checklists.length > 0) {
        parts.push(
          `<ul class="why-checklist">${checklists.map((c) => `<li>${c}</li>`).join("")}</ul>`
        );
      }
      if (sectionTitle) {
        parts.push(`<h2>${sectionTitle}</h2>`);
      }
      if (sectionDescription) {
        parts.push(`<p>${sectionDescription}</p>`);
      }
      if (detailImage && detailImage !== coverImage) {
        parts.push(`<img src="${detailImage}" alt="${sectionTitle || title}" />`);
      }
      if (extraTitle) {
        parts.push(`<h2>${extraTitle}</h2>`);
      }
      if (extraDescription) {
        parts.push(`<p>${extraDescription}</p>`);
      }
      finalContent = parts.join("\n");
    }

    const slug = await getUniqueSlug(title);

    // Author data formatting
    let authorData = {
      name: "Rdeens Team",
      role: "Rdeens Editorial Team",
      bio: "Published and managed by Rdeens Admin team. Delivering high quality technical insights and digital strategies.",
    };

    if (typeof author === "string" && author.trim()) {
      try {
        authorData = JSON.parse(author);
      } catch {
        authorData.name = author.trim();
      }
    } else if (author && typeof author === "object") {
      authorData = {
        name: author.name || "Rdeens Team",
        role: author.role || "Rdeens Editorial Team",
        bio: author.bio || authorData.bio,
      };
    } else if (req.user?.name) {
      authorData.name = req.user.name;
    }

    const blog = await Blog.create({
      title: title.trim(),
      slug,
      content: finalContent,
      excerpt: finalExcerpt,
      description: finalDescription,
      tag: (tag || parsedTags[0] || "Web Development").trim(),
      tags: parsedTags,
      coverImage,
      publishedDate: new Date(), // Strictly server-enforced timestamp
      author: authorData,
      status: status || "published",
      isFeatured: Boolean(isFeatured === true || isFeatured === "true"),
      metaTitle: (metaTitle || "").trim(),
      metaDescription: (metaDescription || "").trim(),

      // Legacy fields
      checklists,
      sectionTitle: (sectionTitle || "").trim(),
      sectionDescription: (sectionDescription || "").trim(),
      detailImage,
      extraTitle: (extraTitle || "").trim(),
      extraDescription: (extraDescription || "").trim(),
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
      filter.$or = [
        { tag: new RegExp(`^${tag}$`, "i") },
        { tags: new RegExp(`^${tag}$`, "i") },
      ];
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const blogs = await Blog.find(filter)
      .select("title slug tag tags excerpt description coverImage author publishedDate isFeatured createdAt")
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

    // Smart fallback: if requested slug doesn't exist, return latest published blog
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

    // Strictly protect publishedDate from being modified by client
    delete updateData.publishedDate;

    // Process Checklists if provided
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

    // Process Tags if provided
    if (updateData.tags && typeof updateData.tags === "string") {
      try {
        updateData.tags = JSON.parse(updateData.tags);
      } catch {
        updateData.tags = updateData.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    // Sync Excerpt & Description
    if (updateData.excerpt && !updateData.description) {
      updateData.description = updateData.excerpt;
    } else if (updateData.description && !updateData.excerpt) {
      updateData.excerpt = updateData.description;
    }

    // Process Files
    const files = req.files || {};
    if (files.coverImage && files.coverImage[0]) {
      updateData.coverImage = `/uploads/blogs/${files.coverImage[0].filename}`;
    } else if (files.thumbnail && files.thumbnail[0]) {
      updateData.coverImage = `/uploads/blogs/${files.thumbnail[0].filename}`;
    } else if (files.image && files.image[0]) {
      updateData.coverImage = `/uploads/blogs/${files.image[0].filename}`;
    } else if (files.file && files.file[0]) {
      updateData.coverImage = `/uploads/blogs/${files.file[0].filename}`;
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

    if (typeof updateData.author === "string" && updateData.author.trim()) {
      try {
        updateData.author = JSON.parse(updateData.author);
      } catch {
        updateData.author = { name: updateData.author.trim() };
      }
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

// 7. UPLOAD: Single Inline Image (Admin)
export const uploadInlineImage = async (req, res) => {
  try {
    const file = req.file || (req.files && (req.files.image?.[0] || req.files.upload?.[0] || req.files.file?.[0]));
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No image file uploaded",
      });
    }

    const imageUrl = `/uploads/blogs/${file.filename}`;
    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      url: imageUrl,
      location: imageUrl, // CKEditor / TinyMCE compatibility
    });
  } catch (error) {
    console.error("Upload inline image error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload image",
    });
  }
};
