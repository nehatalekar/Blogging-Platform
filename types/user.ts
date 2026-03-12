// User profile data returned from /api/user
export interface UserProfile {
  id: number;
  email: string;
  username: string;
  fullName: string;
  profileImage?: string | null;
  isVerified: boolean;
  createdAt: string;
}
