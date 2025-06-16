import { NextRequest, NextResponse } from "next/server";
import { db, connect } from "@/lib/surreal";

/**
 * POST /api/instructors/[id]/config
 * Configures instructor cars by deleting old relations and adding new ones.
 * NOTE: This operation is NOT ATOMIC without transactions.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const instructorId = `instructor:${params.id}`;
    const { cars } = await request.json();

    if (!Array.isArray(cars)) {
      return NextResponse.json(
        { error: "Неверный формат данных" },
        { status: 400 },
      );
    }

    await connect();

    // Step 1: Delete all existing car relations for this instructor
    await db.query("DELETE has_car WHERE in = $instructor", {
      instructor: instructorId,
    });

    // Step 2: Iterate and process each car sequentially
    for (const carData of cars) {
      // Find existing car or create a new one
      const [carResult] = await db.query<[any]>(
        "SELECT * FROM cars WHERE car_number = $plate",
        { plate: carData.plateNumber },
      );
      let carRecord = carResult.status === "OK" ? carResult.result : null;

      if (!carRecord) {
        [carRecord] = await db.create("cars", {
          model: carData.model,
          car_number: carData.plateNumber,
          color: carData.color,
        });
      } else {
        // If car exists, ensure its details are up-to-date
        await db.merge(carRecord.id, {
          model: carData.model,
          color: carData.color,
        });
      }

      if (!carRecord || !carRecord.id) {
        console.error("Failed to create or find car record for", carData);
        continue; // Skip to the next car if this one fails
      }

      // Relate the car to the instructor
      await db.query("RELATE $instructor->has_car->$car", {
        instructor: instructorId,
        car: carRecord.id,
      });
    }

    return NextResponse.json({
      message: "Автомобили инструктора успешно обновлены",
    });
  } catch (error) {
    console.error(`POST Instructor Config ${params.id} Error:`, error);
    return NextResponse.json(
      { error: "Не удалось настроить инструктора" },
      { status: 500 },
    );
  }
}
