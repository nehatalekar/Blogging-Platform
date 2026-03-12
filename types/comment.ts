// Public user info displayed in comments, author sections
export interface BlogUser {
  id: number;
  username: string;
  fullName: string;
  profileImage?: string;
}

export interface Comment {
  id: number;
  content: string;
  user: BlogUser;
  createdAt: string;
}
