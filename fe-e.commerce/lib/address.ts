import { apiRequest } from "./api";

/**
 * A saved delivery address. `id` is client-generated (Date.now()) so the UI can
 * manage the list locally; the whole array is persisted on every change.
 */
export interface Address {
  id: number;
  label: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  zip: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

interface AddrResponse {
  success: boolean;
  data: Address[];
}

/** The current user's saved addresses. */
export async function fetchAddresses(): Promise<Address[]> {
  const res = await apiRequest<AddrResponse>("/api/users/addresses", {
    method: "GET",
  });
  return res.data ?? [];
}

/** Persist the full address list (whole-array replace). Returns the saved list. */
export async function saveAddresses(addresses: Address[]): Promise<Address[]> {
  const res = await apiRequest<AddrResponse>("/api/users/addresses", {
    method: "PUT",
    body: { addresses },
  });
  return res.data ?? [];
}
