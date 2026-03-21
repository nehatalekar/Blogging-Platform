"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BlogModal from "./BlogModal";
import BlogCard from "./BlogCard";
import { BlogCreateInput, BlogData, BlogUpdateInput } from "@/types/blog";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [posts, setPosts] = useState<BlogData[]>([]);
  const [selectedTab, setSelectedTab] = useState<"drafts" | "published">("drafts");
  const [editingPost, setEditingPost] = useState<BlogData | null>(null);

  async function fetchPosts() {
    const res = await fetch("/api/blog");
    const json = await res.json();
    setPosts(json.posts || []);
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    const openModal = () => {
      setEditingPost(null);
      setModalOpen(true);
    };

    window.addEventListener("open-create-blog-modal", openModal);
    return () => window.removeEventListener("open-create-blog-modal", openModal);
  }, []);

  // fetch post

  // save draft

  const handleSaveDraft = async (data: BlogCreateInput) => {
    await fetch("/api/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, status: "draft" }),
    });
    await fetchPosts();
  };


  // publish post

  const handlePublish = async (data: BlogCreateInput) => {
    await fetch("/api/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, status: "published" }),
    });
    await fetchPosts();
  };

  // update post
  const handleUpdate = async (data: BlogUpdateInput) => {
    await fetch("/api/blog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetchPosts();
  };

  // delete post
  const handleDelete = async (id?: number) => {
    if (!id) return;
    await fetch(`/api/blog?id=${id}`, { method: "DELETE" });
    await fetchPosts();
  };  


  // render
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }


  // separate drafts and published
  const drafts = posts.filter((p) => (p.status || "published") === "draft");
  const published = posts.filter((p) => (p.status || "published") === "published");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-10 border border-blue-100 mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome, {session.user?.username}! 👋
          </h2>
          <p className="text-gray-700 text-lg">
            Manage your blog posts and share your stories with the world.
          </p>
        </div>

        {/* Stats Section */}
        <div className="w-[100%] grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-md p-4 shadow-sm border-l-2 border-blue-500">
            <p className="text-gray-600 text-xs font-medium">Total Posts</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{posts.length}</p>
          </div>
          <div className="bg-white rounded-md p-4 shadow-sm border-l-2 border-green-500">
            <p className="text-gray-600 text-xs font-medium">Published</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{published.length}</p>
          </div>
          <div className="bg-white rounded-md p-4 shadow-sm border-l-2 border-orange-500">
            <p className="text-gray-600 text-xs font-medium">Drafts</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{drafts.length}</p>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Your Posts</h3>
            <div className="flex gap-2">
              <button onClick={() => setSelectedTab("drafts")} className={`px-6 py-2.5 rounded-full font-medium transition-all ${selectedTab === "drafts" ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                📝 Drafts ({drafts.length})
              </button>
              <button onClick={() => setSelectedTab("published")} className={`px-6 py-2.5 rounded-full font-medium transition-all ${selectedTab === "published" ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                ✅ Published ({published.length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            {(selectedTab === "drafts" ? drafts : published).length > 0 ? (
              (selectedTab === "drafts" ? drafts : published).map((p) => (
                <div key={p.id} className="w-full h-full">
                  <BlogCard post={p} onEdit={(post) => { setEditingPost(post); setModalOpen(true); }} onDelete={async (id) => { await handleDelete(id); }} />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-5xl mb-3 opacity-40">{selectedTab === "drafts" ? "📝" : "✅"}</div>
                <p className="text-gray-500 text-lg font-medium">No {selectedTab} yet</p>
                <p className="text-gray-400 text-sm mt-2">Create your first blog to get started</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <BlogModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onDelete={async (id?: number) => await handleDelete(id)}
        onUpdate={handleUpdate}
        initial={editingPost ?? undefined}
      />
    </div>
  );
}
