'use client';

import { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [fullNameInput, setFullNameInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedImagePath, setSelectedImagePath] = useState<string | null>(null);
  const [isEditingFullName, setIsEditingFullName] = useState(false);
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const json = await res.json();
          setUser(json.user);
          setFullNameInput(json.user.fullName || "");
          setSelectedImagePath(json.user.profileImage || null);
        }
      } catch (err) {
        // ignore for now
      }
    }

    if (status === 'authenticated') {
      loadUser();
    }
  }, [status]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleFileChange = async (file?: File) => {
    if (!file) return null;
    setUploading(true);
    try {
      const reader = new FileReader();
      const p = await new Promise<string | null>((resolve, reject) => {
        reader.onload = async () => {
          try {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            const filename = `${Date.now()}-${file.name}`;
            const uploadRes = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename, data: base64 }),
            });
            if (!uploadRes.ok) return resolve(null);
            const j = await uploadRes.json();
            resolve(j.path || null);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('file read error'));
        reader.readAsDataURL(file);
      });

      if (p) {
        const imagePath = '/' + p.replace(/^\//, '');
        setSelectedImagePath(imagePath);
        await saveProfileImage(imagePath);
      }

      setUploading(false);
      return p;
    } catch (e) {
      setUploading(false);
      return null;
    }
  };

  const saveProfileImage = async (imagePath: string) => {
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: imagePath }),
      });
      if (res.ok) {
        const j = await res.json();
        setUser(j.user || user);
        try {
          const newImg = (j.user && j.user.profileImage) || null;
          window.dispatchEvent(new CustomEvent('profile-updated', { detail: { profileImage: newImg } }));
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const handleSave = async () => {
    let imagePath = selectedImagePath;
    if (imagePath === null) imagePath = undefined as any;
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: fullNameInput, profileImage: imagePath }),
      });
      if (res.ok) {
        const j = await res.json();
        setUser(j.user || user);
        setIsEditing(false);
        setIsEditingFullName(false);
        // notify other parts of the app (e.g., Navbar) about updated profile image
        try {
          const newImg = (j.user && j.user.profileImage) || null;
          window.dispatchEvent(new CustomEvent('profile-updated', { detail: { profileImage: newImg } }));
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-700">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  const displayedImage = session?.user?.image || user?.profileImage || '/logo.jpg';
  const previewImage = selectedImagePath || displayedImage;

  return (
    <div className="w-full min-h-screen relative bg-gray-100">

      <nav className="w-full position-sticky top-0 bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Blog Platform</h1>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Home
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

    

      <div className=" py-20">
        <div className="bg-white rounded-lg max-w-5xl mx-auto shadow-md p-8">
        <div className="flex items-center gap-6">
          <div className="w-28 h-28 rounded-full overflow-hidden border border-gray-200 relative cursor-pointer" onClick={() => fileInputRef.current?.click()} title="Click to upload image">
            <img src={previewImage} alt="Profile avatar" className="w-full h-full object-cover" />
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              await handleFileChange(f);
            }} />
          </div>

          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>{user?.fullName ?? session.user?.name}</span>
              
            </h2>
            <p className="text-gray-600">@{user?.username ?? session.user?.username}</p>
            <p className="text-gray-600">{user?.email ?? session.user?.email}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-500">Full Name</p>
            <div className="mt-1 flex items-center gap-2">
              {!isEditingFullName ? (
                <div className="flex items-center w-full">
                  <div className="flex-1 font-medium">{user?.fullName ?? session.user?.name}</div>
                  <button aria-label="Edit full name" className="text-gray-500 hover:text-gray-800" onClick={() => setIsEditingFullName(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path fillRule="evenodd" d="M2 15a1 1 0 011-1h9a1 1 0 110 2H3a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center w-full gap-2">
                  <input
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    className="flex-1 rounded border border-gray-300 p-2"
                  />
                  <button aria-label="Save full name" className="text-green-600 hover:text-green-800" onClick={handleSave}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414-1.414L7 12.172l-2.293-2.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l9-9z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button aria-label="Clear full name" className="text-red-600 hover:text-red-800" onClick={async () => { setFullNameInput(''); await handleSave(); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H3a1 1 0 100 2h14a1 1 0 100-2h-2V3a1 1 0 00-1-1H6zm2 7a1 1 0 012 0v5a1 1 0 11-2 0V9zm4 0a1 1 0 112 0v5a1 1 0 11-2 0V9z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-500">Username</p>
            <p className="font-medium">{user?.username ?? session.user?.username}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{user?.email ?? session.user?.email}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-500">Account status</p>
            <p className="font-medium text-green-600">{user?.isVerified ? 'Verified ✓' : 'Unverified'}</p>
            {user?.createdAt && (
              <p className="text-xs text-gray-500 mt-2">Created: {new Date(user.createdAt).toLocaleString()}</p>
            )}
          </div>
        </div>

       
      </div>
      </div>


      
    </div>
  );
}
