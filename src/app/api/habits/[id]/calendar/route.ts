import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getHabitCalendarData } from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "start_date and end_date parameters are required" },
        { status: 400 }
      );
    }

    const { id } = params;
    
    const entries = await getHabitCalendarData(
      userId,
      id,
      startDate,
      endDate
    );

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error fetching habit calendar data:", error);
    return NextResponse.json(
      { error: "Failed to fetch habit calendar data" },
      { status: 500 }
    );
  }
}