"use client"

import { useState } from "react"
import { useQuery, useAction } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

interface ScheduleCallDialogProps {
  onCallCreated?: (callId: Id<"calls">) => void
}

export function ScheduleCallDialog({ onCallCreated }: ScheduleCallDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const users = useQuery(api.team.getAllUsers)
  const currentUserId = useQuery(api.team.getCurrentUserId)
  const createStreamCall = useAction(api.stream.createStreamCall)

  const [formData, setFormData] = useState({
    title: "",
    callType: "team_meeting",
    participantIds: [] as Id<"users">[],
    scheduleForLater: false,
    scheduledDate: "",
    scheduledTime: "",
    clientName: "",
    clientId: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate participants
      if (formData.participantIds.length === 0) {
        toast.error("Please select at least one participant")
        setIsSubmitting(false)
        return
      }

      // Calculate scheduled time if applicable
      let scheduledTime: number | undefined
      if (formData.scheduleForLater && formData.scheduledDate && formData.scheduledTime) {
        const dateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`)
        if (dateTime.getTime() < Date.now()) {
          toast.error("Scheduled time must be in the future")
          setIsSubmitting(false)
          return
        }
        scheduledTime = dateTime.getTime()
      }

      // Create the call
      const result = await createStreamCall({
        callType: formData.callType,
        participantIds: formData.participantIds,
        scheduledTime,
        metadata: {
          title: formData.title || "Untitled Call",
          clientName: formData.clientName || undefined,
          clientId: formData.clientId || undefined,
          notes: formData.notes || undefined,
        },
      })

      toast.success(
        formData.scheduleForLater
          ? "Call scheduled successfully"
          : "Call created successfully"
      )

      setOpen(false)

      // Reset form
      setFormData({
        title: "",
        callType: "team_meeting",
        participantIds: [],
        scheduleForLater: false,
        scheduledDate: "",
        scheduledTime: "",
        clientName: "",
        clientId: "",
        notes: "",
      })

      // Notify parent if callback provided
      if (onCallCreated) {
        onCallCreated(result.callId)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create call")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle participant selection
  const toggleParticipant = (userId: Id<"users">) => {
    setFormData((prev) => ({
      ...prev,
      participantIds: prev.participantIds.includes(userId)
        ? prev.participantIds.filter((id) => id !== userId)
        : [...prev.participantIds, userId],
    }))
  }

  // Filter out current user and inactive users
  const availableUsers = users?.filter(
    (user) => user._id !== currentUserId && (user.isActive ?? true)
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus />
          Schedule Call
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Schedule a Call</DialogTitle>
            <DialogDescription>
              Create a new video call or schedule one for later
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Call Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">Call Title</Label>
              <Input
                id="title"
                placeholder="Weekly team sync"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Call Type */}
            <div className="grid gap-2">
              <Label htmlFor="callType">Call Type</Label>
              <Select
                value={formData.callType}
                onValueChange={(value) => setFormData({ ...formData, callType: value })}
              >
                <SelectTrigger id="callType">
                  <SelectValue placeholder="Select call type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_on_one">1-on-1 Call</SelectItem>
                  <SelectItem value="team_meeting">Team Meeting</SelectItem>
                  <SelectItem value="kyc_session">KYC Session</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Participants */}
            <div className="grid gap-2">
              <Label>Participants ({formData.participantIds.length} selected)</Label>
              <div className="border rounded-lg p-3 max-h-[200px] overflow-y-auto">
                {!availableUsers ? (
                  <p className="text-sm text-muted-foreground">Loading users...</p>
                ) : availableUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No other users available</p>
                ) : (
                  <div className="space-y-2">
                    {availableUsers.map((user) => {
                      const userName =
                        user.name ||
                        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                        user.email ||
                        "Unknown User"
                      return (
                        <div key={user._id} className="flex items-center space-x-2">
                          <Checkbox
                            id={user._id}
                            checked={formData.participantIds.includes(user._id)}
                            onCheckedChange={() => toggleParticipant(user._id)}
                          />
                          <Label
                            htmlFor={user._id}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {userName}
                            {user.role && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({user.role})
                              </span>
                            )}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Schedule for Later */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="scheduleForLater"
                checked={formData.scheduleForLater}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, scheduleForLater: checked === true })
                }
              />
              <Label htmlFor="scheduleForLater" className="cursor-pointer">
                Schedule for later
              </Label>
            </div>

            {/* Date & Time (conditional) */}
            {formData.scheduleForLater && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="scheduledDate">Date</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledDate: e.target.value })
                    }
                    required={formData.scheduleForLater}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="scheduledTime">Time</Label>
                  <Input
                    id="scheduledTime"
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledTime: e.target.value })
                    }
                    required={formData.scheduleForLater}
                  />
                </div>
              </div>
            )}

            {/* Client Information (for KYC sessions) */}
            {formData.callType === "kyc_session" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input
                      id="clientName"
                      placeholder="John Doe"
                      value={formData.clientName}
                      onChange={(e) =>
                        setFormData({ ...formData, clientName: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="clientId">Client ID</Label>
                    <Input
                      id="clientId"
                      placeholder="CLT-12345"
                      value={formData.clientId}
                      onChange={(e) =>
                        setFormData({ ...formData, clientId: e.target.value })
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes or agenda items..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Creating..."
                : formData.scheduleForLater
                ? "Schedule Call"
                : "Start Call Now"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
