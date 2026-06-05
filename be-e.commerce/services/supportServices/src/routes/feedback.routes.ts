import { Hono } from "hono";
import {
  createFeedbackController,
  listFeedbackController,
  updateFeedbackController,
} from "../controllers/feedback.controller";

const feedbackRoutes = new Hono();

feedbackRoutes.post("/", createFeedbackController);
feedbackRoutes.get("/", listFeedbackController);
feedbackRoutes.patch("/:id", updateFeedbackController);

export default feedbackRoutes;
