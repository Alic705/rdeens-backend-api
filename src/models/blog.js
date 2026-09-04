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
    tag: {
      type: String,
      required: [true, "Tag is required"],
      trim: true,
      default: "Web Development",
    },
    description: {
      type: String,
      required: [true, "Description is required"],
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
    checklists: {
      type: [String],
      default: [],
      validate: [
        (val) => !val || val.length <= 5,
        "Checklists cannot exceed 5 items",
      ],
    },
    sectionTitle: {
      type: String,
      required: [true, "Section title is required"],
      trim: true,
    },
    sectionDescription: {
      type: String,
      required: [true, "Section description is required"],
      trim: true,
    },
    detailImage: {
      type: String,
      required: [true, "Detail image is required"],
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
    author: {
      name: { type: String, default: "Super Admin" },
      role: { type: String, default: "Rdeens Editorial Team" },
      bio: {
        type: String,
        default:
          "Published and managed by Rdeens Admin team. Delivering high quality technical insights and digital strategies.",
      },
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
  if (this.title && (!this.slug || this.isModified("title"))) {
    this.slug = generateSlug(this.title);
  }
});

blogSchema.index({ status: 1, publishedDate: -1 });
blogSchema.index({ tag: 1 });

const Blog = mongoose.models.Blog || mongoose.model("Blog", blogSchema);
export default Blog;