import mongoose from "mongoose";
import Blog, { generateSlug } from "../models/blog.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { uploadToCloudinary, uploadBase64ToCloudinary } from "../config/cloudinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to ensure unique slug (fast-path index check with zero overhead)
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
    const exists = await Blog.exists(query);
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

    const handleUpload = async (fileArray) => {
      if (fileArray && fileArray.length > 0) {
        return await uploadToCloudinary(
          fileArray[0].buffer,
          "rdeens/blogs"
        );
      }
      return null;
    };

    if (files.coverImage) {
      coverImage = await handleUpload(files.coverImage);
    } else if (files.thumbnail) {
      coverImage = await handleUpload(files.thumbnail);
    } else if (files.image) {
      coverImage = await handleUpload(files.image);
    } else if (files.file) {
      coverImage = await handleUpload(files.file);
    } else if (coverImage && coverImage.startsWith("data:image/")) {
      coverImage = (await uploadBase64ToCloudinary(coverImage, "rdeens/blogs")) || coverImage;
    }

    if (files.detailImage) {
      detailImage = await handleUpload(files.detailImage);
    } else if (files.images) {
      detailImage = await handleUpload(files.images);
    } else if (detailImage && detailImage.startsWith("data:image/")) {
      detailImage = (await uploadBase64ToCloudinary(detailImage, "rdeens/blogs")) || detailImage;
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

    const formattedBlog = formatBlogListItem(blog);

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: formattedBlog,
    });
  } catch (error) {
    console.error("Create blog error:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || "title";
      return res.status(400).json({
        success: false,
        message: `A blog with this ${field} already exists. Please choose a different title.`,
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(e => e.message).join(", "),
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create blog",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Helper to normalize blog image URLs so raw base64 is never bloated in JSON payloads
export function formatBlogListItem(b) {
  if (!b) return b;
  const blogObj = b.toObject ? b.toObject() : { ...b };
  if (blogObj.coverImage && blogObj.coverImage.startsWith("data:image/")) {
    blogObj.coverImage = `/api/blogs/image/${blogObj._id}?type=cover`;
  }
  if (blogObj.detailImage && blogObj.detailImage.startsWith("data:image/")) {
    blogObj.detailImage = `/api/blogs/image/${blogObj._id}?type=detail`;
  }
  return blogObj;
}

// 2. GET: Public Published Blogs Listing (Ultra-fast projection: zero heavy base64 over wire)
export const getBlogs = async (req, res) => {
  try {
    const { tag, search } = req.query;
    const matchStage = { status: "published" };

    if (tag && tag !== "All") {
      matchStage.$or = [
        { tag: new RegExp(`^${tag}$`, "i") },
        { tags: new RegExp(`^${tag}$`, "i") },
      ];
    }

    if (search) {
      matchStage.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const blogs = await Blog.aggregate([
      { $match: matchStage },
      { $sort: { publishedDate: -1, createdAt: -1 } },
      {
        $project: {
          title: 1,
          slug: 1,
          tag: 1,
          tags: 1,
          excerpt: 1,
          description: 1,
          author: 1,
          status: 1,
          isFeatured: 1,
          publishedDate: 1,
          createdAt: 1,
          updatedAt: 1,
          coverImage: {
            $cond: {
              if: {
                $and: [
                  { $ne: ["$coverImage", null] },
                  { $ne: ["$coverImage", ""] },
                  { $eq: [{ $substrCP: [{ $ifNull: ["$coverImage", ""] }, 0, 10] }, "data:image"] }
                ]
              },
              then: { $concat: ["/api/blogs/image/", { $toString: "$_id" }, "?type=cover"] },
              else: { $ifNull: ["$coverImage", ""] }
            }
          },
          detailImage: {
            $cond: {
              if: {
                $and: [
                  { $ne: ["$detailImage", null] },
                  { $ne: ["$detailImage", ""] },
                  { $eq: [{ $substrCP: [{ $ifNull: ["$detailImage", ""] }, 0, 10] }, "data:image"] }
                ]
              },
              then: { $concat: ["/api/blogs/image/", { $toString: "$_id" }, "?type=detail"] },
              else: { $ifNull: ["$detailImage", ""] }
            }
          }
        }
      }
    ]);

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

// 3. GET: Single Blog Detail by Slug / ID (Public & Admin Edit - Ultra-fast Projection)
export const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    let matchStage = null;

    if (slug) {
      if (mongoose.Types.ObjectId.isValid(slug)) {
        matchStage = { _id: new mongoose.Types.ObjectId(slug) };
      } else {
        matchStage = { slug: slug.toLowerCase() };
      }
    }

    const projectionStage = {
      $project: {
        title: 1,
        slug: 1,
        content: 1,
        excerpt: 1,
        description: 1,
        tag: 1,
        tags: 1,
        author: 1,
        status: 1,
        isFeatured: 1,
        metaTitle: 1,
        metaDescription: 1,
        checklists: 1,
        sectionTitle: 1,
        sectionDescription: 1,
        extraTitle: 1,
        extraDescription: 1,
        publishedDate: 1,
        createdAt: 1,
        updatedAt: 1,
        coverImage: {
          $cond: {
            if: {
              $and: [
                { $ne: ["$coverImage", null] },
                { $ne: ["$coverImage", ""] },
                { $eq: [{ $substrCP: [{ $ifNull: ["$coverImage", ""] }, 0, 10] }, "data:image"] }
              ]
            },
            then: { $concat: ["/api/blogs/image/", { $toString: "$_id" }, "?type=cover"] },
            else: { $ifNull: ["$coverImage", ""] }
          }
        },
        detailImage: {
          $cond: {
            if: {
              $and: [
                { $ne: ["$detailImage", null] },
                { $ne: ["$detailImage", ""] },
                { $eq: [{ $substrCP: [{ $ifNull: ["$detailImage", ""] }, 0, 10] }, "data:image"] }
              ]
            },
            then: { $concat: ["/api/blogs/image/", { $toString: "$_id" }, "?type=detail"] },
            else: { $ifNull: ["$detailImage", ""] }
          }
        }
      }
    };

    let blog = null;
    if (matchStage) {
      const results = await Blog.aggregate([
        { $match: matchStage },
        projectionStage,
        { $limit: 1 }
      ]);
      blog = results[0] || null;

      // If exact slug didn't match and it wasn't an ObjectId, try case-insensitive regex
      if (!blog && !mongoose.Types.ObjectId.isValid(slug)) {
        const regexResults = await Blog.aggregate([
          { $match: { slug: new RegExp(`^${slug}$`, "i") } },
          projectionStage,
          { $limit: 1 }
        ]);
        blog = regexResults[0] || null;
      }
    }

    // Smart fallback: if requested slug doesn't exist, return latest published blog
    if (!blog) {
      const fallbackResults = await Blog.aggregate([
        { $match: { status: "published" } },
        { $sort: { publishedDate: -1, createdAt: -1 } },
        projectionStage,
        { $limit: 1 }
      ]);
      blog = fallbackResults[0] || null;
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

// 4. GET: All Blogs for Admin Table (Ultra-fast projection: zero heavy content over wire)
export const getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await Blog.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $project: {
          title: 1,
          slug: 1,
          tag: 1,
          tags: 1,
          status: 1,
          isFeatured: 1,
          publishedDate: 1,
          createdAt: 1,
          updatedAt: 1,
          coverImage: {
            $cond: {
              if: {
                $and: [
                  { $ne: ["$coverImage", null] },
                  { $ne: ["$coverImage", ""] },
                  { $eq: [{ $substrCP: [{ $ifNull: ["$coverImage", ""] }, 0, 10] }, "data:image"] }
                ]
              },
              then: { $concat: ["/api/blogs/image/", { $toString: "$_id" }, "?type=cover"] },
              else: { $ifNull: ["$coverImage", ""] }
            }
          }
        }
      }
    ]);

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

// Dedicated Binary Stream Image Endpoint with Caching (Zero JSON Bloat)
export const serveBlogImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send("Invalid blog ID");
    }

    const blog = await Blog.findById(id).select("coverImage detailImage").lean();
    if (!blog) {
      return res.status(404).send("Blog not found");
    }

    const imageField = type === "detail" ? blog.detailImage : (blog.coverImage || blog.detailImage);
    if (!imageField) {
      return res.status(404).send("Image not found");
    }

    // 1. If base64 data URL
    if (imageField.startsWith("data:image/")) {
      const matches = imageField.match(/^data:([a-zA-Z0-9\/+-]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");

        res.set("Content-Type", mimeType);
        res.set("Content-Length", buffer.length);
        res.set("Cache-Control", "public, max-age=31536000, immutable");
        return res.send(buffer);
      }
    }

    // 2. If full external URL, redirect
    if (imageField.startsWith("http://") || imageField.startsWith("https://")) {
      return res.redirect(imageField);
    }

    // 3. If local file path, send file if exists on disk
    const cleanPath = imageField.startsWith("/") ? imageField.slice(1) : imageField;
    const fullPath = path.join(__dirname, "../../", cleanPath);
    if (fs.existsSync(fullPath)) {
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      return res.sendFile(fullPath);
    }

    // Default Fallback
    return res.redirect("/assets/images/img/blog-ai.webp");
  } catch (error) {
    console.error("Serve blog image error:", error);
    res.status(500).send("Internal Server Error");
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
    
    const handleUpload = async (fileArray) => {
      if (fileArray && fileArray.length > 0) {
        return await uploadToCloudinary(
          fileArray[0].buffer,
          "rdeens/blogs"
        );
      }
      return null;
    };

    if (files.coverImage) {
      updateData.coverImage = await handleUpload(files.coverImage);
    } else if (files.thumbnail) {
      updateData.coverImage = await handleUpload(files.thumbnail);
    } else if (files.image) {
      updateData.coverImage = await handleUpload(files.image);
    } else if (files.file) {
      updateData.coverImage = await handleUpload(files.file);
    } else if (updateData.coverImage && updateData.coverImage.startsWith("data:image/")) {
      updateData.coverImage = (await uploadBase64ToCloudinary(updateData.coverImage, "rdeens/blogs")) || updateData.coverImage;
    }

    if (files.detailImage) {
      updateData.detailImage = await handleUpload(files.detailImage);
    } else if (files.images) {
      updateData.detailImage = await handleUpload(files.images);
    } else if (updateData.detailImage && updateData.detailImage.startsWith("data:image/")) {
      updateData.detailImage = (await uploadBase64ToCloudinary(updateData.detailImage, "rdeens/blogs")) || updateData.detailImage;
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
    })
      .select("-__v")
      .lean();

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const formattedBlog = formatBlogListItem(blog);

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: formattedBlog,
    });
  } catch (error) {
    console.error("Update blog error:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || "title";
      return res.status(400).json({
        success: false,
        message: `A blog with this ${field} already exists. Please choose a different title.`,
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(e => e.message).join(", "),
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update blog",
    });
  }
};

// 6. DELETE: Blog by ID (Admin)
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id).select("coverImage detailImage").lean();

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
    if (req.file) {
      const imageUrl = await uploadToCloudinary(
        req.file.buffer,
        "rdeens/blogs/content"
      );

      res.status(200).json({
        success: true,
        url: imageUrl, // Return Cloudinary URL
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "No image file uploaded",
      });
    }
  } catch (error) {
    console.error("Upload inline image error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload image",
    });
  }
};
