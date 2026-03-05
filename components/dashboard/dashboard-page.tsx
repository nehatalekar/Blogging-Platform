"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { User } from "lucide-react";
import BlogModal from "./BlogModal";
import BlogCard from "./BlogCard";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<"drafts" | "published">("drafts");
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

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

  console.log("Dropdown open:", dropdownOpen);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  // Fetch user profile image from API
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!session?.user) {
        setProfileImage(null);
        return;
      }

      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const data = await res.json();
          setProfileImage(data.user?.profileImage || null);
        }
      } catch (err) {
        // Fallback to session image if API fails
        setProfileImage((session as any)?.user?.image || null);
      }
    };

    fetchProfileImage();
  }, [session?.user]);



  // Listen for profile updates
  const handleProfileUpdate = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail as { profileImage?: string | null } | undefined;
    if (detail && typeof detail.profileImage !== 'undefined') {
      setProfileImage(detail.profileImage || null);
    }
  }, []);



  useEffect(() => {
    window.addEventListener('profile-updated', handleProfileUpdate as EventListener);
    return () => window.removeEventListener('profile-updated', handleProfileUpdate as EventListener);
  }, [handleProfileUpdate]);

  // fetch post

  const fetchPosts = async () => {
    const res = await fetch("/api/blog");
    const json = await res.json();
    setPosts(json.posts || []);
  };

  // logout

const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  // save draft

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


  // publish post

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

  // update post

  const handleUpdate = async (data: any) => {
    await fetch("/api/blog", {
      method: "PUT",
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
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt={session.user?.name || 'Profile'}
                    width={1000}
                    height={1000}
                    className="rounded-full object-cover w-12 h-12"
                  />
                ) : (
                  <div className="rounded-full bg-blue-500 text-white w-12 h-12 flex items-center justify-center font-semibold">
                    <User size={20} />
                  </div>
                )}
              </button>
             

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={() => { setDropdownOpen(false); router.push('/profile'); }}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-gray-700 font-medium"
                  >
                    👤 Profile
                  </button>

                  <button
                    onClick={() => { setDropdownOpen(false); router.push('/dashboard'); }}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-gray-700 font-medium"
                  >
                    📊 Dashboard
                  </button>

                  <button
                    onClick={() => { setDropdownOpen(false); router.push('/saved-blogs'); }}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-gray-700 font-medium"
                  >
                    🔖 Saved Blogs
                  </button>

                  <div className="border-t border-gray-200"></div>

                  <button
                    onClick={() => { setDropdownOpen(false); handleLogout(); }}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors text-red-600 font-medium"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

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
                  <BlogCard post={p} onEdit={(post: any) => { setEditingPost(post); setModalOpen(true); }} onDelete={async (id: number) => { await handleDelete(id); }} />
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
        initial={editingPost}
      />
    </div>
  );
}
