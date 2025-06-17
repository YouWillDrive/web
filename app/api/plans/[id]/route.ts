import { NextRequest, NextResponse } from "next/server";
import { db, connect } from "@/lib/surreal";
import { RecordId } from "surrealdb";

/**
 * PUT /api/plans/[id]
 * Updates an existing payment plan.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connect();
    const { id } = await params;
    const planId = new RecordId(id.split(":")[0], id.split(":")[1]);
    const body = await request.json();
    const { name, practice_hours, theory_hours, price } = body;

    const updateData: Record<string, any> = {};

    if (name !== undefined) updateData.name = name;
    if (practice_hours !== undefined)
      updateData.practice_hours = Number(practice_hours);
    if (theory_hours !== undefined)
      updateData.theory_hours = Number(theory_hours);
    if (price !== undefined) updateData.price = Number(price);

    // Check if plan exists
    const existingPlan = await db.select(planId);
    if (!existingPlan || existingPlan.length === 0) {
      return NextResponse.json(
        { error: "План оплаты не найден" },
        { status: 404 },
      );
    }

    // Update the plan
    const updatedPlan = await db.merge(planId, updateData);

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error(`PUT Plan ${params.id} Error:`, error);
    return NextResponse.json(
      { error: "Не удалось обновить план оплаты" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/plans/[id]
 * Deletes a payment plan.
 * Note: Should check for dependencies before deletion in a real system.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connect();
    const { id } = await params;
    const planId = new RecordId(id.split(":")[0], id.split(":")[1]);

    // Check if plan exists
    const existingPlan = await db.select(planId);
    if (!existingPlan || existingPlan.length === 0) {
      return NextResponse.json(
        { error: "План оплаты не найден" },
        { status: 404 },
      );
    }

    // Check if plan is in use by any cadet
    const [dependencies] = await db.query<[any[]]>(
      `SELECT id FROM plan_history WHERE ->related_plan->plan CONTAINS $plan`,
      { plan: planId },
    );

    if (dependencies && dependencies.length > 0) {
      return NextResponse.json(
        {
          error: "Невозможно удалить план, так как он используется курсантами",
          dependenciesCount: dependencies.length,
        },
        { status: 409 },
      );
    }

    // Delete the plan
    await db.delete(planId);

    return NextResponse.json({
      message: "План оплаты успешно удален",
    });
  } catch (error) {
    console.error(`DELETE Plan ${params.id} Error:`, error);
    return NextResponse.json(
      { error: "Не удалось удалить план оплаты" },
      { status: 500 },
    );
  }
}
