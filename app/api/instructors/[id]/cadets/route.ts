import { NextRequest, NextResponse } from "next/server";
import { db, connect } from "@/lib/surreal";
import { RecordId } from "surrealdb";

/**
 * GET /api/instructors/[id]/cadets
 * Fetches the current list of cadets assigned to a specific instructor.
 * A cadet is considered assigned to an instructor if the latest plan_history
 * record for that cadet is linked to the specified instructor.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connect();

    const { id: instructorUserIdStr } = await params;
    const [tableName, recordId] = instructorUserIdStr.split(":");
    const instructorUserId = new RecordId(tableName, recordId);

    const query = `
      SELECT * FROM (SELECT
      (SELECT * FROM (SELECT <-is_cadet<-users AS user FROM $parent)[0].user[0])[0] as user,
      hours_already,
      (SELECT * FROM <-of_cadet<-plan_history ORDER BY date_time DESC LIMIT 1)[0]->assigned_instructor->instructor[0][0]<-is_instructor<-users[0][0].id as instructor_id
      FROM cadet) WHERE instructor_id = $instructor_id
    `;

    let [cadetsResult] = await db.query<any[]>(query, {
      instructor_id: instructorUserId,
    });

    cadetsResult = cadetsResult.map((cadet: any) => cadet.user);

    return NextResponse.json(cadetsResult || []);
  } catch (error) {
    console.error(`GET Instructor Cadets ${(await params).id} Error:`, error);
    return NextResponse.json(
      { error: "Не удалось получить список курсантов инструктора" },
      { status: 500 },
    );
  }
}
