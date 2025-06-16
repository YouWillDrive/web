import { NextResponse } from "next/server";
import { db, connect } from "@/lib/surreal";

export async function GET() {
  await connect();
  const result = await db.query(
    "SELECT * FROM (SELECT *, (SELECT name_en FROM ->of_role->roles)[0].name_en AS role FROM users) WHERE role = 'instructor'",
  );
  return NextResponse.json(result[0] || []);
}
