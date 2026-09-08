import Testimonial from "../models/testimonial.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { uploadToCloudinary } from "../config/cloudinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createTestimonial = async function (req, res) {
  try {
    const {
      name,
      title,
      company,
      description,
      rating,
      order,
      isFeatured,
      status,
    } = req.body;

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToCloudinary(
        req.file.buffer,
        "rdeens/testimonials"
      );
    }
    const testimonial = await Testimonial.create({
      name,
      title,
      company,
      description,
      rating,
      order,
      isFeatured,
      status,
      image: imageUrl,
      createdBy: req.user.id,
    });
    return res.status(201).json({
      success: true,
      message: "Testimonial created successfully",
      data: testimonial,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getTestimonials = async function (req, res) {
  try {
    const testimonials = await Testimonial.find().populate(
      "createdBy",
      "name email",
    );
    return res.status(200).json({
      success: true,
      message: "Testimonials fetched successfully",
      data: testimonials,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getTestimonialById = async function (req, res) {
  try {
    const testimonial = await Testimonial.findById(req.params.id).populate(
      "createdBy",
      "name email",
    );
    return res.status(200).json({
      success: true,
      message: "Testimonial fetched successfully",
      data: testimonial,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      title,
      company,
      description,
      rating,
      order,
      isFeatured,
      status,
    } = req.body;

    const existingTestimonial = await Testimonial.findById(id);

    if (!existingTestimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    const updateData = {};

    // Update text fields if provided
    if (name) updateData.name = name;
    if (title) updateData.title = title;
    if (company !== undefined) updateData.company = company;
    if (description) updateData.description = description;
    if (rating) updateData.rating = parseInt(rating);
    if (order !== undefined) updateData.order = parseInt(order);
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured === "true";
    if (status) updateData.status = status;

    if (req.file) {
      updateData.image = await uploadToCloudinary(
        req.file.buffer,
        "rdeens/testimonials"
      );
    }

    const updatedTestimonial = await Testimonial.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    ).populate("createdBy", "name email");

    console.log(" Testimonial updated:", updatedTestimonial);

    return res.status(200).json({
      success: true,
      message: "Testimonial updated successfully",
      data: updatedTestimonial,
    });
  } catch (error) {
    console.error(" Update testimonial error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const deleteTestimonial = async function (req, res) {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Testimonial deleted successfully",
      data: testimonial,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
