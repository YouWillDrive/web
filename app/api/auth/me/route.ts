import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production",
);

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Return user info from token
    return NextResponse.json({
      user: {
        id: payload.userId,
        phone: payload.phone,
        name: payload.name,
        role: payload.role,
      },
    });
  } catch (error) {
    console.error("Auth verification error:", error);

    // Clear invalid cookie
    const cookieStore = await cookies();
    cookieStore.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return NextResponse.json(
      { error: "Недействительный токен" },
      { status: 401 },
    );
  }
}
