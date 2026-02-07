import React from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { PrismaClient } from "@prisma/client";

type Props = {
  params: { slug: string };
};

const prisma = new PrismaClient();

export default async function PostPage({ params }: Props) {
  const { slug } = await params; // Ensure params is awaited

  // Fetch blog from database using slug
  const blog = await prisma.blog.findUnique({
    where: { slug },
    include: { user: true },
  });

  if (!blog) return notFound();

  const title = blog.title;
  const author = blog.author;
  const date = blog.createdAt?.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }) || "";
  const description = blog.description;
  const image = blog.postImage;

  return (
    <main className="bg-white min-h-screen py-12 px-4">
      <article className="max-w-3xl mx-auto">
        <header className="mb-8 pb-8 border-b">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">{title}</h1>
          <div className="flex items-center justify-between text-gray-600">
            <div>
              <span className="font-semibold">{author}</span>
              <span className="mx-2">·</span>
              <span>{date}</span>
            </div>
            {blog.tag && (
              <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded">
                {blog.tag}
              </span>
            )}
          </div>
          {description && <p className="text-lg text-gray-700 mt-4">{description}</p>}
          {image && (
            <div className="mt-6 rounded-lg overflow-hidden">
              <Image
                src={`/${image}`}
                alt={title}
                width={900}
                height={400}
                priority
                className="w-full h-auto object-cover"
              />
            </div>
          )}
        </header>

        <section 
          className="prose prose-sm md:prose-base lg:prose-lg max-w-none prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4 prose-p:my-4 prose-a:text-blue-600 prose-a:underline prose-ul:my-4 prose-ol:my-4 prose-li:my-2 prose-blockquote:border-l-4 prose-blockquote:border-blue-400 prose-blockquote:pl-4 prose-blockquote:italic prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </article>
    </main>
  );
}
