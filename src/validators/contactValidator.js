import Joi from "joi";

export const contactSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).required(),
  lastName: Joi.string().trim().min(1).max(100).required(),
  fullName: Joi.string().trim().min(1).max(200).optional(),
  email: Joi.string().trim().email().required(),
  company: Joi.string().allow("", null).max(150).optional(),
  phone: Joi.string().allow("", null).max(30).optional(),
  inquiryType: Joi.string().allow("", null).max(150).optional(),
  subject: Joi.string().allow("", null).max(150).optional(),
  message: Joi.string().min(2).max(5000).optional(),
  project: Joi.string().min(2).max(5000).optional(),
}).or("message", "project");

export const validateContact = (req, res, next) => {
  const { error } = contactSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map((err) => err.message);
    return res.status(400).json({ success: false, errors });
  }

  next();
};