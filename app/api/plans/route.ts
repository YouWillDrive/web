import { NextResponse } from "next/server";
import { db, connect } from "@/lib/surreal";

export async function GET() {
  await connect();
  const result = await db.select("plan");
  return NextResponse.json(result);
}
