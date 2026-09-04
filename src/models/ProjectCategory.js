import mongoose from "mongoose";

const projectCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
      maxlength: 50,
    },

    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      maxlength: 200,
      trim: true,
    },

    icon: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

projectCategorySchema.pre("save", async function () {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  }
});

const ProjectCategory =
  mongoose.models.ProjectCategory ||
  mongoose.model("ProjectCategory", projectCategorySchema);
export default ProjectCategory;
