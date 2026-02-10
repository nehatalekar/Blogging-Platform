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
      return NextResponse.json({ error: "User must be verified to save blogs" }, { status: 403 });
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

    // Check if user already saved this blog
    const existingSave = await prisma.save.findUnique({
      where: { userId_blogId: { userId, blogId } },
    });

    if (existingSave) {
      // Unsave the blog
      await prisma.save.delete({ where: { id: existingSave.id } });
      return NextResponse.json({ ok: true, action: "unsaved" });
    } else {
      // Save the blog
      await prisma.save.create({ data: { userId, blogId } });
      return NextResponse.json({ ok: true, action: "saved" });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = parseInt(token.id as string, 10);
    const { searchParams } = new URL(req.url);
    const blogId = searchParams.get("blogId");

    // Get saved articles by user
    if (!blogId) {
      const saves = await prisma.save.findMany({
        where: { userId },
        include: {
          blog: {
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              postImage: true,
              author: true,
              tag: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ count: saves.length, saves });
    } else {
      // Check if specific blog is saved by user
      const save = await prisma.save.findUnique({
        where: { userId_blogId: { userId, blogId: parseInt(blogId) } },
      });

      return NextResponse.json({ isSaved: !!save });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
