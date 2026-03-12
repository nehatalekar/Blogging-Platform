"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { BlogPost } from "@/types/blog";

interface HomePageClientProps {
  initialPosts: BlogPost[];
}

function normalizeImagePath(imagePath: string, fallback: string): string {
  if (!imagePath || typeof imagePath !== "string" || imagePath.trim() === "") {
    return fallback;
  }
  return imagePath.startsWith("http") ? imagePath : `/${imagePath.replace(/^\/+/, "")}`;
}

export default function HomePageClient({ initialPosts }: HomePageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) {
      return initialPosts;
    }

    const query = searchQuery.toLowerCase().trim();
    return initialPosts.filter((post) => {
      return (
        post.title.toLowerCase().includes(query) ||
        post.description.toLowerCase().includes(query) ||
        post.author.toLowerCase().includes(query) ||
        post.tag.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, initialPosts]);

  return (
    <div className="w-full bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16 px-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">Discover Stories</h1>
          <p className="text-xl text-gray-600">Explore insightful articles from our community</p>
        </div>
      </div>

      {/* Search Bar Section */}
      <div className="max-w-md mx-auto pt-10 pb-0 px-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search blogs by title, author, tag, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-6 py-4 pr-12 text-gray-900 border-2 border-gray-300 rounded-full focus:outline-none focus:border-blue-500 transition-colors duration-200 shadow-sm"
          />
          <svg
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {searchQuery.trim() && (
          <p className="text-gray-600 text-sm mt-2">
            Found <span className="font-semibold text-gray-900">{filteredPosts.length}</span> blog{filteredPosts.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
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
              <div className="text-6xl mb-4 opacity-50">🔍</div>
              <p className="text-gray-500 text-lg font-medium">No blogs found matching "{searchQuery}"</p>
              <p className="text-gray-400 text-sm mt-2">Try searching with different keywords</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
