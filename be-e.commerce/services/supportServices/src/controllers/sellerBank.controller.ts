import { Context } from "hono";
import { getSellerBank, saveSellerBank } from "../services/sellerBank.services";

const sellerId = (c: Context) => {
  const id = c.req.header("x-user-id");
  return id && id.trim() ? id : null;
};

export const getSellerBankController = async (c: Context) => {
  const id = sellerId(c);
  if (!id) return c.json({ success: false, message: "Unauthorized" }, 401);
  try {
    const data = await getSellerBank(id);
    return c.json({ success: true, data });
  } catch (error) {
    console.error("getSellerBank error:", error);
    return c.json({ success: false, message: "Lỗi khi tải tài khoản ngân hàng" }, 500);
  }
};

export const saveSellerBankController = async (c: Context) => {
  const id = sellerId(c);
  if (!id) return c.json({ success: false, message: "Unauthorized" }, 401);
  try {
    const body = await c.req.json().catch(() => ({}));
    const data = await saveSellerBank(id, body);
    return c.json({ success: true, data });
  } catch (error) {
    console.error("saveSellerBank error:", error);
    return c.json({ success: false, message: "Lỗi khi lưu tài khoản ngân hàng" }, 500);
  }
};
