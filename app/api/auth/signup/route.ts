import { NextResponse } from "next/server";
import { hashPassword, generateOTP, getOTPExpiry } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";
import { createUser } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email, username, password, fullName } = await request.json();

    // Validation
    if (!email || !username || !password || !fullName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const otp = generateOTP();
    const expiry = getOTPExpiry();

    const user = await createUser({
      email,
      username,
      password: hashedPassword,
      fullName,
      otp,
      expiry,
    });

    // Send OTP email
    await sendOtpEmail(email, otp);

    return NextResponse.json(
      {
        message: "User created successfully. Please verify your email with the OTP sent.",
        username: user.username,
        email: user.email,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);

    if (error.message.includes("Unique constraint failed")) {
      return NextResponse.json(
        {
          error: error.message.includes("email")
            ? "Email already registered"
            : "Username already taken",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Error creating user" },
      { status: 500 }
    );
  }
}