import { NextResponse } from "next/server";

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Handle API errors consistently
 */
export function handleAPIError(error: unknown) {
  if (error instanceof APIError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    console.error("API Error:", error.message);

    // Prisma errors
    if ((error as any).code === "P2002") {
      return NextResponse.json(
        { error: "Resource already exists" },
        { status: 409 }
      );
    }

    if ((error as any).code === "P2025") {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // Generic error in development, vague in production
    const message =
      process.env.NODE_ENV === "development"
        ? error.message
        : "An error occurred. Please try again.";

    return NextResponse.json({ error: message }, { status: 500 });
  }

  console.error("Unexpected error:", error);
  return NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  );
}

/**
 * Handle async route handler errors
 */
export function withErrorHandling(
  handler: (req: Request) => Promise<NextResponse>
) {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error) {
      return handleAPIError(error);
    }
  };
}
