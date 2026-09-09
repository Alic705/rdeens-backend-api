import Contact from "../models/contact.js";

const submitContactForm = async (req, res) => {
  try {
    let { firstName, lastName, email, subject, company, phone, inquiryType, message, project } = req.body;

    firstName = (firstName || "").trim();
    lastName = (lastName || "").trim();

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "Both first name and last name are required",
      });
    }

    // Handle project field from CTA forms
    if (!message && project) {
      message = project;
    }

    if (!subject || subject.trim() === "") {
      subject = inquiryType ? `Project Proposal (${inquiryType})` : "General Inquiry";
    }

    const contact = await Contact.create({
      firstName,
      lastName,
      email: email.trim().toLowerCase(),
      company: (company || "").trim(),
      phone: (phone || "").trim(),
      inquiryType: inquiryType || "General Inquiry",
      subject,
      message: (message || "").trim(),
      status: "new",
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully! We will contact you soon.",
      data: {
        id: contact._id,
        submittedAt: contact.createdAt,
      },
    });
  } catch (error) {
    console.error("Contact submission error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    console.error("Contact fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get contacts. Please try again later.",
    });
  }
};

export { submitContactForm, getAllContacts };
