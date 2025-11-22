"use client"

import { useState, useEffect } from "react";
import {
  useCall,
  useCallStateHooks,
  SpeakerLayout,
  PaginatedGridLayout,
} from "@stream-io/video-react-sdk";
import { useCallSettings } from "@/contexts/CallSettingsContext";
import { CallControls } from "./CallControls";
import { CallHeader } from "./CallHeader";
import { ChatSidebar } from "./ChatSidebar";
import { ParticipantsSidebar } from "./ParticipantsSidebar";
import { CallStats } from "./CallStats";
import { IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface ActiveCallProps {
  onLeave: () => void;
}

export function ActiveCall({ onLeave }: ActiveCallProps) {
  const call = useCall();
  const { settings, updateSettings } = useCallSettings();
  const { useParticipants, useCallStartedAt } = useCallStateHooks();
  const participants = useParticipants();
  const callStartedAt = useCallStartedAt();

  const [duration, setDuration] = useState(0);

  // Update call duration every second
  useEffect(() => {
    if (!callStartedAt) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartedAt.getTime()) / 1000);
      setDuration(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [callStartedAt]);

  // Format duration as HH:MM:SS
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!call) {
    return null;
  }

  return (
    <div className="h-full w-full bg-black flex flex-col">
      {/* Header */}
      <CallHeader
        participantCount={participants.length}
        duration={formatDuration(duration)}
        layoutMode={settings.layoutMode}
        onLayoutChange={(mode) => updateSettings({ layoutMode: mode })}
      />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Video Stage - takes available space */}
        <div className="flex-1 relative bg-black overflow-hidden">
          {settings.layoutMode === 'speaker' ? (
            <SpeakerLayout participantsBarPosition="bottom" />
          ) : (
            <PaginatedGridLayout />
          )}

          {/* Floating call stats */}
          {settings.showCallStats && (
            <div className="absolute top-4 left-4 z-10">
              <CallStats />
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        {settings.chatSidebarOpen && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-white font-semibold">Chat</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateSettings({ chatSidebarOpen: false })}
                className="text-gray-400 hover:text-white"
              >
                <IconX className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatSidebar />
            </div>
          </div>
        )}

        {/* Participants Sidebar */}
        {settings.participantsSidebarOpen && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="text-white font-semibold">
                Participants ({participants.length})
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateSettings({ participantsSidebarOpen: false })}
                className="text-gray-400 hover:text-white"
              >
                <IconX className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ParticipantsSidebar />
            </div>
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="pb-6">
        <CallControls onLeave={onLeave} />
      </div>
    </div>
  );
}
