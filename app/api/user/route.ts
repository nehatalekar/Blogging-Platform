import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const id = parseInt(token.id as string, 10);

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      profileImage: true,
      isVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PUT(req: Request) {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const id = parseInt(token.id as string, 10);
  const body = await req.json();
  const { fullName, profileImage } = body;

  const data: any = {};
  if (typeof fullName === 'string') data.fullName = fullName;
  if (typeof profileImage === 'string') data.profileImage = profileImage;

  try {
    const updated = await prisma.user.update({ where: { id }, data });
    const profileImage = (updated as any).profileImage ?? null;
    return NextResponse.json({ ok: true, user: { id: updated.id, email: updated.email, username: updated.username, fullName: updated.fullName, profileImage, isVerified: updated.isVerified } });
  } catch (err) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
