import Faq from "../models/faq.js";
export const createFaq = async (req, res) => {
  try {
    const { question, answer, isActive } = req.body;

    if (!question || !answer) {
      return res
        .status(400)
        .json({ success: false, message: "Question and answer are required" });
    }

    const faq = await Faq.create({ question, answer, isActive });

    res.status(201).json({
      success: true,
      message: "FAQ created successfully",
      data: faq,
    });
  } catch (error) {
    console.error("Create FAQ error:", error);
    res.status(500).json({ success: false, message: "Failed to create FAQ" });
  }
};

export const getAllFaqs = async (req, res) => {
  try {
    const faqs = await Faq.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    console.error("Get FAQs error:", error);
    res.status(500).json({ success: false, message: "Failed to get FAQs" });
  }
};

export const getFaqById = async (req, res) => {
  try {
    const faq = await Faq.findById(req.params.id);

    if (!faq) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }

    res.status(200).json({
      success: true,
      data: faq,
    });
  } catch (error) {
    console.error("Get FAQ by ID error:", error);
    res.status(500).json({ success: false, message: "Failed to get FAQ" });
  }
};

export const updateFaq = async (req, res) => {
  try {
    const { question, answer, isActive } = req.body;

    const faq = await Faq.findByIdAndUpdate(
      req.params.id,
      { question, answer, isActive },
      { new: true, runValidators: true },
    );

    if (!faq) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }

    res.status(200).json({
      success: true,
      message: "FAQ updated successfully",
      data: faq,
    });
  } catch (error) {
    console.error("Update FAQ error:", error);
    res.status(500).json({ success: false, message: "Failed to update FAQ" });
  }
};

export const deleteFaq = async (req, res) => {
  try {
    const faq = await Faq.findByIdAndDelete(req.params.id);

    if (!faq) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }

    res.status(200).json({
      success: true,
      message: "FAQ deleted successfully",
    });
  } catch (error) {
    console.error("Delete FAQ error:", error);
    res.status(500).json({ success: false, message: "Failed to delete FAQ" });
  }
};
