import {
  createSeller,
  verifySellerAccount,
  getSeller,
  updateSeller,
  deleteSeller,
} from "../controllers/seller.controller";
import { Hono } from "hono";

const sellerRoutes = new Hono();

sellerRoutes.post("/create", createSeller);
sellerRoutes.post("/verify", verifySellerAccount);
sellerRoutes.get("/:userId", getSeller);
sellerRoutes.put("/:userId", updateSeller);
sellerRoutes.delete("/:userId", deleteSeller);

export default sellerRoutes;
