import express from "express";
import {
  createFaq,
  getAllFaqs,
  getFaqById,
  updateFaq,
  deleteFaq
} from "../controllers/faqController.js";

const router = express.Router();

router.route("/")
  .get(getAllFaqs)
  .post(createFaq);

router.route("/:id")
  .get(getFaqById)
  .put(updateFaq)
  .delete(deleteFaq);

export default router;
