import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createUser(data: {
  email: string;
  username: string;
  password: string;
  fullName: string;
  otp: string;
  expiry: number;
}) {
  try {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: data.password,
        fullName: data.fullName,
        otp: data.otp,
        expiry: BigInt(data.expiry),
        isVerified: false,
      },
    });
    return user;
  } catch (error: any) {
    throw new Error(
      error.meta?.cause || `Error creating user: ${error.message}`
    );
  }
}

export async function getUserByEmailOrUsername(identifier: string) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });
    return user;
  } catch (error: any) {
    throw new Error(`Error fetching user: ${error.message}`);
  }
}

export async function verifyOtp(identifier: string, otp: string) {
  try {
    // Resolve by email or username so callers can pass either
    const user = await getUserByEmailOrUsername(identifier);

    if (
      user &&
      user.otp === otp &&
      user.expiry &&
      user.expiry > BigInt(Date.now())
    ) {
      // Update by unique id to avoid mismatches when identifier was an email
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true, otp: null, expiry: null },
      });
      return user;
    }
    return null;
  } catch (error: any) {
    throw new Error(`Error verifying OTP: ${error.message}`);
  }
}

export async function resendOtp(identifier: string, otp: string, expiry: number) {
  try {
    const user = await getUserByEmailOrUsername(identifier);

    if (!user) {
      throw new Error("User not found");
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        expiry: BigInt(expiry),
      },
    });
    return updated;
  } catch (error: any) {
    throw new Error(`Error resending OTP: ${error.message}`);
  }
}
