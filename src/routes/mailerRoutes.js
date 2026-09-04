import express from "express";
import transporter from "../config/mailer.js";

const mailRouter = express.Router();

mailRouter.post("/send-mail", async (req, res) => {
  const { to, subject, text } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Check your Mail!" });
  } catch (error) {
    res.status(500).json({ error: "Email not sent", details: error.message });
  }
});

export default mailRouter;
