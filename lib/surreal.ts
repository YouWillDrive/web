import { Surreal } from "surrealdb";

// Initialize a singleton SurrealDB instance.
const db = new Surreal();
let isConnected = false;

async function connect() {
  // The official driver handles existing connections, but we can add a simple flag
  // to avoid sending connection packets unnecessarily on every API call.
  if (!isConnected) {
    try {
      await db.connect(
        process.env.SURREAL_DB_URL || "ws://127.0.0.1:8000/rpc",
        {
          namespace: process.env.SURREAL_NS || "main",
          database: process.env.SURREAL_DB || "main",
          auth: {
            username: process.env.SURREAL_USER || "root",
            password: process.env.SURREAL_PASS || "root",
          },
        },
      );
      isConnected = true;
      console.log("Connected to SurrealDB");
    } catch (e) {
      console.error("SurrealDB connection failed:", e);
      isConnected = false; // Ensure we try to reconnect next time
      throw e; // Re-throw to be handled by the API route
    }
  }
}

/**
 * Normalizes a phone number to a standard format (+7XXXXXXXXXX).
 * @param phone The input phone number string.
 * @returns The normalized phone number.
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("8") && digits.length === 11) {
    return "+7" + digits.substring(1);
  }
  if (digits.startsWith("7") && digits.length === 11) {
    return "+" + digits;
  }
  if (digits.length === 10) {
    return "+7" + digits;
  }
  return "+" + digits;
}

export { db, connect, normalizePhone };
