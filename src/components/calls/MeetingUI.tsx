"use client"

import { useState, useCallback, useEffect } from "react";
import { useCall, CallingState } from "@stream-io/video-react-sdk";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Lobby } from "./Lobby";
import { ActiveCall } from "./ActiveCall";
import { disconnectClient } from "@/lib/stream/client";
import { IconLoader } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

type MeetingState = 'lobby' | 'loading' | 'active-call' | 'left' | 'error-join' | 'error-leave';

interface MeetingUIProps {
  callId: Id<"calls">;
  onBack: () => void;
}

export function MeetingUI({ callId, onBack }: MeetingUIProps) {
  const call = useCall();
  const [meetingState, setMeetingState] = useState<MeetingState>('lobby');
  const updateCallStatus = useMutation(api.calls.updateCallStatus);

  // Handle joining the call
  const handleJoin = useCallback(async (options: { micEnabled: boolean; cameraEnabled: boolean }) => {
    if (!call) {
      console.error("[MeetingUI] No call instance available");
      return;
    }

    try {
      setMeetingState('loading');
      console.log("[MeetingUI] Joining call with options:", options);

      // Join the call if not already joined
      if (call.state.callingState !== CallingState.JOINED) {
        await call.join({ create: false });
      }

      // Apply mic/camera state from lobby
      if (!options.micEnabled) {
        await call.microphone.disable();
      }
      if (!options.cameraEnabled) {
        await call.camera.disable();
      }

      console.log("[MeetingUI] Successfully joined call");

      // Update call status in Convex
      await updateCallStatus({
        callId,
        status: "active",
      });

      setMeetingState('active-call');
    } catch (err) {
      console.error("[MeetingUI] Error joining call:", err);
      setMeetingState('error-join');
    }
  }, [call, callId, updateCallStatus]);

  // Handle leaving the call
  const handleLeave = useCallback(async () => {
    if (!call) return;

    try {
      console.log("[MeetingUI] Leaving call...");

      // Calculate call duration
      const startTime = call.state.startedAt?.getTime();
      const endTime = Date.now();
      const duration = startTime ? Math.floor((endTime - startTime) / 1000) : undefined;

      // Leave the call
      await call.leave();

      // Update call status in Convex
      await updateCallStatus({
        callId,
        status: "ended",
        endTime,
        duration,
      });

      // Disconnect client
      await disconnectClient();

      console.log("[MeetingUI] Successfully left call");

      // Go back to calls page
      onBack();
    } catch (err) {
      console.error("[MeetingUI] Error leaving call:", err);
      setMeetingState('error-leave');
    }
  }, [call, callId, updateCallStatus, onBack]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // If we're still in a call when unmounting, leave it
      if (call && call.state.callingState === CallingState.JOINED) {
        console.log("[MeetingUI] Component unmounting, leaving call...");
        call.leave().catch(console.error);
        disconnectClient().catch(console.error);
      }
    };
  }, [call]);

  // Render based on state
  if (meetingState === 'lobby') {
    return <Lobby onJoin={handleJoin} onBack={onBack} />;
  }

  if (meetingState === 'loading') {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center">
          <IconLoader className="size-8 animate-spin mx-auto mb-2 text-white" />
          <p className="text-gray-300">Joining call...</p>
        </div>
      </div>
    );
  }

  if (meetingState === 'active-call') {
    return <ActiveCall onLeave={handleLeave} />;
  }

  if (meetingState === 'error-join') {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to join the call. Please try again.</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => setMeetingState('lobby')}>Try Again</Button>
            <Button variant="outline" onClick={onBack}>Back to Calls</Button>
          </div>
        </div>
      </div>
    );
  }

  if (meetingState === 'error-leave') {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error leaving the call.</p>
          <Button onClick={onBack}>Back to Calls</Button>
        </div>
      </div>
    );
  }

  return null;
}
