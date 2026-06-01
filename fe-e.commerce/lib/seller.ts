import { apiRequest } from "./api";
import { getAccessToken } from "./auth";
import type { BackendProduct } from "./products";

const _envUrl = process.env.NEXT_PUBLIC_API_URL;
const BASE =
  _envUrl && _envUrl.startsWith("http") ? _envUrl : "http://localhost:3000";

// ── Seller shop profile (UserProfile) ───────────────────────────────────────

export interface SellerProfile {
  _id?: string;
  userId?: string;
  walletId?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  preferences?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface SellerProfileResponse {
  success: boolean;
  message?: string;
  data: SellerProfile;
}

export async function fetchSellerProfile(userId: string): Promise<SellerProfile> {
  const res = await apiRequest<SellerProfileResponse>(
    `/api/sellers/${encodeURIComponent(userId)}`,
    { method: "GET" },
  );
  return res.data;
}

export async function updateSellerProfile(
  userId: string,
  updates: Partial<Pick<SellerProfile, "phone" | "address" | "avatar">>,
): Promise<SellerProfile> {
  const res = await apiRequest<SellerProfileResponse>(
    `/api/sellers/${encodeURIComponent(userId)}`,
    { method: "PUT", body: updates },
  );
  return res.data;
}

// ── Inventory (a seller's product listings) ──────────────────────────────────

export interface InventoryItem {
  _id: string;
  name: string;
  sellerId: string;
  quantity: number;
  productId: BackendProduct | string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * List a seller's inventory. The backend returns a bare array on success and a
 * 404 `{ success:false }` when the seller has no listings — both are mapped to
 * an array here.
 */
export async function fetchSellerInventory(
  sellerId: string,
): Promise<InventoryItem[]> {
  try {
    const res = await apiRequest<InventoryItem[] | { success: boolean }>(
      `/api/inventory/seller/${encodeURIComponent(sellerId)}`,
      { method: "GET" },
    );
    return Array.isArray(res) ? res : [];
  } catch (err) {
    // 404 = no inventory yet.
    if ((err as { status?: number })?.status === 404) return [];
    throw err;
  }
}

export async function updateInventoryQuantity(
  inventoryId: string,
  quantity: number,
): Promise<InventoryItem> {
  return apiRequest<InventoryItem>(
    `/api/inventory/${encodeURIComponent(inventoryId)}/quantity`,
    { method: "PUT", body: { quantity } },
  );
}

export async function deleteInventory(inventoryId: string): Promise<void> {
  await apiRequest(`/api/inventory/${encodeURIComponent(inventoryId)}`, {
    method: "DELETE",
  });
}

// ── Create product (multipart, with image) + inventory listing ───────────────

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  type: string;
  quantity: number; // initial stock; must be >= 1 (backend rejects 0 on create)
  point?: number;
  sale?: number;
  // Image is optional: supply an uploaded file OR a direct image URL. When
  // neither is given, the backend stores a placeholder.
  image?: File;
  imageUrl?: string;
}

interface CreateProductResponse {
  success: boolean;
  data: BackendProduct;
}

/**
 * Create a product (multipart upload — the backend stores the image on
 * Cloudinary), then register an inventory listing for the seller.
 * Returns the created inventory item.
 */
export async function createListing(
  sellerId: string,
  input: CreateProductInput,
): Promise<InventoryItem> {
  const form = new FormData();
  form.append("name", input.name);
  form.append("description", input.description);
  form.append("price", String(input.price));
  form.append("type", input.type);
  if (input.point !== undefined) form.append("point", String(input.point));
  if (input.sale !== undefined) form.append("sale", String(input.sale));
  if (input.image) form.append("image", input.image);
  if (input.imageUrl?.trim()) form.append("imageUrl", input.imageUrl.trim());

  const token = getAccessToken();
  // Don't set Content-Type — the browser adds the multipart boundary itself.
  const res = await fetch(`${BASE}/api/products`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.success) {
    const msg =
      data?.message ||
      (Array.isArray(data?.errors) ? data.errors.join(", ") : "") ||
      "Failed to create product";
    throw new Error(msg);
  }
  const product = data.data as BackendProduct;

  const inventory = await apiRequest<InventoryItem>("/api/inventory", {
    method: "POST",
    body: {
      name: input.name,
      productId: product._id,
      quantity: Math.max(1, input.quantity),
      sellerId,
    },
  });
  return inventory;
}

// ── Public shop profile (for the product detail "Sold by" card) ──────────────

export interface PublicShop {
  id: string;
  name: string;
  address: string;
  avatar: string;
}

export async function fetchSellerPublicProfile(
  sellerId: string,
): Promise<PublicShop | null> {
  try {
    const res = await apiRequest<{ success: boolean; data: PublicShop }>(
      `/api/sellers/${encodeURIComponent(sellerId)}/public`,
    );
    return res.data ?? null;
  } catch {
    return null;
  }
}
