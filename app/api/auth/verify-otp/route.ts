import { NextResponse } from "next/server";
import { verifyOtp, resendOtp } from "@/lib/db";
import { generateOTP, getOTPExpiry } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";
import { getUserByEmailOrUsername } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { username, otp } = await request.json();

    if (!username || !otp) {
      return NextResponse.json(
        { error: "Username and OTP are required" },
        { status: 400 }
      );
    }

    const user = await verifyOtp(username, otp);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Email verified successfully. You can now login.",
        username: user.username,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: error.message || "Error verifying OTP" },
      { status: 500 }
    );
  }
}

// Resend OTP endpoint
export async function PUT(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const user = await getUserByEmailOrUsername(username);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: "User is already verified" },
        { status: 400 }
      );
    }

    const newOtp = generateOTP();
    const newExpiry = getOTPExpiry();

    await resendOtp(username, newOtp, newExpiry);
    await sendOtpEmail(user.email, newOtp);

    return NextResponse.json(
      { message: "OTP resent successfully to your email" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { error: error.message || "Error resending OTP" },
      { status: 500 }
    );
  }
}
