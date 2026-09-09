import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
      minLength: 1,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxLength: 100,
      minLength: 1,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    company: {
      type: String,
      trim: true,
      default: "",
    },
    inquiryType: {
      type: String,
      trim: true,
      default: "General Inquiry",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    subject: {
      type: String,
      required: true,
      default: "General Inquiry",
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["new", "read", "archived"],
      default: "new",
    },
  },
  {
    timestamps: true,
  }
);

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;