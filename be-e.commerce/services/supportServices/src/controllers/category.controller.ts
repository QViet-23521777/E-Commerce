import { Context } from "hono";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../services/category.services";

const isAdmin = (c: Context) => {
  const role = c.req.header("x-user-role");
  return role === "admin" || role === "superadmin";
};

export const listCategoriesController = async (c: Context) => {
  try {
    const data = await listCategories();
    return c.json({ success: true, data });
  } catch (error) {
    console.error("listCategories error:", error);
    return c.json({ success: false, message: "Lỗi khi tải danh mục" }, 500);
  }
};

export const createCategoryController = async (c: Context) => {
  if (!isAdmin(c)) return c.json({ success: false, message: "Forbidden" }, 403);
  try {
    const body = await c.req.json().catch(() => ({}));
    const data = await createCategory(body);
    if (!data) return c.json({ success: false, message: "label là bắt buộc" }, 400);
    return c.json({ success: true, data }, 201);
  } catch (error: any) {
    if (error?.code === 11000) {
      return c.json({ success: false, message: "Slug danh mục đã tồn tại" }, 409);
    }
    console.error("createCategory error:", error);
    return c.json({ success: false, message: "Lỗi khi tạo danh mục" }, 500);
  }
};

export const updateCategoryController = async (c: Context) => {
  if (!isAdmin(c)) return c.json({ success: false, message: "Forbidden" }, 403);
  try {
    const id = c.req.param("id") || "";
    const body = await c.req.json().catch(() => ({}));
    const data = await updateCategory(id, body);
    if (!data) return c.json({ success: false, message: "Không tìm thấy danh mục" }, 404);
    return c.json({ success: true, data });
  } catch (error: any) {
    if (error?.code === 11000) {
      return c.json({ success: false, message: "Slug danh mục đã tồn tại" }, 409);
    }
    console.error("updateCategory error:", error);
    return c.json({ success: false, message: "Lỗi khi cập nhật danh mục" }, 500);
  }
};

export const deleteCategoryController = async (c: Context) => {
  if (!isAdmin(c)) return c.json({ success: false, message: "Forbidden" }, 403);
  try {
    const id = c.req.param("id") || "";
    const ok = await deleteCategory(id);
    if (!ok) return c.json({ success: false, message: "Không tìm thấy danh mục" }, 404);
    return c.json({ success: true });
  } catch (error) {
    console.error("deleteCategory error:", error);
    return c.json({ success: false, message: "Lỗi khi xóa danh mục" }, 500);
  }
};
