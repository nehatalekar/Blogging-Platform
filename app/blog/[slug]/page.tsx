import React from "react";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Image from "next/image";

type Props = {
  params: { slug: string };
};

export default async function PostPage({ params }: Props) {
  const { slug } = await params; // Ensure params is awaited

  const postsDirectory = path.join(process.cwd(), "content/posts");
  const filePath = path.join(postsDirectory, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) return notFound();

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data: meta, content: html } = matter(fileContents);

  const title = meta.title || slug;
  const author = meta.author || "";
  const date = meta.date || "";
  const description = meta.description || "";
  const image = meta.postImage || null;

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <article>
        <header className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <div className="text-sm text-gray-500">
            {author} · {date}
          </div>
          {description ? <p className="text-gray-700 mt-3">{description}</p> : null}
          {image ? (
            <div className="mt-4">
              <Image
                src={`/${image}`}
                alt={title}
                width={900}
                height={400}
                className="rounded-md object-cover w-full"
              />
            </div>
          ) : null}
        </header>

        <section
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </main>
  );
}
