import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-");
}

export async function GET(req: Request) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = parseInt(token.id as string, 10);

    // Get only blogs created by the authenticated user
    const blogs = await prisma.blog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ posts: blogs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = parseInt(token.id as string, 10);
    const body = await req.json();
    const { title = "Untitled", description = "", postImage = "", content = "", status = "published", tag = "General" } = body;

    // Fetch user to get profile image and full name
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let slug = body.slug || slugify(title) || `post-${Date.now()}`;

    // Ensure unique slug
    let existingBlog = await prisma.blog.findUnique({ where: { slug } });
    let counter = 1;
    while (existingBlog) {
      const newSlug = `${slug}-${counter}`;
      existingBlog = await prisma.blog.findUnique({ where: { slug: newSlug } });
      if (!existingBlog) slug = newSlug;
      counter++;
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        description,
        content,
        author: body.author || user.fullName || "Admin",
        postImage: postImage || null,
        profileImage: body.profileImage || user.profileImage || null,
        tag,
        status,
        userId,
      },
    });

    return NextResponse.json({ ok: true, blog });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = parseInt(token.id as string, 10);
    const body = await req.json();
    const { id, slug, title = "Untitled", description = "", postImage = "", content = "", status = "published", tag = "General" } = body;

    if (!id) return NextResponse.json({ error: "Blog ID required" }, { status: 400 });

    // Verify blog belongs to user
    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog || blog.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updated = await prisma.blog.update({
      where: { id },
      data: {
        title,
        slug: slug || blog.slug,
        description,
        content,
        postImage: postImage || blog.postImage,
        profileImage: body.profileImage || blog.profileImage,
        tag,
        status,
      },
    });

    return NextResponse.json({ ok: true, blog: updated });
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
    const slug = searchParams.get("slug");
    const id = searchParams.get("id");

    if (!slug && !id) return NextResponse.json({ error: "slug or id required" }, { status: 400 });

    const blog = await prisma.blog.findFirst({
      where: slug ? { slug } : { id: parseInt(id!) },
    });

    if (!blog || blog.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.blog.delete({ where: { id: blog.id } });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
