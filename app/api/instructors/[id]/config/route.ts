import { NextRequest, NextResponse } from "next/server";
import { db, connect } from "@/lib/surreal";
import { RecordId } from "surrealdb";

/**
 * GET /api/instructors/[id]/config
 * Fetches all cars associated with a specific instructor.
 * The `id` in the path is the user's ID, not the instructor's direct ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const typedUserId = new RecordId(id.split(":")[0], id.split(":")[1]);
    await connect();

    // This SurrealQL query navigates from the user, through the is_instructor relation,
    // to the instructor record, then through the has_car relation to fetch all linked cars.
    const [queryResult] = await db.query<[any[]]>(
      `SELECT VALUE (SELECT * FROM ->is_instructor->instructor->has_car->cars) FROM $userId`,
      { userId: typedUserId },
    );

    const carsFromDb = queryResult?.[0] || [];

    // Map the database fields to the frontend model to ensure consistency.
    const carsForFrontend = carsFromDb.map((car: any) => ({
      id: car.id,
      model: car.model,
      plateNumber: car.car_number, // Mapping car_number to plateNumber
      color: car.color,
    }));

    return NextResponse.json(carsForFrontend);
  } catch (error) {
    console.error(`GET Instructor Config (Cars) Error:`, error);
    return NextResponse.json(
      { error: "Не удалось получить автомобили инструктора" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/instructors/[id]/config
 * Configures instructor cars by deleting old relations and adding new ones.
 * The `id` in the path is the user's ID.
 * NOTE: This operation is NOT ATOMIC without transactions.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { cars } = await request.json();
    const { id } = await params;
    const typedUserId = new RecordId(id.split(":")[0], id.split(":")[1]);

    if (!Array.isArray(cars)) {
      return NextResponse.json(
        { error: "Неверный формат данных, 'cars' должен быть массивом" },
        { status: 400 },
      );
    }

    await connect();

    // Step 1: Get the instructor record ID from the user ID
    const [instructorIdResult] = await db.query<[string[]]>(
      `SELECT VALUE ->is_instructor->instructor.id FROM $userId`,
      { userId: typedUserId },
    );
    const instructorId = instructorIdResult?.[0][0];

    if (!instructorId) {
      return NextResponse.json(
        { error: "Инструктор не найден для данного пользователя" },
        { status: 404 },
      );
    }

    // Step 2: Delete all existing car relations for this instructor
    await db.query("DELETE has_car WHERE in = $instructor", {
      instructor: instructorId,
    });

    // Step 3: Iterate and process each car sequentially
    for (const carData of cars) {
      // Find existing car by its plate number
      const [selectResult] = await db.query<any[]>(
        "SELECT * FROM cars WHERE car_number = $plate",
        { plate: carData.plateNumber },
      );

      let carRecord = selectResult?.[0];

      if (!carRecord) {
        // Car doesn't exist, create it.
        const [createdCar] = await db.create("cars", {
          model: carData.model,
          car_number: carData.plateNumber,
          color: carData.color,
        });
        carRecord = createdCar;
      } else {
        // Car exists, update its model and color.
        await db.merge(carRecord.id, {
          model: carData.model,
          color: carData.color,
        });
      }

      if (!carRecord?.id) {
        console.error("Failed to create or find car record for", carData);
        continue; // Skip to the next car if this one fails
      }

      // Step 4: Relate the car to the instructor
      await db.query("RELATE $instructor->has_car->$car", {
        instructor: instructorId,
        car: carRecord.id,
      });
    }

    return NextResponse.json({
      message: "Автомобили инструктора успешно обновлены",
    });
  } catch (error) {
    console.error(`POST Instructor Config Error:`, error);
    return NextResponse.json(
      { error: "Не удалось настроить инструктора" },
      { status: 500 },
    );
  }
}
