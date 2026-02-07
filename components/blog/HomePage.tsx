import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { PrismaClient } from "@prisma/client";

import {
  Card,
  CardContent,
} from "@/components/ui/card"
const abc = {

}

const prisma = new PrismaClient();

export default async function HomePage() {
  const postsDirectory = path.join(process.cwd(), "content/posts");
  let staticPosts: any[] = [];

  if (fs.existsSync(postsDirectory)) {
    const filenames = fs.readdirSync(postsDirectory).filter((f) => f.endsWith('.mdx'));
    staticPosts = filenames.map((filename) => {
      const filePath = path.join(postsDirectory, filename);
      const fileContents = fs.readFileSync(filePath, "utf8");
      const { data } = matter(fileContents);
      return data;
    });
  }

  // Fetch published blogs from database (user-created)
  let dbPosts: any[] = [];
  try {
    const rows = await prisma.blog.findMany({ where: { status: 'published' }, orderBy: { createdAt: 'desc' } });
    dbPosts = rows.map((r) => ({
      title: r.title,
      slug: r.slug,
      postImage: r.postImage || '',
      description: r.description,
      profileImage: r.profileImage || 'profile.webp',
      author: r.author || 'Author',
      date: r.createdAt ? new Date(r.createdAt).toISOString().slice(0,10) : '',
      tag: r.tag || 'General',
      content: r.content || '',
      id: r.id,
    }));
  } catch (e) {
    // ignore DB errors on homepage rendering
    dbPosts = [];
  }

  // Merge DB posts and static posts, prefer DB posts when slugs collide
  const mergedMap = new Map<string, any>();
  for (const p of dbPosts) mergedMap.set(p.slug, p);
  for (const p of staticPosts) if (!mergedMap.has(p.slug)) mergedMap.set(p.slug, p);

  const posts = Array.from(mergedMap.values());

  return (
    <div className="max-w-[1200px] mx-auto py-15 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => {
        const normPostImage = post.postImage && typeof post.postImage === 'string' && post.postImage.trim() !== ''
          ? (post.postImage.startsWith('http') ? post.postImage : '/' + post.postImage.replace(/^\/+/, ''))
          : '/default-post.jpg';

        const normProfileImage = post.profileImage && typeof post.profileImage === 'string' && post.profileImage.trim() !== ''
          ? (post.profileImage.startsWith('http') ? post.profileImage : '/' + post.profileImage.replace(/^\/+/, ''))
          : '/profile.webp';

        return (
        <Link key={post.slug} href={`/blog/${post.slug}`} className="block">
          <Card className="p-0 rounded-lg hover:shadow-lg transition-shadow duration-300 cursor-pointer">
            <CardContent className="p-4 flex flex-col items-between justify-start gap-4">
              <Image
                src={normPostImage}
                alt={post.title}
                width={600}
                height={360}
                className="rounded-md w-full h-auto object-cover"
              />

              <h2 className="text-lg text-left font-bold">
                {post.title}
              </h2>

              <p className="text-gray-600 text-left text-base flex-1">
                {post.description}
              </p>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center  justify-center gap-2.5">
                  <Image
                    src={normProfileImage}
                    alt={post.author}
                    width={40}
                    height={40}
                    className="rounded-full w-6 h-6 object-cover "
                  />
                   <p className=" text-gray-600 text-sm">{post.author}</p>
                  <span className="bg-gray-400 flex h-[3px] w-[3px] rounded-full flex items-center"></span>
                   <p className="text-gray-500 text-sm">{post.date}</p>
                </div>

                <div>
                  <span className="w-20  h-7 flex items-center justify-center text-[#00674b] text-sm bg-[#D6F6D5] rounded-full font-medium">
                   {post.tag}
                 </span>

                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
