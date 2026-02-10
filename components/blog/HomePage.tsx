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

function normalizeImagePath(imagePath: string, fallback: string): string {
  if (!imagePath || typeof imagePath !== "string" || imagePath.trim() === "") {
    return fallback;
  }
  return imagePath.startsWith("http") ? imagePath : `/${imagePath.replace(/^\/+/, "")}`;
}

export default async function HomePage() {
  const posts = await getPublishedBlogs();

  return (
    <div className="w-full bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16 px-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">Discover Stories</h1>
          <p className="text-xl text-gray-600">Explore insightful articles from our community</p>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-7xl  mx-auto py-12 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="h-full overflow-hidden rounded-xl hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white hover:scale-105 transform">
                <CardContent className="p-0 flex flex-col gap-0 h-full">
                  <div className="relative overflow-hidden h-48 bg-gray-200">
                    <Image
                      src={normalizeImagePath(post.postImage, "/default-post.jpg")}
                      alt={post.title}
                      width={600}
                      height={360}
                      className="w-full h-48 object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-5 flex flex-col gap-3 flex-grow">
                    <h2 className="text-lg font-bold text-gray-900 line-clamp-2 hover:text-blue-600">{post.title}</h2>

                    <p className="text-gray-600 text-sm flex-grow line-clamp-3">
                      {post.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3 flex-1">
                        <Image
                          src={normalizeImagePath(post.profileImage, "/profile.webp")}
                          alt={post.author}
                          width={40}
                          height={40}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                        <div className="flex flex-col gap-0 flex-1">
                          <p className="text-gray-700 font-semibold text-sm leading-tight">{post.author}</p>
                          <p className="text-gray-500 text-xs">{post.date}</p>
                        </div>
                      </div>
                      <span className="inline-block bg-blue-100 text-gray-700 px-6 py-1.5 rounded-full text-sm font-medium">
                        {post.tag}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-20">
            <div className="text-6xl mb-4 opacity-50">📝</div>
            <p className="text-gray-500 text-lg font-medium">No published blogs yet.</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon for amazing stories!</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
