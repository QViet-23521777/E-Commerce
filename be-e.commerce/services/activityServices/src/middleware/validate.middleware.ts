import { Context, Next } from "hono";

const VALID_ACTIVITIES = ["view", "search", "click", "buy"];

export const validateActivity = async (c: Context, next: Next) => {
  const body = await c.req.json();
  const { userId, activity } = body;
  const errors: string[] = [];

  if (!userId || typeof userId !== "string" || userId.trim() === "")
    errors.push("userId là bắt buộc và không được rỗng");
  if (!activity || !VALID_ACTIVITIES.includes(activity))
    errors.push(`activity phải là: ${VALID_ACTIVITIES.join(", ")}`);
  if (activity === "search" && !body.keyword)
    errors.push("keyword là bắt buộc khi activity là search");
  if (["view", "click", "buy"].includes(activity) && !body.productId)
    errors.push("productId là bắt buộc khi activity là view, click, buy");

  if (errors.length > 0) {
    return c.json({ success: false, errors }, 400);
  }

  c.set("validatedBody", body);
  await next();
};
