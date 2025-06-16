import { NextRequest, NextResponse } from "next/server";
import { db, connect } from "@/lib/surreal";
import { RecordId } from "surrealdb";

/**
 * GET /api/cadets/[id]/config
 * Fetches the current configuration for a cadet
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;
    const [tableName, recordId] = id.split(":");
    const userRecordId = new RecordId(tableName, recordId);
    const assignedCadet = (
      await db.query<any[][]>(
        `
      SELECT (SELECT * FROM ->is_cadet->cadet) AS assigned_cadet FROM $id
      `,
        { id: userRecordId },
      )
    )[0][0]["assigned_cadet"];

    const cadetRecordId = assignedCadet[0].id;

    // Get the latest configuration for the cadet
    const [configResult] = await db.query<[any[]]>(
      `
      SELECT
          hours_already,
          (SELECT * FROM <-of_cadet<-plan_history ORDER BY date_time DESC LIMIT 1)[0].bonus_hours as bonus_hours,
          (SELECT * FROM <-of_cadet<-plan_history ORDER BY date_time DESC LIMIT 1)[0]->assigned_instructor->instructor[0][0]<-is_instructor<-users[0][0].id as instructor_id,
          (SELECT * FROM <-of_cadet<-plan_history ORDER BY date_time DESC LIMIT 1)[0]->related_plan->plan[0][0] as payment_plan,
          (SELECT * FROM <-of_cadet<-plan_history ORDER BY date_time DESC LIMIT 1)[0]->related_transmission->transmissions[0].name[0] as transmission_name
      FROM $cadet;
      `,
      { cadet: cadetRecordId },
    );

    if (!configResult || configResult.length === 0) {
      // Return default values if no configuration exists
      return NextResponse.json({
        paymentPlan: "",
        instructorId: "",
        isAutomatic: false,
        spentHours: 0,
        bonusHours: 0,
      });
    }

    const config = configResult[0];

    return NextResponse.json({
      paymentPlan: config.payment_plan || "",
      instructorId: config.instructor_id
        ? config.instructor_id.tb + ":" + config.instructor_id.id
        : "",
      isAutomatic: config.transmission_name === "Автоматическая",
      spentHours: config.hours_already || 0,
      bonusHours: config.bonus_hours || 0,
    });
  } catch (error) {
    const { id } = await params;
    console.error(`GET Cadet Config ${id} Error:`, error);
    return NextResponse.json(
      { error: "Не удалось получить конфигурацию курсанта" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/cadets/[id]/config
 * Configures a cadet by creating and linking records sequentially.
 * NOTE: This operation is NOT ATOMIC without transactions.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await connect();

    const { id } = await params;
    const cadetRecordId = (
      (
        await db.query(
          `SELECT (SELECT id FROM ->is_cadet->cadet)[0].id AS id FROM ${id}`,
        )
      )[0] as any
    )[0].id;

    const body = await request.json();
    const { paymentPlan, instructorId, isAutomatic, spentHours, bonusHours } =
      body;

    const newInstructorId = (
      (
        await db.query(
          `SELECT (SELECT id FROM ->is_instructor->instructor)[0].id AS id FROM ${instructorId}`,
        )
      )[0] as any
    )[0].id;

    // Step 1: Update the cadet's spent hours
    await db.merge(cadetRecordId, { hours_already: Number(spentHours) || 0 });

    // Step 2: Get the transmission ID
    const transmissionName = isAutomatic ? "Автоматическая" : "Механическая";
    const [transmissionResult] = await db.query<[object[]]>(
      "SELECT id FROM transmissions WHERE name = $name",
      { name: transmissionName },
    );
    if (transmissionResult.length === 0) {
      return NextResponse.json(
        { error: `Тип трансмиссии '${transmissionName}' не найден` },
        { status: 404 },
      );
    }
    const transmissionId = (transmissionResult as any)[0].id;

    // Step 3: Create the history point record
    const [historyPoint] = await db.create("plan_history", {
      date_time: new Date(),
      bonus_hours: Number(bonusHours) || 0,
    });

    if (!historyPoint || !historyPoint.id) {
      throw new Error("Failed to create plan history point.");
    }

    // Step 4: Create all relations sequentially
    await db.query("RELATE $history->of_cadet->$cadet", {
      history: historyPoint.id,
      cadet: cadetRecordId,
    });
    await db.query("RELATE $history->assigned_instructor->$instructor", {
      history: historyPoint.id,
      instructor: newInstructorId,
    });
    await db.query("RELATE $history->related_plan->$plan", {
      history: historyPoint.id,
      plan: new RecordId(paymentPlan.split(":")[0], paymentPlan.split(":")[1]),
    });
    await db.query("RELATE $history->related_transmission->$transmission", {
      history: historyPoint.id,
      transmission: transmissionId,
    });

    return NextResponse.json({
      message: "Конфигурация курсанта успешно сохранена",
    });
  } catch (error) {
    const { id } = await params;
    console.error(`POST Cadet Config ${id} Error:`, error);
    return NextResponse.json(
      { error: "Не удалось настроить курсанта" },
      { status: 500 },
    );
  }
}
