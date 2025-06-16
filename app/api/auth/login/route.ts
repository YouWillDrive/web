import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { db, connect, normalizePhone } from "@/lib/surreal";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production",
);

export async function POST(request: NextRequest) {
  try {
    await connect();
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { error: "Номер телефона и пароль обязательны" },
        { status: 400 },
      );
    }

    const normalizedPhone = normalizePhone(phone);

    const passwordHashResult = await db.query<[string[]]>(
      "SELECT * FROM crypto::blake3($password)",
      { password },
    );
    const passwordHash = passwordHashResult[0] as any;

    if (!passwordHash) {
      return NextResponse.json(
        { error: "Ошибка сервера при обработке пароля" },
        { status: 500 },
      );
    }

    const userResult = await db.query<[any[]]>(
      "SELECT *, (SELECT name_en FROM ->of_role->roles)[0].name_en as role FROM users WHERE phone = $phone AND password_hash = $hash",
      { phone: normalizedPhone, hash: passwordHash[0] },
    );
    const user = userResult[0][0];

    if (!user) {
      return NextResponse.json(
        { error: "Неверный номер телефона или пароль" },
        { status: 401 },
      );
    }

    const token = await new SignJWT({
      userId: user.id,
      phone: user.phone,
      name: `${user.name} ${user.surname}`,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    (await cookies()).set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: `${user.name} ${user.surname}`,
        role: user.role,
      },
      message: "Успешный вход в систему",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}
