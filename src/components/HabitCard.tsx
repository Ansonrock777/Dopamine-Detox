"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { HabitCalendarGrid } from "@/components/HabitCalendarGrid";
import type { HabitWithStats } from "@/types";
import { cn } from "@/lib/utils";
import { getTodayLocalDate } from "@/lib/timezone";
import { getBadgeInfo } from "@/lib/badge-utils";

interface HabitCardProps {
  habit: HabitWithStats;
  onToggleCompletion: (habitId: string, date?: string) => Promise<boolean>;
  onEdit?: (habit: HabitWithStats) => void;
  onDelete?: (habitId: string) => void;
}

export function HabitCard({
  habit,
  onToggleCompletion,
  onEdit,
  onDelete,
}: HabitCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [todayCompleted, setTodayCompleted] = useState(habit.today_completed);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleToggleToday = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Only allow checking habits for today's date
      const todayDate = getTodayLocalDate();
      const newCompleted = await onToggleCompletion(habit.id, todayDate);
      setTodayCompleted(newCompleted);
      // Trigger calendar refresh
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error toggling habit completion:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full bg-gray-900 border-gray-700">
      <CardHeader className="pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <span className="text-xl sm:text-2xl flex-shrink-0">{habit.emoji}</span>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg font-semibold text-white truncate">
                {habit.name}
              </CardTitle>
              {habit.description && (
                <CardDescription className="text-sm text-gray-400 mt-1 line-clamp-2">
                  {habit.description}
                </CardDescription>
              )}
            </div>
          </div>
          <CardAction>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Checkbox
                checked={todayCompleted}
                onCheckedChange={handleToggleToday}
                disabled={isLoading}
                className={cn(
                  "w-6 h-6 border-2 transition-all duration-200",
                  todayCompleted
                    ? "bg-green-500 border-green-500 text-white hover:bg-green-600 hover:border-green-600"
                    : "border-gray-400 hover:border-gray-300 hover:bg-gray-800",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              />
              {(onEdit || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-700">
                    {onEdit && (
                      <DropdownMenuItem 
                        onClick={() => onEdit(habit)}
                        className="text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Habit
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(habit.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Habit
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6 pb-4 sm:pb-6">
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-1">
              {(habit.stats?.current_streak || 0) > 0 && <span className="text-sm sm:text-base">🔥</span>}
              {habit.stats?.current_streak || 0}
            </div>
            <div className="text-xs text-gray-400">Streak</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {Math.round(habit.stats?.consistency_percent || 0)}%
            </div>
            <div className="text-xs text-gray-400">Consistency</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-1">
              <span className="text-base sm:text-lg">{getBadgeInfo(habit.stats?.badge_level).icon}</span>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm leading-tight">{getBadgeInfo(habit.stats?.badge_level).name}</span>
                <span className="text-xs text-gray-400 leading-tight">{habit.stats?.max_streak || 0} best</span>
              </div>
            </div>
            <div className="text-xs text-gray-400">Trophy</div>
          </div>
        </div>

        {/* GitHub-style Calendar Grid */}
        <div className="w-full mt-4 pt-4 border-t border-gray-700/50 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div className="overflow-x-auto custom-scrollbar">
            <HabitCalendarGrid
              habitId={habit.id}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
