import { Hono } from "hono";
import {
  getCartController,
  replaceCartController,
  clearCartController,
  mergeCartController,
  saveSnapshotController,
  getSnapshotController,
} from "../controllers/cart.controller";

const cartRoutes = new Hono();

cartRoutes.get("/", getCartController);
cartRoutes.put("/", replaceCartController);
cartRoutes.delete("/", clearCartController);
cartRoutes.post("/merge", mergeCartController);

cartRoutes.post("/orders/:orderId/snapshot", saveSnapshotController);
cartRoutes.get("/orders/:orderId/snapshot", getSnapshotController);

export default cartRoutes;
