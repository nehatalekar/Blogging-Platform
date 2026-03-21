// Displayed on homepage cards (formatted for UI)
export interface BlogPost {
  title: string;
  slug: string;
  postImage: string;
  description: string;
  profileImage: string;
  author: string;
  date: string;
  tag: string;
}

// Used in dashboard for creating/editing blogs
export interface BlogData {
  id?: number;
  title?: string;
  description?: string;
  postImage?: string;
  slug?: string;
  content?: string;
  status?: string;
  tag?: string;
  author?: string;
  updatedAt?: string;
}

export interface BlogCreateInput {
  title?: string;
  description?: string;
  postImage?: string;
  slug?: string;
  content?: string;
  status?: string;
  tag?: string;
}

export interface BlogUpdateInput {
  id: number;
  title?: string;
  description?: string;
  postImage?: string | null;
  content?: string;
  status?: string;
  tag?: string;
}

export type BlogMutationInput = BlogCreateInput | BlogUpdateInput;

// Used for saved blogs list
export interface SavedBlog {
  id: number;
  blogId: number;
  blog: {
    id: number;
    title: string;
    slug: string;
    description: string;
    postImage?: string;
    author: string;
    tag: string;
    createdAt: string;
  };
}
