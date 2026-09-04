import Contact from "../models/contact.js";

const submitContactForm = async (req, res) => {
  try {
    let { firstName, lastName, fullName, email, subject, company, phone, message, project } = req.body;

    // Handle fullName if separate firstName/lastName not provided
    if (!firstName && fullName) {
      const parts = fullName.trim().split(" ");
      firstName = parts[0] || "Anonymous";
      lastName = parts.slice(1).join(" ") || "";
    } else {
      if (!firstName) firstName = "Client";
      if (!lastName) lastName = "";
    }

    // Handle project field from CTA forms
    if (!message && project) {
      message = project;
    }

    if (!subject || subject.trim() === "") {
      subject = company ? `Project Proposal (${company})` : "General Inquiry";
    }

    const contact = await Contact.create({
      firstName,
      lastName,
      email: email.trim().toLowerCase(),
      company: company || "",
      phone: phone || "",
      subject,
      message,
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
    const contacts = await Contact.find().sort({ createdAt: -1 });
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
