"use client";

import Link from "next/link";
import Image from "next/image";
import { Bookmark, PenSquare, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";


export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/verify";
  const isDashboard = pathname === "/dashboard";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

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

  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  if (isAuthPage) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-white w-full shadow-md border-b border-gray-200">
      <nav className="w-full flex justify-between items-center py-4 px-6 max-w-7xl mx-auto">

        <div className="flex items-center gap-6 flex-1">
          
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="logo">
            <Image src="/logo.jpg" alt="Logo"  width={120} height={120}
            className="rounded-full w-11 h-11 " />
          </div>
          <span className="font-bold text-xl text-gray-900 hidden sm:inline">Blog Platform</span>

          </Link>
          

          {/* <div className="hidden sm:block">
            <div className="relative">
              <label htmlFor="nav-search" className="sr-only">Search</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="nav-search"
                name="q"
                type="search"
                placeholder="Search blogs..."
                className="w-64 bg-gray-100 placeholder-gray-500 text-gray-800 pl-10 pr-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                onChange={e => {
                  // Dispatch a custom event for BlogFeed to listen
                  window.dispatchEvent(new CustomEvent('blog-search', { detail: { search: e.target.value } }));
                }}
              />
            </div>
          </div> */}

        </div>

        

       

        <div className="flex items-center justify-center gap-3">
          {session?.user ? (
            <>
              {isDashboard && (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("open-create-blog-modal"))}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all font-medium text-sm"
                >
                  <PenSquare size={16} />
                  <span className="hidden sm:inline">Create Blog</span>
                </button>
              )}
              <Link
                href="/saved-blogs"
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all font-medium text-sm"
                title="View saved blogs"
              >
                <Bookmark size={18} />
                <span className="hidden sm:inline">Saved</span>
              </Link>
              <div className="relative" ref={profileRef}>
              <button
                aria-label="Open profile menu"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-center rounded-full focus:outline-none border border-gray-200 p-1"
              >
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt={(session as any)?.user?.name || 'Profile'}
                    width={1000}
                    height={1000}
                    className="rounded-full object-cover w-12 h-12 p"
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
            </>
          ) : (
            <>
              <button
                className="hidden md:inline-flex px-5 py-2.5 rounded-full text-gray-700 border-2 border-blue-500 hover:bg-blue-50 transition-all font-medium text-sm"
                onClick={() => { window.location.href = '/login'; }}
              >
                Login
              </button>

              <button
                className="inline-flex px-6 py-2.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-all font-medium text-sm shadow-md hover:shadow-lg"
                onClick={() => { window.location.href = '/signup'; }} 
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
