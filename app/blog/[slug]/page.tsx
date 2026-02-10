import React from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import BlogContent from "./BlogContent";

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
        <Link
          href="/"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-10 font-medium transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>
        <header className="mb-12 pb-10 border-b-2 border-gray-200">
          <h1 className="text-5xl font-bold mb-5 text-gray-900 leading-tight">{title}</h1>
          <div className="flex items-center justify-between text-gray-600 flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{author}</span>
              <span className="text-gray-300">•</span>
              <span>{date}</span>
            </div>
            {blog.tag && (
              <span className="inline-block bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm px-4 py-1.5 rounded-full font-medium border border-blue-200">
                {blog.tag}
              </span>
            )}
          </div>
          {description && <p className="text-xl text-gray-700 mt-8 leading-relaxed">{description}</p>}
          {image && (
            <div className="mt-8 rounded-xl overflow-hidden shadow-lg">
              <Image
                src={`/${image}`}
                alt={title}
                width={900}
                height={400}
                priority
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
        </header>

        <section 
          className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:mt-10 prose-headings:mb-5 prose-h1:text-3xl prose-h2:text-2xl prose-p:my-6 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:underline prose-a:font-medium prose-ul:my-6 prose-ol:my-6 prose-li:my-3 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:bg-blue-50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-lg prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-red-600 prose-code:font-semibold prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Engagement Features */}
        <div className="mt-16 pt-8 border-t-2 border-gray-200">
          <BlogContent blogId={blog.id} />
        </div>
      </article>
    </main>
  );
}
