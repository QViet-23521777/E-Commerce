import { Hono } from "hono";
import {
  handleGetRecommendations,
  handleGetRecentRecommendations,
  handleAddRecommendation,
  handleLoadMoreRecommendations,
  handleGetRecommendationItems,
} from "../controllers/redis.controller";

const router = new Hono();

router.get("/recommendations/:userId/items", handleGetRecommendationItems);
router.get("/recommendations/:userId", handleGetRecommendations);
router.get("/recommendations/:userId/load-more", handleLoadMoreRecommendations);
router.get("/recommendations-recent/:userId", handleGetRecentRecommendations);
router.post("/recommendations/:userId", handleAddRecommendation);

export default router;
