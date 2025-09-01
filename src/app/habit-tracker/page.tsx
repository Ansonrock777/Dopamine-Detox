"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { HabitCard } from "@/components/HabitCard";
import { HabitStats } from "@/components/HabitStats";
import { AddHabitForm } from "@/components/AddHabitForm";
import { EditHabitForm } from "@/components/EditHabitForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { HabitWithStats, Habit } from "@/types";
import { getTodayLocalDate } from "@/lib/timezone";

export default function HabitTrackerPage() {
  const { loading: authLoading, isSignedIn } = useAuth();
  const [habits, setHabits] = useState<HabitWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingHabit, setEditingHabit] = useState<HabitWithStats | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const loadHabits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors

      console.log("CLIENT: Starting loadHabits...");
      console.log("CLIENT: Making fetch request to /api/habits");

      const response = await fetch("/api/habits");

      console.log("CLIENT: Response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        console.error("CLIENT: Response not ok:", response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("CLIENT: Habits data:", data);

      setHabits(data || []);
    } catch (error) {
      console.error("CLIENT: Error loading habits:", error);
      setError(error instanceof Error ? error.message : "Failed to load habits");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log("Auth state:", { authLoading, isSignedIn });
    if (!authLoading && isSignedIn) {
      console.log("User is signed in, loading habits...");
      loadHabits();
    } else if (!authLoading && !isSignedIn) {
      console.log("User is not signed in");
      setError("Please sign in to view your habits.");
    }
  }, [authLoading, isSignedIn, loadHabits]);

  const handleToggleCompletion = async (
    habitId: string,
    date?: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/habits/${habitId}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date: date || getTodayLocalDate() }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle habit completion");
      }

      const { completed } = await response.json();

      // Update the habit in the local state and re-sort
      setHabits((prev) =>
        sortHabits(
          prev.map((habit) =>
            habit.id === habitId
              ? {
                  ...habit,
                  today_completed: completed,
                  stats: {
                    ...habit.stats,
                    // Optimistically update stats - in a real app you might refetch
                    current_streak: completed
                      ? habit.stats.current_streak + 1
                      : Math.max(0, habit.stats.current_streak - 1),
                    total_checkins: completed
                      ? habit.stats.total_checkins + 1
                      : Math.max(0, habit.stats.total_checkins - 1),
                  },
                }
              : habit
          )
        )
      );

      return completed;
    } catch (error) {
      console.error("Error toggling habit completion:", error);
      throw error;
    }
  };

  const handleHabitAdded = (newHabit: Habit) => {
    // Add the new habit to the list with default stats
    const habitWithStats: HabitWithStats = {
      ...newHabit,
      stats: {
        habit_id: newHabit.id,
        current_streak: 0,
        max_streak: 0,
        consistency_percent: 0,
        total_checkins: 0,
        badge_level: "none",
      },
      today_completed: false,
    };

    setHabits((prev) => sortHabits([habitWithStats, ...prev]));
  };

  const handleDeleteHabit = async (habitId: string) => {
    // Find the habit to get its name for confirmation
    const habitToDelete = habits.find(h => h.id === habitId);
    const habitName = habitToDelete?.name || 'this habit';

    // Show confirmation dialog
    if (!confirm(`Are you sure you want to delete "${habitName}"? This action cannot be undone and will remove all associated data.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/habits/${habitId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete habit');
      }

      // Remove the habit from local state
      setHabits((prev) => prev.filter(habit => habit.id !== habitId));
      
      console.log('Habit deleted successfully');
    } catch (error) {
      console.error('Error deleting habit:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete habit');
    }
  };

  const handleEditHabit = (habit: HabitWithStats) => {
    setEditingHabit(habit);
    setEditModalOpen(true);
  };

  const handleHabitUpdated = (updatedHabit: HabitWithStats) => {
    setHabits(prev => 
      sortHabits(
        prev.map(habit => 
          habit.id === updatedHabit.id ? updatedHabit : habit
        )
      )
    );
  };

  // Sort habits: uncompleted first, then completed (blurred)
  const sortHabits = (habitsList: HabitWithStats[]) => {
    return habitsList.sort((a, b) => {
      // Primary sort: uncompleted habits first
      if (a.today_completed !== b.today_completed) {
        return a.today_completed ? 1 : -1;
      }
      // Secondary sort: by creation date (newest first for uncompleted)
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  };

  if (authLoading || !isSignedIn) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6 sm:space-y-8">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 sm:h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {habits.length} HABIT{habits.length !== 1 ? "S" : ""}
          </h1>
          <AddHabitForm onHabitAdded={handleHabitAdded} />
        </div>
      </div>

      {/* Overview Statistics */}
      <HabitStats />

      {/* Error State */}
      {error && (
        <Card className="border-red-600 bg-red-900/20">
          <CardContent className="pt-6">
            <p className="text-red-400 text-center">{error}</p>
            <div className="flex justify-center mt-4">
              <Button
                onClick={loadHabits}
                variant="outline"
                size="sm"
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-80 sm:h-96 bg-gray-800 border-gray-700">
              <CardContent className="pt-4 sm:pt-6 space-y-4 px-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-6 sm:w-8 h-6 sm:h-8 rounded bg-gray-600" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 sm:h-5 w-24 sm:w-32 bg-gray-600" />
                    <Skeleton className="h-3 sm:h-4 w-32 sm:w-48 bg-gray-600" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="text-center">
                      <Skeleton className="h-6 sm:h-8 w-8 sm:w-12 mx-auto mb-2 bg-gray-600" />
                      <Skeleton className="h-3 w-12 sm:w-16 mx-auto bg-gray-600" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-20 sm:h-24 w-full bg-gray-600" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && habits.length === 0 && (
        <Card className="text-center py-8 sm:py-12 bg-gray-800 border-gray-700">
          <CardContent className="px-4 sm:px-6">
            <div className="space-y-4">
              <div className="text-4xl sm:text-6xl">🎯</div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white">
                Start Your First Habit
              </h3>
              <p className="text-gray-400 max-w-sm sm:max-w-md mx-auto text-sm sm:text-base">
                Create your first habit to begin tracking your progress and
                building consistency. Choose something small and achievable to
                start with!
              </p>
              <AddHabitForm onHabitAdded={handleHabitAdded} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Habits Grid */}
      {!loading && !error && habits.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggleCompletion={handleToggleCompletion}
              onEdit={handleEditHabit}
              onDelete={handleDeleteHabit}
            />
          ))}
        </div>
      )}

      {/* Add More Habits CTA */}
      {!loading && !error && habits.length > 0 && habits.length < 10 && (
        <Card className="text-center py-6 sm:py-8 border-dashed border-gray-600 bg-gray-800/50">
          <CardContent className="px-4 sm:px-6">
            <div className="space-y-3">
              <div className="text-3xl sm:text-4xl">➕</div>
              <p className="text-gray-400 text-sm sm:text-base">Ready to build another habit?</p>
              <AddHabitForm onHabitAdded={handleHabitAdded} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Habit Modal */}
      <EditHabitForm
        habit={editingHabit}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onHabitUpdated={handleHabitUpdated}
      />
    </div>
  );
}
