"use client";

import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";


export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    // initialize profile image from session
    setProfileImage((session as any)?.user?.image || null);

    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail as { profileImage?: string | null } | undefined;
      if (detail && typeof detail.profileImage !== 'undefined') {
        setProfileImage(detail.profileImage || null);
      }
    };

    window.addEventListener('profile-updated', onUpdate as EventListener);
    return () => window.removeEventListener('profile-updated', onUpdate as EventListener);
  }, [session]);

  return (
    <header className="sticky top-0 z-50 bg-white w-full shadow-sm">
      <nav className="w-full flex justify-between items-center py-4 px-30 border-b border-gray-200">

        <div className="flex items-center gap-4">
          
          <a href="/">
              <div className="logo w-full h-full">
            <Image src="/logo.jpg" alt="Logo"  width={100} height={100}
            className="rounded-full w-10 h-10" />
          </div>

          </a>
          

          <div className="hidden sm:block">
            <form action="/search" method="get" className="relative">
              <label htmlFor="nav-search" className="sr-only">Search</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                id="nav-search"
                name="q"
                type="search"
                placeholder="Type to search..."
                className=" w-60 lg:w-72 bg-gray-100 placeholder-gray-500 text-gray-800 pl-10 pr-4 py-2 rounded-full border border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </form>
          </div>

        </div>

        

       

        <div className="flex items-center justify-center gap-4">
          {session?.user ? (
            <div className="relative" ref={profileRef}>
              <button
                aria-label="Open profile menu"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-center rounded-full focus:outline-none"
              >
                <Image
                  src={profileImage || '/logo.jpg'}
                  alt={(session as any)?.user?.name || 'Profile'}
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
          ) : (
            <>
              <button
                className="hidden md:flex h-10 w-25 lg:h-11 lg:w-30 text-sm lg:text-base border border-[#157759] flex items-center justify-center rounded-md px-4 text-black hover:bg-[#82db8b8] transition"
                onClick={() => { window.location.href = '/login'; }}
              >
                Login
              </button>

              <button
                className="h-10 w-25 lg:h-11 lg:w-30 text-sm lg:text-base bg-[#157759] flex items-center justify-center rounded-md px-4  text-white hover:bg-[#13664f] transition"
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
