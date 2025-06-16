import { NextRequest, NextResponse } from "next/server";
import { db, connect } from "@/lib/surreal";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

/**
 * GET /api/chats
 * Fetches a summary of all chat sessions.
 */
export async function GET() {
  try {
    await connect();

    const query = `
      SELECT
      id,
      (SELECT name, surname, patronymic, phone, (SELECT name_en FROM ->of_role->roles)[0].name_en as role FROM (SELECT VALUE out FROM participates WHERE in=$parent.id)) AS participants,
      (SELECT text, date_sent FROM messages WHERE ->belongs_to->chats.id CONTAINS $parent.id ORDER BY date_sent DESC LIMIT 1)[0] AS last_message,
      (SELECT * FROM messages WHERE ->belongs_to->chats.id CONTAINS $parent.id).len() AS message_count
      FROM chats;
    `;

    const result = (await db.query<any[]>(query))[0] || [];

    console.log(
      "Raw SurrealDB result:",
      JSON.stringify(result[0]?.last_message, null, 2),
    );

    const responseData = result.map((chat: any) => {
      const cadet = chat.participants.find((p: any) => p.role === "cadet");
      const instructor = chat.participants.find(
        (p: any) => p.role === "instructor",
      );

      return {
        id: chat.id,
        cadetName: cadet
          ? `${cadet.name} ${cadet.surname}`
          : "Неизвестный курсант",
        instructorName: instructor
          ? `${instructor.name} ${instructor.surname}`
          : "Неизвестный инструктор",
        lastMessage: chat.last_message?.text || "Нет сообщений.",
        lastMessageTime: chat.last_message?.date_sent || null,
        messageCount:
          typeof chat.message_count === "number" ? chat.message_count : 0,
        lastActivity: chat.last_message?.date_sent || null,
        cadetPhone: cadet?.phone || "N/A",
        instructorPhone: instructor?.phone || "N/A",
      };
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("GET Chats Error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}
