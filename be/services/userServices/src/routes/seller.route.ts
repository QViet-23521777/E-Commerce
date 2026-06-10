import {
  createSeller,
  verifySellerAccount,
  getSeller,
  getSellerPublic,
  updateSeller,
  deleteSeller,
} from "../controllers/seller.controller";
import { Hono } from "hono";

const sellerRoutes = new Hono();

sellerRoutes.post("/create", createSeller);
sellerRoutes.post("/verify", verifySellerAccount);
sellerRoutes.get("/:userId/public", getSellerPublic);
sellerRoutes.get("/:userId", getSeller);
sellerRoutes.put("/:userId", updateSeller);
sellerRoutes.delete("/:userId", deleteSeller);

export default sellerRoutes;
