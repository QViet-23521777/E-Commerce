import { Hono } from "hono";
import {
  createCategoryController,
  deleteCategoryController,
  listCategoriesController,
  updateCategoryController,
} from "../controllers/category.controller";

const categoryRoutes = new Hono();

categoryRoutes.get("/", listCategoriesController);
categoryRoutes.post("/", createCategoryController);
categoryRoutes.patch("/:id", updateCategoryController);
categoryRoutes.delete("/:id", deleteCategoryController);

export default categoryRoutes;
