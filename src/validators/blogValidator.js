import Joi from "joi";

export const createBlogValidator = Joi.object({
  title: Joi.string()
    .required()
    .min(2)
    .max(120)
    .messages({
      "string.empty": "Title is required",
      "string.min": "Title must be at least 2 characters",
      "string.max": "Title cannot exceed 120 characters",
    }),

  slug: Joi.string().allow("", null).optional(),

  content: Joi.string().allow("", null).optional(),

  excerpt: Joi.string().allow("", null).optional(),

  description: Joi.string().allow("", null).optional(),

  tag: Joi.string().allow("", null).optional(),

  tags: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string()),
      Joi.string()
    )
    .optional(),

  coverImage: Joi.string().allow("", null).optional(),
  detailImage: Joi.string().allow("", null).optional(),

  checklists: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string()),
      Joi.string()
    )
    .optional(),

  sectionTitle: Joi.string().allow("", null).optional(),
  sectionDescription: Joi.string().allow("", null).optional(),
  extraTitle: Joi.string().allow("", null).optional(),
  extraDescription: Joi.string().allow("", null).optional(),

  status: Joi.string().valid("draft", "published", "archived").default("published"),
  isFeatured: Joi.alternatives().try(Joi.boolean(), Joi.string()).default(false),
  author: Joi.alternatives().try(Joi.object(), Joi.string()).optional(),

  metaTitle: Joi.string().allow("", null).optional(),
  metaDescription: Joi.string().allow("", null).optional(),
});

export const validateBlog = (req, res, next) => {
  // If checklists is passed as JSON string in FormData, parse it
  if (typeof req.body.checklists === "string") {
    try {
      req.body.checklists = JSON.parse(req.body.checklists);
    } catch {
      req.body.checklists = req.body.checklists
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  // If tags is passed as JSON string in FormData, parse it
  if (typeof req.body.tags === "string") {
    try {
      req.body.tags = JSON.parse(req.body.tags);
    } catch {
      req.body.tags = req.body.tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  const { error } = createBlogValidator.validate(req.body, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    const errors = error.details.map((err) => err.message);
    return res.status(400).json({
      success: false,
      errors,
    });
  }

  next();
};