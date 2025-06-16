import { NextResponse } from "next/server";
import { db, connect } from "@/lib/surreal";

export async function GET(request: Request) {
  try {
    await connect();

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    let query = `
      SELECT
          id,
          date_time AS date,
          (SELECT * FROM ->of_type->event_types LIMIT 1)[0] AS eventType,
          (
            SELECT id, name, surname, patronymic
            FROM (->event_of_cadet->cadet<-is_cadet<-users)
            LIMIT 1
          )[0] AS cadet,
          (
            SELECT id, name, surname, patronymic
            FROM (->event_of_instructor->instructor<-is_instructor<-users)
            LIMIT 1
          )[0] AS instructor
      FROM event
    `;

    // Add date filtering if year and month are provided
    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month), 1);
      const endDate = new Date(
        parseInt(year),
        parseInt(month) + 1,
        0,
        23,
        59,
        59,
      );

      query += ` WHERE date_time >= $startDate AND date_time <= $endDate`;

      const [eventsResult] = await db.query<any[]>(query, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      return NextResponse.json(eventsResult || []);
    } else {
      // Return all events if no date filter is specified
      query += `;`;
      const [eventsResult] = await db.query<any[]>(query);
      return NextResponse.json(eventsResult || []);
    }
  } catch (error) {
    console.error("GET Events Error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}
