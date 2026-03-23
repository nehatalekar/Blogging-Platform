"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { SavedBlog } from "@/types/blog";
import { isRemoteImageSrc, normalizeImageSrc } from "@/lib/utils";

export default function SavedBlogsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [savedBlogs, setSavedBlogs] = useState<SavedBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    fetchSavedBlogs();
  }, [session, router]);

  const fetchSavedBlogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/engagement/save");
      if (!res.ok) {
        throw new Error("Failed to fetch saved blogs");
      }
      const data = await res.json();
      setSavedBlogs(data.saves || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSave = async (blogId: number) => {
    if (!confirm("Remove this blog from saved?")) {
      return;
    }

    setDeleting(blogId);
    try {
      const res = await fetch("/api/engagement/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId }),
      });

      if (!res.ok) {
        throw new Error("Failed to remove saved blog");
      }

      setSavedBlogs(savedBlogs.filter((s) => s.blog.id !== blogId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Saved Blogs</h1>
          <div className="text-center py-12">
            <p className="text-gray-500">Loading your saved blogs...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Saved Blogs</h1>
        <p className="text-gray-600 mb-8">
          {savedBlogs.length} {savedBlogs.length === 1 ? "blog" : "blogs"} saved
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {savedBlogs.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-12 text-center">
            <h2 className="text-2xl font-semibold text-gray-600 mb-3">
              No saved blogs yet
            </h2>
            <p className="text-gray-500 mb-6">
              Explore blogs and click the bookmark icon to save them for later
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Explore Blogs
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {savedBlogs.map((saved) => {
              const blog = saved.blog;
              const date = new Date(blog.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <article
                  key={blog.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    {blog.postImage && (
                      <div className="md:w-48 h-48 flex-shrink-0 relative bg-gray-100">
                        <Image
                          src={normalizeImageSrc(blog.postImage)}
                          alt={blog.title}
                          fill
                          unoptimized={isRemoteImageSrc(blog.postImage)}
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <Link
                              href={`/blog/${blog.slug}`}
                              className="block hover:text-blue-600 transition-colors"
                            >
                              <h2 className="text-2xl font-bold text-gray-900 line-clamp-2">
                                {blog.title}
                              </h2>
                            </Link>
                          </div>
                          <button
                            onClick={() => handleRemoveSave(blog.id)}
                            disabled={deleting === blog.id}
                            className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0 disabled:opacity-50"
                            aria-label="Remove from saved"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>

                        <p className="text-gray-600 line-clamp-2 mb-4">
                          {blog.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="font-medium">{blog.author}</span>
                          <span>•</span>
                          <span>{date}</span>
                          {blog.tag && (
                            <>
                              <span>•</span>
                              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {blog.tag}
                              </span>
                            </>
                          )}
                        </div>
                        <Link
                          href={`/blog/${blog.slug}`}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          Read
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
