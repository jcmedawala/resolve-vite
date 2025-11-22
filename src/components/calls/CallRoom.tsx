"use client"

import { useEffect, useState, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { StreamVideo, StreamCall, Call } from "@stream-io/video-react-sdk";
import { getStreamClient, disconnectClient } from "@/lib/stream/client";
import { MeetingUI } from "./MeetingUI";
import { IconLoader } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface CallRoomProps {
  callId: Id<"calls">;
  onBack: () => void;
}

export function CallRoom({ callId, onBack }: CallRoomProps) {
  const [client, setClient] = useState<any>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const generateToken = useAction(api.stream.generateStreamToken);
  const getStreamCall = useAction(api.stream.getStreamCall);

  console.log("[CallRoom] Component mounted with callId:", callId);

  useEffect(() => {
    mountedRef.current = true;

    const initializeCall = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log("[CallRoom] Initializing call...");

        // Generate Stream token
        const { token, userId } = await generateToken();
        if (!mountedRef.current) return;

        console.log("[CallRoom] Got token for user:", userId);

        // Initialize Stream client
        const streamClient = getStreamClient(
          {
            id: userId,
            type: "authenticated",
          },
          token
        );
        if (!mountedRef.current) {
          await disconnectClient();
          return;
        }

        setClient(streamClient);

        // Get call details from Convex
        const callDetails = await getStreamCall({ callId });
        if (!mountedRef.current) {
          await disconnectClient();
          return;
        }

        console.log("[CallRoom] Got call details:", callDetails);

        // Create call instance (always use "default" as Stream's call type)
        const streamCall = streamClient.call("default", callDetails.streamCallId);

        // Get or create the call
        await streamCall.getOrCreate({
          data: {
            custom: {
              callType: callDetails.callType,
            },
          },
        });

        if (!mountedRef.current) {
          await streamCall.leave();
          await disconnectClient();
          return;
        }

        setCall(streamCall);
        setIsLoading(false);

        console.log("[CallRoom] Call initialized successfully");
      } catch (err) {
        console.error("[CallRoom] Error initializing call:", err);
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "Failed to initialize call");
          setIsLoading(false);
        }
      }
    };

    initializeCall();

    return () => {
      mountedRef.current = false;
      // Cleanup will happen in MeetingUI
    };
  }, [callId, generateToken, getStreamCall]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] bg-black rounded-lg">
        <div className="text-center">
          <IconLoader className="size-8 animate-spin mx-auto mb-2 text-white" />
          <p className="text-gray-300">Initializing call...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] bg-black rounded-lg">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={onBack}>Back to Calls</Button>
        </div>
      </div>
    );
  }

  if (!client || !call) {
    console.error("[CallRoom] Unexpected state - no client or call but no error", { client: !!client, call: !!call });
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] bg-black rounded-lg">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to initialize call (no client or call instance)</p>
          <Button onClick={onBack}>Back to Calls</Button>
        </div>
      </div>
    );
  }

  console.log("[CallRoom] Rendering MeetingUI");

  return (
    <div className="h-[calc(100vh-8rem)] bg-black rounded-lg overflow-hidden">
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <MeetingUI callId={callId} onBack={onBack} />
        </StreamCall>
      </StreamVideo>
    </div>
  );
}
