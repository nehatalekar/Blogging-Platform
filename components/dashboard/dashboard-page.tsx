"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import BlogModal from "./BlogModal";
import BlogCard from "./BlogCard";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<"drafts" | "published">("drafts");
  const [editingPost, setEditingPost] = useState<any | null>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPosts = async () => {
    const res = await fetch("/api/blog");
    const json = await res.json();
    setPosts(json.posts || []);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const handleSaveDraft = async (data: any) => {
    if (data.id) {
      // Update existing draft
      await fetch("/api/blog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, status: "draft" }),
      });
    } else {
      // Create new draft
      await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, status: "draft" }),
      });
    }
    await fetchPosts();
  };

  const handlePublish = async (data: any) => {
    if (data.id) {
      // Update existing blog
      await fetch("/api/blog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, status: "published" }),
      });
    } else {
      // Create new blog
      await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, status: "published" }),
      });
    }
    await fetchPosts();
  };

  const handleUpdate = async (data: any) => {
    await fetch("/api/blog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetchPosts();
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    await fetch(`/api/blog?id=${id}`, { method: "DELETE" });
    await fetchPosts();
  };

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

  const drafts = posts.filter((p) => (p.status || "published") === "draft");
  const published = posts.filter((p) => (p.status || "published") === "published");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Blog Platform</h1>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Home
            </button>

            <button
              onClick={() => { setModalOpen(true); setEditingPost(null); }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Create Blog
            </button>

            <div className="relative" ref={profileRef}>
              <button
                aria-label="Open profile menu"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-center rounded-full focus:outline-none border border-gray-200 p-1"
              >
                <img
                  src={session.user?.image || '/logo.jpg'}
                  alt={session.user?.name || 'Profile'}
                  width={1000}
                  height={1000}
                  className="rounded-full object-cover w-12 h-12"
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-50">
                  <button
                    onClick={() => { setDropdownOpen(false); router.push('/profile'); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Profile
                  </button>

                  <button
                    onClick={() => { setDropdownOpen(false); router.push('/dashboard'); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Dashboard
                  </button>

                  <button
                    onClick={() => { setDropdownOpen(false); handleLogout(); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome, {session.user?.username}! 👋
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Your account has been successfully verified and authenticated.
          </p>

        

         

          <div className="mt-8 bg-white p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <button onClick={() => setSelectedTab("drafts")} className={`px-4 py-2 rounded ${selectedTab === "drafts" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>
                  Drafts
                </button>
                <button onClick={() => setSelectedTab("published")} className={`px-4 py-2 rounded ${selectedTab === "published" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>
                  Published
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(selectedTab === "drafts" ? drafts : published).map((p) => (
                <BlogCard key={p.id} post={p} onEdit={(post: any) => { setEditingPost(post); setModalOpen(true); }} onDelete={async (id: number) => { await handleDelete(id); }} />
              ))}
            </div>
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
        initial={editingPost}
      />
    </div>
  );
}
