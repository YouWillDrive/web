import { NextRequest, NextResponse } from "next/server";
import { db, connect, normalizePhone } from "@/lib/surreal";

// GET function remains the same as before.
export async function GET() {
  try {
    await connect();
    const [usersResult] = await db.query<any[]>(`
      SELECT
        id,
        name,
        surname,
        patronymic,
        phone,
        (SELECT name_en FROM ->of_role->roles)[0].name_en as role
      FROM users;
    `);

    return NextResponse.json(usersResult || []);
  } catch (error) {
    console.error("GET Users Error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/users
 * Creates a new user and links them to roles/profiles sequentially.
 * NOTE: This operation is NOT ATOMIC without transactions.
 */
export async function POST(request: NextRequest) {
  try {
    await connect();
    const body = await request.json();
    const { firstName, lastName, patronymic, phone, password, role } = body;

    // Basic validation
    if (!firstName || !lastName || !phone || !password || !role) {
      return NextResponse.json(
        { error: "Все поля обязательны" },
        { status: 400 },
      );
    }

    const [passwordHashResult] = await db.query<[string]>(
      "SELECT * FROM crypto::blake3($password)",
      { password },
    );
    const passwordHash = passwordHashResult[0];

    // Step 1: Create the user
    const [user] = await db.create("users", {
      name: firstName,
      surname: lastName,
      patronymic,
      phone: normalizePhone(phone),
      password_hash: passwordHash,
      email: `${normalizePhone(phone)}@youwilldrive.alt`,
      avatar: "",
    });

    if (!user || !user.id) {
      throw new Error("User creation failed.");
    }

    // Step 2: Find the role ID
    const [roleResult] = await db.query<[any[]]>(
      "SELECT id FROM roles WHERE name_en = $role",
      { role },
    );
    if (roleResult[0].length === 0) {
      // Cleanup: delete the created user if role not found
      await db.delete(user.id);
      throw new Error(`Role '${role}' not found`);
    }
    const roleRecordId = roleResult[0].id;

    // Step 3: Relate user to the role
    await db.query("RELATE $user->of_role->$role", {
      user: user.id,
      role: roleRecordId,
    });

    // Step 4: Create role-specific record and relate it
    if (role === "cadet" || role === "instructor") {
      const roleSpecificRecord = (await db.create(role as any, {})) as any;
      if (roleSpecificRecord.length === 0) {
        // Cleanup: More complex cleanup needed here in a real scenario
        throw new Error(`Failed to create ${role} record.`);
      }
      await db.query(`RELATE $user->is_${role}->$roleSpecific`, {
        user: user.id,
        roleSpecific: roleSpecificRecord[0].id,
      });
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("POST User Error:", error);
    return NextResponse.json(
      { error: "Не удалось создать пользователя" },
      { status: 500 },
    );
  }
}
