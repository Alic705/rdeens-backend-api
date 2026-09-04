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

  tag: Joi.string()
    .required()
    .messages({
      "string.empty": "Tag is required",
    }),

  description: Joi.string()
    .required()
    .messages({
      "string.empty": "Description is required",
    }),

  coverImage: Joi.string().allow("", null).optional(),
  detailImage: Joi.string().allow("", null).optional(),

  checklists: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string()).max(5),
      Joi.string() // in case parsed from FormData string
    )
    .optional()
    .messages({
      "array.max": "Checklists cannot exceed 5 items",
    }),

  sectionTitle: Joi.string()
    .required()
    .messages({
      "string.empty": "Section title is required",
    }),

  sectionDescription: Joi.string()
    .required()
    .messages({
      "string.empty": "Section description is required",
    }),

  extraTitle: Joi.string().allow("", null).optional(),
  extraDescription: Joi.string().allow("", null).optional(),

  status: Joi.string().valid("draft", "published", "archived").default("published"),
  isFeatured: Joi.boolean().default(false),
  author: Joi.object().optional(),
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