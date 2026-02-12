import { PrismaClient } from "@prisma/client";
import HomePageClient from "./HomePageClient";

const prisma = new PrismaClient();

interface BlogPost {
  title: string;
  slug: string;
  postImage: string;
  description: string;
  profileImage: string;
  author: string;
  date: string;
  tag: string;
}

async function getPublishedBlogs(): Promise<BlogPost[]> {
  try {
    const blogs = await prisma.blog.findMany({
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });

    return blogs.map((blog) => ({
      title: blog.title,
      slug: blog.slug,
      postImage: blog.postImage || "/default-post.jpg",
      description: blog.description,
      profileImage: blog.user?.profileImage || "/profile.webp",
      author: blog.user?.fullName || blog.author || "Author",
      date: blog.createdAt?.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }) || "",
      tag: blog.tag || "General",
    }));
  } catch (error) {
    console.error("Failed to fetch published blogs:", error);
    return [];
  }
}

export default async function HomePage() {
  const posts = await getPublishedBlogs();

  return <HomePageClient initialPosts={posts} />;
}
