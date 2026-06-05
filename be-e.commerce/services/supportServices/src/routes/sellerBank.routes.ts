import { Hono } from "hono";
import {
  getSellerBankController,
  saveSellerBankController,
} from "../controllers/sellerBank.controller";

const sellerBankRoutes = new Hono();

sellerBankRoutes.get("/bank", getSellerBankController);
sellerBankRoutes.put("/bank", saveSellerBankController);

export default sellerBankRoutes;
