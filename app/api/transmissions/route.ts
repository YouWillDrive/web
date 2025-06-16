import { NextResponse } from "next/server";
import { db, connect } from "@/lib/surreal";

export async function GET() {
  await connect();
  const result = await db.select("transmissions");
  return NextResponse.json(result);
}
