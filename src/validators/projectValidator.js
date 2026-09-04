import Joi from 'joi';

export const createProjectValidator = Joi.object({

  title: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Title is required',
      'string.min': 'Title must be at least 2 characters',
      'string.max': 'Title cannot exceed 100 characters'
    }),

  shortDescription: Joi.string()
    .trim()
    .min(10)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Short description is required',
      'string.min': 'Short description must be at least 10 characters',
      'string.max': 'Short description cannot exceed 200 characters'
    }),

  description: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Description is required'
    }),

  category: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.empty': 'Category is required',
      'string.pattern.base': 'Invalid category ID'
    }),

  status: Joi.string()
    .valid('draft', 'published')
    .default('draft'),

  isFeatured: Joi.boolean()
    .default(false),

  client: Joi.string()
    .trim()
    .max(100)
    .allow('', null),

  liveUrl: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow('', null)
    .messages({
      'string.uri': 'Live URL must be a valid http/https URL'
    }),

  technologies: Joi.array()
    .items(Joi.string().trim())
    .max(15)
    .default([])

});


export const validateProject = (req, res, next) => {
  const { error, value } = createProjectValidator.validate(req.body, {
    abortEarly: false,
    stripUnknown: true   
  });

  if (error) {
    const errors = error.details.map(err => err.message);
    return res.status(400).json({
      success: false,
      errors
    });
  }

  req.body = value; 
  next();
};