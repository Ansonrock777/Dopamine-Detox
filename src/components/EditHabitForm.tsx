'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { HabitWithStats } from '@/types'

const habitFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Habit name is required' })
    .max(100, { message: 'Habit name must be less than 100 characters' }),
  description: z
    .string()
    .max(255, { message: 'Description must be less than 255 characters' })
    .optional(),
  emoji: z.string().min(1, { message: 'Please select an emoji' }),
})

type HabitFormValues = z.infer<typeof habitFormSchema>

interface EditHabitFormProps {
  habit: HabitWithStats | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onHabitUpdated: (habit: HabitWithStats) => void
}

const COMMON_EMOJIS = [
  '💪', '🏃', '📚', '🧘', '💧', '🥗', '☀️', '🌙', '✍️', '🎯',
  '🎨', '💻', '🎵', '🧹', '🏠', '❤️', '🧠', '⚡', '🔥', '✅',
  '🎉', '💡', '🌱', '🏆', '⭐', '🚀', '💎', '🎮', '📱', '🍎'
]

export function EditHabitForm({ habit, open, onOpenChange, onHabitUpdated }: EditHabitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedEmoji, setSelectedEmoji] = useState('✅')

  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      name: '',
      description: '',
      emoji: '✅',
    },
  })

  // Update form when habit changes
  useEffect(() => {
    if (habit) {
      form.reset({
        name: habit.name || '',
        description: habit.description || '',
        emoji: habit.emoji || '✅',
      })
      setSelectedEmoji(habit.emoji || '✅')
    }
  }, [habit, form])

  const onSubmit = async (values: HabitFormValues) => {
    if (isSubmitting || !habit) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/habits/${habit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          emoji: selectedEmoji,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update habit')
      }

      const { habit: updatedHabit } = await response.json()
      
      // Create updated habit with stats for the callback
      const updatedHabitWithStats: HabitWithStats = {
        ...habit,
        ...updatedHabit,
      }
      
      onHabitUpdated(updatedHabitWithStats)
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating habit:', error)
      alert(error instanceof Error ? error.message : 'Failed to update habit')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Habit</DialogTitle>
          <DialogDescription>
            Update your habit details. Choose a new emoji or modify the name and description.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Emoji Selector */}
            <div className="space-y-2">
              <FormLabel>Emoji</FormLabel>
              <div className="grid grid-cols-10 gap-2">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setSelectedEmoji(emoji)
                      form.setValue('emoji', emoji)
                    }}
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg hover:bg-accent transition-colors ${
                      selectedEmoji === emoji
                        ? 'border-primary bg-primary/10'
                        : 'border-border'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <FormDescription>Choose an emoji that represents your habit</FormDescription>
            </div>

            {/* Habit Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Habit Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Morning Exercise, Read 30 minutes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., Go for a 30-minute walk or gym session"
                      className="resize-none"
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Add a brief description to clarify what this habit involves
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Habit'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}