import { Hono } from "hono";
import {
  addActivityController,
  flushActivityController,
  getQueueStatusController,
  getActivityHistoryController,
  getRecentActivitiesController,
  clearActivityController,
} from "../controllers/activity.controller";
import { validateActivity } from "../middleware/validate.middleware";

const activityRoutes = new Hono();

activityRoutes.post("/", validateActivity, addActivityController);
activityRoutes.post("/flush/:userId", flushActivityController);
activityRoutes.get("/queue/:userId", getQueueStatusController);
activityRoutes.get("/history/:userId", getActivityHistoryController);
activityRoutes.get("/recent/:userId", getRecentActivitiesController);
activityRoutes.delete("/queue/:userId", clearActivityController);

export default activityRoutes;
