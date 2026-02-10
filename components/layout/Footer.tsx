
import Image from "next/image";


export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12 px-4 border-t border-gray-700">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.jpg" alt="Logo" width={100} height={100}
                className="rounded-full w-10 h-10 border-2 border-blue-400" />
              <span className="font-bold text-xl">Blog.</span>
            </div>
            <p className="text-gray-300 text-sm">Share your stories with the world. Discover inspiring content from our community.</p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-lg mb-2">Quick Links</h3>
            <a href="/" className="text-gray-300 hover:text-white transition-colors text-sm">Home</a>
            <a href="/dashboard" className="text-gray-300 hover:text-white transition-colors text-sm">Dashboard</a>
            <a href="/profile" className="text-gray-300 hover:text-white transition-colors text-sm">Profile</a>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-lg mb-2">Legal</h3>
            <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Terms of Service</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Contact</a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} Blog Platform. All rights reserved</p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Facebook</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">LinkedIn</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}