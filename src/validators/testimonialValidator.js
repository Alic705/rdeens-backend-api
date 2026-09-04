import Joi from 'joi';

export const createTestimonialValidator = Joi.object({
  name: Joi.string()
    .required()
    .trim()
    .max(100)
    .messages({
      'string.empty': 'Name is required',
      'string.max': 'Name cannot exceed 100 characters'
    }),
  
  title: Joi.string()
    .required()
    .trim()
    .max(100)
    .messages({
      'string.empty': 'Title is required',
      'string.max': 'Title cannot exceed 100 characters'
    }),
  
  company: Joi.string()
    .trim()
    .max(100)
    .allow('', null)
    .messages({
      'string.max': 'Company cannot exceed 100 characters'
    }),
  
  description: Joi.string()
    .required()
    .trim()
    .min(10)
    .max(1000)
    .messages({
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 1000 characters'
    }),
  
  rating: Joi.number()
    .required()
    .min(1)
    .max(5)
    .messages({
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating cannot be more than 5'
    }),
  
  order: Joi.number()
    .default(0),
  
  isFeatured: Joi.boolean()
    .default(false),
  
  status: Joi.string()
    .valid('draft', 'published', 'archived')
    .default('published')
});

export const validateTestimonial = (req, res, next) => {
  const { error } = createTestimonialValidator.validate(req.body, { 
    abortEarly: false 
  });
  
  if (error) {
    const errors = error.details.map(err => err.message);
    return res.status(400).json({ 
      success: false, 
      errors 
    });
  }
  
  next();
};