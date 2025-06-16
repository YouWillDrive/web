import { NextRequest, NextResponse } from "next/server";
import { db, connect } from "@/lib/surreal";
import { RecordId } from "surrealdb";

/**
 * GET /api/chats/[id]
 * Fetches the full message history for a specific chat.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const tableName = id.includes(":") ? id.split(":")[0] : "chats";
  const recordId = id.includes(":") ? id.split(":")[1] : id;

  try {
    const chatId = new RecordId(tableName, recordId);
    await connect();

    const query = `
      SELECT *,
      (SELECT *, (SELECT name_en FROM ->of_role->roles)[0].name_en as role FROM (SELECT VALUE out FROM sent_by WHERE in = $parent.id)[0])[0] as sender
      FROM messages
      WHERE (SELECT VALUE id FROM ->belongs_to->chats.id) CONTAINS $chatId
      ORDER BY date_sent ASC;
    `;
    const result = await db.query<any[]>(query, { chatId });
    const messages = result[0] || [];

    console.log(
      "Raw messages from SurrealDB:",
      JSON.stringify(messages[0], null, 2),
    );

    // Return messages with raw date data for client-side formatting
    return NextResponse.json(messages);
  } catch (error) {
    console.error(`GET Chat ${id} Error:`, error);
    return NextResponse.json(
      { error: "Не удалось получить сообщения чата" },
      { status: 500 },
    );
  }
}
