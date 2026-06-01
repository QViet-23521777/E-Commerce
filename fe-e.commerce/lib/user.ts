import { apiRequest } from "./api";

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProfileResponse {
  success: boolean;
  data: UserProfileData;
}

export async function fetchMyProfile(): Promise<UserProfileData> {
  const res = await apiRequest<ProfileResponse>("/api/users/profile", {
    method: "GET",
  });
  return res.data;
}

/** Update the logged-in user's profile. Backend supports `name` (and walletId). */
export async function updateMyProfile(updates: {
  name?: string;
  walletId?: string;
}): Promise<UserProfileData> {
  const res = await apiRequest<ProfileResponse>("/api/users/profile", {
    method: "PUT",
    body: updates,
  });
  return res.data;
}
