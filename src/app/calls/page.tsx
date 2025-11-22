"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  IconVideo,
  IconClock,
  IconUsers,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconPlayerPlay,
  IconTrash,
  IconCopy,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { ScheduleCallDialog } from "@/components/calls/ScheduleCallDialog"
import { CallRoom } from "@/components/calls/CallRoom"

const ACTIVE_CALL_STORAGE_KEY = 'activeCallId';

export default function CallsPage() {
  const [selectedFilter, setSelectedFilter] = useState<string | undefined>(undefined)
  const [activeCallId, setActiveCallId] = useState<Id<"calls"> | null>(null)

  // Get calls data (MUST call hooks before any conditional returns!)
  const allCalls = useQuery(api.calls.getMyCalls, { status: selectedFilter })
  const activeCalls = useQuery(api.calls.getActiveCalls)

  // Mutations
  const deleteCall = useMutation(api.calls.deleteCall)
  const updateCallStatus = useMutation(api.calls.updateCallStatus)

  // Handle call link with query parameter and restore active call from storage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const callIdParam = urlParams.get('callId')
    if (callIdParam) {
      // Set the call ID to auto-join
      setActiveCallId(callIdParam as Id<"calls">)
      // Store in sessionStorage for persistence
      sessionStorage.setItem(ACTIVE_CALL_STORAGE_KEY, callIdParam)
      // Clear the URL parameter to clean up the URL
      window.history.replaceState({}, '', window.location.pathname)
    } else {
      // Check if there's an active call in sessionStorage
      const storedCallId = sessionStorage.getItem(ACTIVE_CALL_STORAGE_KEY)
      if (storedCallId) {
        setActiveCallId(storedCallId as Id<"calls">)
      }
    }
  }, [])

  // Update sessionStorage when activeCallId changes
  useEffect(() => {
    if (activeCallId) {
      sessionStorage.setItem(ACTIVE_CALL_STORAGE_KEY, activeCallId)
    } else {
      sessionStorage.removeItem(ACTIVE_CALL_STORAGE_KEY)
    }
  }, [activeCallId])

  // Handle delete call
  const handleDeleteCall = async (callId: Id<"calls">, callTitle: string) => {
    try {
      await deleteCall({ callId })
      toast.success(`"${callTitle}" has been deleted`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete call")
    }
  }

  // Handle cancel scheduled call
  const handleCancelCall = async (callId: Id<"calls">, callTitle: string) => {
    try {
      await updateCallStatus({
        callId,
        status: "cancelled",
        endTime: Date.now()
      })
      toast.success(`"${callTitle}" has been cancelled`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel call")
    }
  }

  // Handle copy call link
  const handleCopyCallLink = async (callId: Id<"calls">, _callTitle: string) => {
    try {
      // For now, just copy the call ID - participants can use this to join
      // In a production app, this would be a full URL like https://yourapp.com/calls/join/callId
      const callLink = `${window.location.origin}${window.location.pathname}?callId=${callId}`
      await navigator.clipboard.writeText(callLink)
      toast.success("Call link copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy link")
    }
  }

  // If a call is selected, show the call room (AFTER all hooks are called!)
  if (activeCallId) {
    console.log("[CallsPage] Rendering CallRoom with callId:", activeCallId);
    return <CallRoom callId={activeCallId} onBack={() => setActiveCallId(null)} />;
  }

  // Loading state
  if (allCalls === undefined || activeCalls === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading calls...</p>
        </div>
      </div>
    )
  }

  // Format duration from seconds to readable format
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  // Format date/time
  const formatDateTime = (timestamp?: number) => {
    if (!timestamp) return "N/A"
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="gap-1.5 px-1.5 text-muted-foreground">
            <IconCircleCheckFilled className="size-3.5 fill-green-500 dark:fill-green-400" />
            Active
          </Badge>
        )
      case "scheduled":
        return (
          <Badge variant="outline" className="gap-1.5 px-1.5 text-muted-foreground">
            <IconClock className="size-3.5 text-blue-500 dark:text-blue-400" />
            Scheduled
          </Badge>
        )
      case "ended":
        return (
          <Badge variant="outline" className="gap-1.5 px-1.5 text-muted-foreground">
            <IconCircleCheckFilled className="size-3.5 fill-gray-500 dark:fill-gray-400" />
            Ended
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="gap-1.5 px-1.5 text-muted-foreground">
            <IconCircleXFilled className="size-3.5 fill-red-500 dark:fill-red-400" />
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get call type badge
  const getCallTypeBadge = (callType: string) => {
    const typeLabels: Record<string, string> = {
      one_on_one: "1-on-1",
      team_meeting: "Team Meeting",
      kyc_session: "KYC Session",
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        {typeLabels[callType] || callType}
      </Badge>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Active Calls Section */}
      {activeCalls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconPlayerPlay className="size-5" />
              Active Calls
            </CardTitle>
            <CardDescription>
              You have {activeCalls.length} active {activeCalls.length === 1 ? "call" : "calls"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeCalls.map((call) => (
                <Card key={call._id} className="border-2 border-primary/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      {getCallTypeBadge(call.callType)}
                      {getStatusBadge(call.status)}
                    </div>
                    <CardTitle className="text-base">
                      {call.metadata?.title || "Untitled Call"}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Started {formatDateTime(call.startTime)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <IconUsers className="size-4" />
                      <span>{call.participantNames.join(", ")}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => setActiveCallId(call._id)}>
                          <IconVideo className="mr-2 size-4" />
                          Join
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyCallLink(call._id, call.metadata?.title || "Untitled Call")}
                          title="Copy call link"
                        >
                          <IconCopy className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            await updateCallStatus({
                              callId: call._id,
                              status: "ended",
                              endTime: Date.now(),
                            })
                            toast.success("Call ended")
                          }}
                          title="End call"
                        >
                          <IconTrash className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Call History</CardTitle>
              <CardDescription>
                View and manage all your calls
              </CardDescription>
            </div>
            <ScheduleCallDialog />
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Buttons */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={selectedFilter === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter(undefined)}
            >
              All
            </Button>
            <Button
              variant={selectedFilter === "scheduled" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("scheduled")}
            >
              Scheduled
            </Button>
            <Button
              variant={selectedFilter === "ended" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter("ended")}
            >
              Ended
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allCalls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No calls found.
                    </TableCell>
                  </TableRow>
                ) : (
                  allCalls.map((call) => (
                    <TableRow key={call._id}>
                      <TableCell className="font-medium">
                        {call.metadata?.title || "Untitled Call"}
                        {call.metadata?.clientName && (
                          <div className="text-xs text-muted-foreground">
                            Client: {call.metadata.clientName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getCallTypeBadge(call.callType)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <IconUsers className="size-4" />
                          {call.participantNames.length + 1}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(call.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {call.scheduledTime
                          ? formatDateTime(call.scheduledTime)
                          : call.startTime
                          ? formatDateTime(call.startTime)
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDuration(call.duration)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* Join button for scheduled and active calls */}
                          {(call.status === "scheduled" || call.status === "active") && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => setActiveCallId(call._id)} title="Join call">
                                <IconVideo className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyCallLink(call._id, call.metadata?.title || "Untitled Call")}
                                title="Copy call link"
                              >
                                <IconCopy className="size-4" />
                              </Button>
                            </>
                          )}

                          {/* Recording button for ended calls with recordings */}
                          {call.status === "ended" && call.recordingUrl && (
                            <Button variant="ghost" size="sm" title="View recording">
                              Recording
                            </Button>
                          )}

                          {/* Cancel button for scheduled calls */}
                          {call.status === "scheduled" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelCall(call._id, call.metadata?.title || "Untitled Call")}
                              className="text-muted-foreground hover:text-foreground"
                              title="Cancel call"
                            >
                              Cancel
                            </Button>
                          )}

                          {/* End Call button for active calls */}
                          {call.status === "active" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                await updateCallStatus({
                                  callId: call._id,
                                  status: "ended",
                                  endTime: Date.now(),
                                })
                                toast.success("Call ended")
                              }}
                              className="text-muted-foreground hover:text-foreground"
                              title="End call"
                            >
                              End
                            </Button>
                          )}

                          {/* Delete button - ALWAYS VISIBLE for ended/cancelled calls */}
                          {(call.status === "ended" || call.status === "cancelled") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCall(call._id, call.metadata?.title || "Untitled Call")}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Delete call"
                            >
                              <IconTrash className="size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Stats Footer */}
          {allCalls.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
              <div className="flex gap-6">
                <span>
                  Total Calls: <span className="font-medium text-foreground">{allCalls.length}</span>
                </span>
                <span>
                  Scheduled: <span className="font-medium text-foreground">{allCalls.filter(c => c.status === "scheduled").length}</span>
                </span>
                <span>
                  Completed: <span className="font-medium text-foreground">{allCalls.filter(c => c.status === "ended").length}</span>
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
