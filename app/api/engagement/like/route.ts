import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });

    // Check if user is authenticated
    if (!token || !token.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is verified
    const user = await prisma.user.findUnique({ where: { id: parseInt(token.id as string) } });
    if (!user || !user.isVerified) {
      return NextResponse.json({ error: "User must be verified to like blogs" }, { status: 403 });
    }

    const userId = parseInt(token.id as string, 10);
    const { blogId } = await req.json();

    if (!blogId) {
      return NextResponse.json({ error: "Blog ID required" }, { status: 400 });
    }

    // Check if blog exists and is published
    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
    if (!blog || blog.status !== "published") {
      return NextResponse.json({ error: "Blog not found or not published" }, { status: 404 });
    }

    // Check if user already liked this blog
    const existingLike = await prisma.like.findUnique({
      where: { userId_blogId: { userId, blogId } },
    });

    if (existingLike) {
      // Unlike the blog
      await prisma.like.delete({ where: { id: existingLike.id } });
      return NextResponse.json({ ok: true, action: "unliked" });
    } else {
      // Like the blog
      await prisma.like.create({ data: { userId, blogId } });
      return NextResponse.json({ ok: true, action: "liked" });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const blogId = parseInt(searchParams.get("blogId") || "0", 10);
  const token = await getToken({ req: req as any });
  const count = await prisma.like.count({ where: { blogId } });

  let likedByMe = false;
  if (token?.id) {
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_blogId: {
          userId: parseInt(token.id as string, 10),
          blogId,
        },
      },
    });
    likedByMe = !!existingLike;
  }

  return NextResponse.json({ count, likedByMe });
}
