import { Hono } from "hono";
import {
  handleGetRecommendations,
  handleGetRecentRecommendations,
  handleAddRecommendation,
  handleLoadMoreRecommendations,
} from "../controllers/redis.controller";

const router = new Hono();

router.get("/recommendations/:userId", handleGetRecommendations);
router.get("/recommendations/:userId/load-more", handleLoadMoreRecommendations);
router.get("/recommendations-recent/:userId", handleGetRecentRecommendations);
router.post("/recommendations/:userId", handleAddRecommendation);

export default router;
