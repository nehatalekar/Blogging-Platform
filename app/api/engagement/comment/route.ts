import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { normalizeImageSrc } from "@/lib/utils";

type CommentWithUserProfile = {
  user: {
    profileImage?: string | null;
  };
};

function normalizeCommentUserImage<T extends CommentWithUserProfile>(comment: T): T {
  return {
    ...comment,
    user: {
      ...comment.user,
      profileImage: normalizeImageSrc(comment.user.profileImage, "") || null,
    },
  };
}

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
      return NextResponse.json({ error: "User must be verified to comment on blogs" }, { status: 403 });
    }

    const userId = parseInt(token.id as string, 10);
    const { blogId, content } = await req.json();

    if (!blogId || !content) {
      return NextResponse.json({ error: "Blog ID and content required" }, { status: 400 });
    }

    if (content.trim().length === 0) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }

    // Check if blog exists and is published
    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
    if (!blog || blog.status !== "published") {
      return NextResponse.json({ error: "Blog not found or not published" }, { status: 404 });
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: { userId, blogId, content: content.trim() },
      include: {
        user: { select: { id: true, username: true, fullName: true, profileImage: true } },
      },
    });

    return NextResponse.json({ ok: true, comment: normalizeCommentUserImage(comment) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const blogId = searchParams.get("blogId");

    if (!blogId) {
      return NextResponse.json({ error: "Blog ID required" }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { blogId: parseInt(blogId) },
      include: {
        user: { select: { id: true, username: true, fullName: true, profileImage: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ count: comments.length, comments: comments.map(normalizeCommentUserImage) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = parseInt(token.id as string, 10);
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID required" }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({ where: { id: parseInt(commentId) } });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if user owns the comment
    if (comment.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: parseInt(commentId) } });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
