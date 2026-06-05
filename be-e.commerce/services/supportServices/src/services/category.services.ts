import { Category } from "../models/category.model";

// The real product taxonomy (capitalized `type` strings the catalog filters on).
// Categories are seeded from this so the managed list starts consistent with the
// actual inventory; admins can then add/edit/remove freely.
const SEED_CATEGORIES = [
  { label: "Electronics", slug: "electronics", iconName: "Monitor", productType: "Electronics", order: 0 },
  { label: "Fashion", slug: "fashion", iconName: "ShoppingBag", productType: "Fashion", order: 1 },
  { label: "Kitchenware", slug: "kitchenware", iconName: "UtensilsCrossed", productType: "Kitchenware", order: 2 },
  { label: "Decor", slug: "decor", iconName: "Home", productType: "Decor", order: 3 },
];

const slugify = (s: string) =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const view = (doc: any) => ({
  id: String(doc._id),
  label: doc.label,
  slug: doc.slug,
  iconName: doc.iconName,
  productType: doc.productType ?? "",
  order: doc.order ?? 0,
});

/** Seed the four catalog categories once, if the collection is empty. */
export const seedCategories = async () => {
  const count = await Category.estimatedDocumentCount();
  if (count > 0) return;
  await Category.insertMany(SEED_CATEGORIES);
  console.log("[support] seeded default categories");
};

/** All categories, ordered. Public (storefront + admin read it). */
export const listCategories = async () => {
  const docs = await Category.find().sort({ order: 1, createdAt: 1 }).lean();
  return docs.map(view);
};

export const createCategory = async (input: {
  label?: string;
  slug?: string;
  iconName?: string;
  productType?: string;
  order?: number;
}) => {
  const label = String(input.label || "").trim();
  if (!label) return null;
  const slug = (input.slug && slugify(input.slug)) || slugify(label);
  const doc = await Category.create({
    label,
    slug,
    iconName: String(input.iconName || "ShoppingBag"),
    productType: String(input.productType || label).trim(),
    order: Number(input.order) || 0,
  });
  return view(doc);
};

export const updateCategory = async (
  id: string,
  patch: { label?: string; iconName?: string; productType?: string; order?: number },
) => {
  const set: Record<string, unknown> = {};
  if (typeof patch.label === "string" && patch.label.trim()) {
    set.label = patch.label.trim();
    set.slug = slugify(patch.label);
  }
  if (typeof patch.iconName === "string") set.iconName = patch.iconName;
  if (typeof patch.productType === "string") set.productType = patch.productType.trim();
  if (patch.order !== undefined) set.order = Number(patch.order) || 0;
  if (Object.keys(set).length === 0) return null;

  const doc = await Category.findByIdAndUpdate(id, { $set: set }, { new: true }).lean();
  return doc ? view(doc) : null;
};

export const deleteCategory = async (id: string) => {
  const res = await Category.findByIdAndDelete(id);
  return !!res;
};
