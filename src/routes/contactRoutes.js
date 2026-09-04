import express from "express";
import { getAllContacts, submitContactForm } from "../controllers/contactController.js";
import { validateContact } from "../validators/contactValidator.js";

const router=express.Router();
router.post("/submit", validateContact, submitContactForm);
router.get("/all", getAllContacts);
export default router;