'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/hooks/useAuth'
import { addFocusPreset, updateFocusPreset } from '@/lib/database'
import type { FocusPreset, BlockedWebsite } from '@/types'
import { Loader2 } from 'lucide-react'

interface PresetModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (preset: FocusPreset) => void
  preset?: FocusPreset | null
  blockedSites: BlockedWebsite[]
}

export function PresetModal({ 
  isOpen, 
  onClose, 
  onSave, 
  preset, 
  blockedSites
}: PresetModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [name, setName] = useState(preset?.name || '')
  const [startTime, setStartTime] = useState(preset?.start_time || '08:30')
  const [endTime, setEndTime] = useState(preset?.end_time || '13:00')
  const [selectedBlockedSites, setSelectedBlockedSites] = useState<string[]>(
    preset?.blocked_websites || []
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !user) return

    setLoading(true)
    setError('')

    try {
      const presetData = {
        name: name.trim(),
        start_time: startTime,
        end_time: endTime,
        blocked_websites: selectedBlockedSites,
      }

      let savedPreset: FocusPreset
      if (preset) {
        savedPreset = await updateFocusPreset(preset.id, user.id, presetData)
      } else {
        savedPreset = await addFocusPreset(user.id, presetData)
      }

      onSave(savedPreset)
      onClose()
      resetForm()
    } catch (err) {
      setError('Failed to save preset. Please try again.')
      console.error('Error saving preset:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setStartTime('08:30')
    setEndTime('13:00')
    setSelectedBlockedSites([])
    setError('')
  }

  const handleClose = () => {
    if (!preset) resetForm()
    onClose()
  }

  const toggleBlockedSite = (url: string) => {
    setSelectedBlockedSites(prev =>
      prev.includes(url)
        ? prev.filter(site => site !== url)
        : [...prev, url]
    )
  }


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {preset ? 'Edit Focus Preset' : 'Create New Focus Preset'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure a focus mode preset with specific start and end times for website blocking.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="e.g., Deep Work, Study Mode, Sleep Time"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
            </div>

            {blockedSites.length > 0 && (
              <div>
                <Label>Blocked Websites</Label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                  {blockedSites.map((site) => (
                    <div key={site.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`blocked-${site.id}`}
                        checked={selectedBlockedSites.includes(site.url)}
                        onCheckedChange={() => toggleBlockedSite(site.url)}
                      />
                      <Label htmlFor={`blocked-${site.id}`} className="text-sm">
                        {site.url}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-gray-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {preset ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                preset ? 'Update Preset' : 'Create Preset'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}