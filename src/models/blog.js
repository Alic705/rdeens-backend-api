import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
      minlength: [2, "Title must be at least 2 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    content: {
      type: String,
      default: "", // Arbitrary length rich HTML (h2, h3, paragraphs, bold, italic, links, checklists, inline images)
    },
    excerpt: {
      type: String,
      default: "",
      trim: true,
    },
    tag: {
      type: String,
      trim: true,
      default: "Web Development",
    },
    tags: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    coverImage: {
      type: String,
      required: [true, "Cover image is required"],
      trim: true,
    },
    publishedDate: {
      type: Date,
      default: Date.now,
      immutable: true, // Backend forces system date; cannot be overwritten by client updates
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    author: {
      name: { type: String, default: "Rdeens Team" },
      role: { type: String, default: "Rdeens Editorial Team" },
      bio: {
        type: String,
        default:
          "Published and managed by Rdeens Admin team. Delivering high quality technical insights and digital strategies.",
      },
    },
    metaTitle: {
      type: String,
      default: "",
      trim: true,
    },
    metaDescription: {
      type: String,
      default: "",
      trim: true,
    },

    // Legacy fields preserved for backward compatibility
    checklists: {
      type: [String],
      default: [],
    },
    sectionTitle: {
      type: String,
      default: "",
      trim: true,
    },
    sectionDescription: {
      type: String,
      default: "",
      trim: true,
    },
    detailImage: {
      type: String,
      default: "",
      trim: true,
    },
    extraTitle: {
      type: String,
      default: "",
      trim: true,
    },
    extraDescription: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto slug generator function
export function generateSlug(title) {
  return (title || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Auto slug generation before validation
blogSchema.pre("validate", function () {
  if (this.title && !this.slug) {
    this.slug = generateSlug(this.title);
  }
});

blogSchema.index({ status: 1, publishedDate: -1 });
blogSchema.index({ tag: 1 });

const Blog = mongoose.models.Blog || mongoose.model("Blog", blogSchema);
export default Blog;