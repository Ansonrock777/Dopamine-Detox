"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

import { formatLocalDate, isToday, isFuture } from "@/lib/timezone";

interface HabitCalendarEntry {
  date: string;
  completed: boolean;
}

interface HabitCalendarGridProps {
  habitId: string;
  className?: string;
  refreshTrigger?: number;
}

export function HabitCalendarGrid({
  habitId,
  className,
  refreshTrigger,
}: HabitCalendarGridProps) {
  const [calendarData, setCalendarData] = useState<HabitCalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCalendarData = async () => {
      try {
        setLoading(true);

        // Get data for current year (Jan to Dec)
        const endDate = new Date();
        endDate.setMonth(11, 31); // December 31st of current year
        const startDate = new Date();
        startDate.setMonth(0, 1); // January 1st of current year

        const response = await fetch(
          `/api/habits/${habitId}/calendar?start_date=${
            startDate.toISOString().split("T")[0]
          }&end_date=${endDate.toISOString().split("T")[0]}`
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Calendar data received:", data.entries);
          setCalendarData(data.entries || []);
        } else {
          console.error(
            "Calendar API response not ok:",
            response.status,
            await response.text()
          );
        }
      } catch (error) {
        console.error("Error loading habit calendar data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCalendarData();
  }, [habitId, refreshTrigger]);

  // Generate GitHub-style calendar grid
  const generateCalendarGrid = () => {
    const completionMap = new Map(
      calendarData.map((entry) => [entry.date, entry.completed])
    );

    // Use user's local timezone for current year
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Check if current year is a leap year
    const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0);
    const daysInYear = isLeapYear ? 366 : 365;
    
    const startDate = new Date(currentYear, 0, 1); // January 1st
    // endDate not used but keeping for clarity

    // Find what day of week Jan 1st falls on (0 = Sunday, 1 = Monday, etc.)
    const startDayOfWeek = startDate.getDay();
    

    const weeks: Array<
      Array<{
        date: string | null;
        completed: boolean;
        isToday: boolean;
        isFuture: boolean;
        isEmpty: boolean;
      }>
    > = [];

    let currentWeek: Array<{
      date: string | null;
      completed: boolean;
      isToday: boolean;
      isFuture: boolean;
      isEmpty: boolean;
    }> = [];

    // Add empty cells before Jan 1st to align with correct day of week
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({
        date: null,
        completed: false,
        isToday: false,
        isFuture: false,
        isEmpty: true,
      });
    }

    // Generate all days of the year
    const currentDate = new Date(startDate);
    for (let dayCount = 0; dayCount < daysInYear; dayCount++) {
      const dateString = formatLocalDate(currentDate);
      const isTodayDate = isToday(currentDate);
      const isFutureDate = isFuture(currentDate);
      const isCompleted = completionMap.get(dateString) || false;


      currentWeek.push({
        date: dateString,
        completed: isCompleted,
        isToday: isTodayDate,
        isFuture: isFutureDate,
        isEmpty: false,
      });

      // If we have 7 days, push the week and start a new one
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fill remaining spaces in the last week if needed
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push({
        date: null,
        completed: false,
        isToday: false,
        isFuture: false,
        isEmpty: true,
      });
    }

    // Push the last week if it has any content
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const calendarGrid = generateCalendarGrid();

  // Generate month labels
  const generateMonthLabels = () => {
    const months = [];
    const today = new Date();

    // Show 12 months from Jan to Dec
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(today.getFullYear(), i, 1);
      months.push(monthDate.toLocaleDateString("en", { month: "short" }));
    }

    return months;
  };

  const monthLabels = generateMonthLabels();

  return (
    <div className={cn("w-full min-w-[480px]", className)}>
      {/* Month labels */}
      <div className="flex text-[9px] text-gray-400 mb-1 min-w-[480px]">
        <div className="w-6 flex-shrink-0"></div> {/* Space for day labels */}
        {monthLabels.map((month, index) => (
          <div key={index} className="text-left flex-1 min-w-[36px]">
            {month}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex min-w-[480px]">
        {/* Day labels */}
        <div className="flex flex-col gap-[1px] text-[9px] text-gray-400 pr-1 flex-shrink-0">
          <div className="h-2 flex items-center justify-end w-6"></div>
          <div className="h-2 flex items-center justify-end w-6">Mon</div>
          <div className="h-2 flex items-center justify-end w-6"></div>
          <div className="h-2 flex items-center justify-end w-6">Wed</div>
          <div className="h-2 flex items-center justify-end w-6"></div>
          <div className="h-2 flex items-center justify-end w-6">Fri</div>
          <div className="h-2 flex items-center justify-end w-6"></div>
        </div>

        {/* Grid */}
        <div className="flex gap-[1px] flex-1 min-w-[420px]">
          {calendarGrid.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[1px] flex-1 min-w-[8px]">
              {week.map((day, dayIndex) => (
                <div
                  key={day.date || `empty-${weekIndex}-${dayIndex}`}
                  className={cn(
                    "w-2 h-2 rounded-sm",
                    day.isEmpty
                      ? "bg-transparent"
                      : loading
                      ? "bg-gray-700/50"
                      : day.isFuture
                      ? "bg-gray-800/30"
                      : day.completed
                      ? "bg-green-500"
                      : "bg-gray-600/30",
                    day.isToday && !loading && "ring-1 ring-blue-400"
                  )}
                  title={
                    !loading && !day.isEmpty && day.date
                      ? `${day.date}: ${
                          day.completed ? "Completed" : "Not completed"
                        }`
                      : undefined
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[9px] text-gray-400 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-600/30 rounded-sm" />
          <span>Not completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-sm" />
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}
