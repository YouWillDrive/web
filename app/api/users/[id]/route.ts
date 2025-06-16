import { NextRequest, NextResponse } from "next/server";
import { db, connect } from "@/lib/surreal";
import { RecordId } from "surrealdb";

/**
 * PUT /api/users/[id]
 * Updates an existing user's details.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = await params;
  try {
    await connect();
    const userId = new RecordId(id.split(":")[0], id.split(":")[1]);
    const body = await request.json();
    const { firstName, lastName, patronymic, phone, password } = body;

    const dataToUpdate: Record<string, any> = {
      name: firstName,
      surname: lastName,
      patronymic,
      phone,
    };

    if (password) {
      const [passwordHashResult] = await db.query<[string]>(
        "SELECT * FROM crypto::blake3($password)",
        { password },
      );
      if (passwordHashResult as any) {
        dataToUpdate.password_hash = passwordHashResult[0];
      }
    }

    const updatedUser = await db.merge(userId, dataToUpdate);

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(`PUT User ${params.id} Error:`, error);
    return NextResponse.json(
      { error: "Не удалось обновить пользователя" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Deletes a user and all related records.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = await params;
  try {
    await connect();
    const userId = new RecordId(id.split(":")[0], id.split(":")[1]);

    // Get user role to determine cleanup strategy
    const [userResult] = await db.query<any[]>(
      `SELECT (SELECT name_en FROM ->of_role->roles)[0].name_en as role FROM $user`,
      { user: userId },
    );

    if (!userResult || userResult.length === 0) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 },
      );
    }

    const userRole = userResult[0].role;

    // Delete role-specific records first
    if (userRole === "cadet") {
      // Delete cadet-specific records
      await db.query(
        `DELETE FROM plan_history WHERE ->of_cadet->cadet IN (SELECT ->is_cadet->cadet FROM $user)`,
        { user: userId },
      );
      await db.query(
        `DELETE FROM cadet WHERE id IN (SELECT ->is_cadet->cadet FROM $user)`,
        { user: userId },
      );
    } else if (userRole === "instructor") {
      // Delete instructor car relations
      await db.query(
        `DELETE FROM uses_car WHERE in IN (SELECT ->is_instructor->instructor FROM $user)`,
        { user: userId },
      );
      await db.query(
        `DELETE FROM instructor WHERE id IN (SELECT ->is_instructor->instructor FROM $user)`,
        { user: userId },
      );
    }

    // Delete user relations
    await db.query(`DELETE FROM of_role WHERE in = $user`, { user: userId });
    await db.query(`DELETE FROM is_cadet WHERE in = $user`, { user: userId });
    await db.query(`DELETE FROM is_instructor WHERE in = $user`, {
      user: userId,
    });

    // Finally delete the user
    await db.delete(userId);

    return NextResponse.json({
      message: "Пользователь успешно удален",
    });
  } catch (error) {
    console.error(`DELETE User ${params.id} Error:`, error);
    return NextResponse.json(
      { error: "Не удалось удалить пользователя" },
      { status: 500 },
    );
  }
}
