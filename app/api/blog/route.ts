import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { sanitizeInput, validateBlogContent, validateBlogTitle } from "@/lib/validation";
import { normalizeImageSrc } from "@/lib/utils";

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-");
}

const BLOG_STATUSES = new Set(["draft", "published"]);

function normalizeStoredImageValue(imagePath?: string | null) {
  const normalizedImagePath = normalizeImageSrc(imagePath, "");
  return normalizedImagePath || null;
}

type BlogUpdateBody = {
  id?: number;
  title?: string;
  description?: string;
  content?: string;
  tag?: string;
  status?: string;
  postImage?: string | null;
};

async function updateBlog(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = parseInt(token.id as string, 10);
  const body = (await req.json()) as BlogUpdateBody;
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Blog ID required" }, { status: 400 });
  }

  const blog = await prisma.blog.findUnique({ where: { id } });
  if (!blog || blog.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const updateData: {
    title?: string;
    description?: string;
    content?: string;
    tag?: string;
    status?: string;
    postImage?: string | null;
  } = {};

  if ("title" in body) {
    if (typeof body.title !== "string" || !validateBlogTitle(body.title)) {
      return NextResponse.json({ error: "Invalid blog title" }, { status: 400 });
    }

    updateData.title = sanitizeInput(body.title).slice(0, 255);
  }

  if ("description" in body) {
    if (typeof body.description !== "string") {
      return NextResponse.json({ error: "Invalid blog description" }, { status: 400 });
    }

    updateData.description = sanitizeInput(body.description);
  }

  if ("content" in body) {
    if (typeof body.content !== "string" || !validateBlogContent(body.content)) {
      return NextResponse.json({ error: "Invalid blog content" }, { status: 400 });
    }

    updateData.content = body.content;
  }

  if ("tag" in body) {
    if (typeof body.tag !== "string") {
      return NextResponse.json({ error: "Invalid blog tag" }, { status: 400 });
    }

    const nextTag = sanitizeInput(body.tag);
    updateData.tag = nextTag || "General";
  }

  if ("status" in body) {
    if (typeof body.status !== "string" || !BLOG_STATUSES.has(body.status)) {
      return NextResponse.json({ error: "Invalid blog status" }, { status: 400 });
    }

    updateData.status = body.status;
  }

  if ("postImage" in body) {
    if (body.postImage !== null && typeof body.postImage !== "string") {
      return NextResponse.json({ error: "Invalid blog image" }, { status: 400 });
    }

    updateData.postImage = normalizeStoredImageValue(body.postImage);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields provided for update" }, { status: 400 });
  }

  const updated = await prisma.blog.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    ok: true,
    blog: {
      ...updated,
      postImage: normalizeStoredImageValue(updated.postImage),
      profileImage: normalizeStoredImageValue(updated.profileImage),
    },
  });
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

    return NextResponse.json({
      posts: blogs.map((blog) => ({
        ...blog,
        postImage: normalizeStoredImageValue(blog.postImage),
        profileImage: normalizeStoredImageValue(blog.profileImage),
      })),
    });
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
        postImage: normalizeStoredImageValue(postImage),
        profileImage: normalizeStoredImageValue(body.profileImage || user.profileImage || null),
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
    return await updateBlog(req);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    return await updateBlog(req);
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
