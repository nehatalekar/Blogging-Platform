
import Image from "next/image";


export default function Footer() {
  return (
    <footer className=" w-full flex flex-col items-center justify-center gap-4 py-6  border-t border-gray-200 ">
      <div className="logo w-full h-full flex justify-center">
            <Image src="/logo.jpg" alt="Logo" width={100} height={100}
              className="rounded-full w-10 h-10" />
      </div> 
      <div className="container  text-center text-gray-600">
        &copy; {new Date().getFullYear()} NextBlog. All rights reserved
      </div>
    </footer>
  );
}