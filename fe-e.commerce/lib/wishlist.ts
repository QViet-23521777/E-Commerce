import { apiRequest } from "./api";

interface IdsResponse {
  success: boolean;
  data: string[];
}

/** The current user's wishlist as a list of catalogue product ids. */
export async function fetchWishlist(): Promise<string[]> {
  const res = await apiRequest<IdsResponse>("/api/users/wishlist", {
    method: "GET",
  });
  return res.data ?? [];
}

/** Add a product to the wishlist. Returns the updated id list. */
export async function addToWishlist(productId: string): Promise<string[]> {
  const res = await apiRequest<IdsResponse>("/api/users/wishlist", {
    method: "POST",
    body: { productId },
  });
  return res.data ?? [];
}

/** Remove a product from the wishlist. Returns the updated id list. */
export async function removeFromWishlist(
  productId: string,
): Promise<string[]> {
  const res = await apiRequest<IdsResponse>(
    `/api/users/wishlist/${encodeURIComponent(productId)}`,
    { method: "DELETE" },
  );
  return res.data ?? [];
}
