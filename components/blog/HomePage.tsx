import Image from "next/image";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";

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
      profileImage: blog.profileImage || "/profile.webp",
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

function normalizeImagePath(imagePath: string, fallback: string): string {
  if (!imagePath || typeof imagePath !== "string" || imagePath.trim() === "") {
    return fallback;
  }
  return imagePath.startsWith("http") ? imagePath : `/${imagePath.replace(/^\/+/, "")}`;
}

export default async function HomePage() {
  const posts = await getPublishedBlogs();

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="h-full p-0 rounded-lg hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                <CardContent className="p-4 flex flex-col gap-4 h-full">
                  <Image
                    src={normalizeImagePath(post.postImage, "/default-post.jpg")}
                    alt={post.title}
                    width={600}
                    height={360}
                    className="rounded-md w-full h-48 object-cover"
                  />

                  <h2 className="text-lg font-bold line-clamp-2">{post.title}</h2>

                  <p className="text-gray-600 text-sm flex-grow line-clamp-2">
                    {post.description}
                  </p>

                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Image
                        src={normalizeImagePath(post.profileImage, "/profile.webp")}
                        alt={post.author}
                        width={40}
                        height={40}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <div className="flex items-center gap-2">
                        <p className="text-gray-700 font-medium text-xs">{post.author}</p>
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        <p className="text-gray-500 text-xs">{post.date}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      {post.tag}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">No published blogs yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
