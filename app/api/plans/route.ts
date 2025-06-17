import { NextRequest, NextResponse } from "next/server";
import { db, connect } from "@/lib/surreal";

export async function GET() {
  await connect();
  const result = await db.select("plan");
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    await connect();
    const body = await request.json();
    const { name, practice_hours, theory_hours, price } = body;

    // Basic validation
    if (!name || !practice_hours || price === undefined) {
      return NextResponse.json(
        { error: "Название, часы практики и стоимость обязательны" },
        { status: 400 },
      );
    }

    // Create the plan
    const [plan] = await db.create("plan", {
      name,
      practice_hours: Number(practice_hours),
      theory_hours: Number(theory_hours || 0),
      price: Number(price),
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("Plan creation error:", error);
    return NextResponse.json(
      { error: "Не удалось создать план оплаты" },
      { status: 500 },
    );
  }
}
