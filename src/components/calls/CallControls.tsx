"use client"

import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import { useCallSettings } from "@/contexts/CallSettingsContext";
import { Button } from "@/components/ui/button";
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconVideo,
  IconVideoOff,
  IconScreenShare,
  IconScreenShareOff,
  IconMessage,
  IconUsers,
  IconChartBar,
  IconSettings,
  IconPhoneOff,
} from "@tabler/icons-react";
import { useState } from "react";
import { SettingsModal } from "./SettingsModal";

interface CallControlsProps {
  onLeave: () => void;
}

export function CallControls({ onLeave }: CallControlsProps) {
  const call = useCall();
  const { useCameraState, useMicrophoneState, useHasOngoingScreenShare } =
    useCallStateHooks();

  const { camera, isMute: isCameraMuted } = useCameraState();
  const { microphone, isMute: isMicMuted } = useMicrophoneState();
  const hasOngoingScreenShare = useHasOngoingScreenShare();

  const { settings, updateSettings } = useCallSettings();
  const [showSettings, setShowSettings] = useState(false);

  const toggleCamera = async () => {
    if (!camera) return;
    try {
      if (isCameraMuted) {
        await camera.enable();
      } else {
        await camera.disable();
      }
    } catch (err) {
      console.error("Error toggling camera:", err);
    }
  };

  const toggleMicrophone = async () => {
    if (!microphone) return;
    try {
      if (isMicMuted) {
        await microphone.enable();
      } else {
        await microphone.disable();
      }
    } catch (err) {
      console.error("Error toggling microphone:", err);
    }
  };

  const toggleScreenShare = async () => {
    if (!call) return;
    try {
      if (hasOngoingScreenShare) {
        console.log("[CallControls] Stopping screen share");
        await call.screenShare.disable();
      } else {
        console.log("[CallControls] Starting screen share");
        await call.screenShare.enable();
      }
    } catch (err) {
      console.error("Error toggling screen share:", err);
    }
  };

  const toggleChat = () => {
    updateSettings({ chatSidebarOpen: !settings.chatSidebarOpen });
  };

  const toggleParticipants = () => {
    updateSettings({ participantsSidebarOpen: !settings.participantsSidebarOpen });
  };

  const toggleStats = () => {
    updateSettings({ showCallStats: !settings.showCallStats });
  };

  return (
    <>
      <div className="flex items-center justify-center gap-3 px-4">
        {/* Microphone */}
        <Button
          size="lg"
          variant={isMicMuted ? "destructive" : "secondary"}
          onClick={toggleMicrophone}
          className="rounded-full w-14 h-14 bg-white hover:bg-gray-200 text-gray-900 border-2 border-gray-300"
          title={isMicMuted ? "Unmute" : "Mute"}
        >
          {isMicMuted ? (
            <IconMicrophoneOff className="size-5" />
          ) : (
            <IconMicrophone className="size-5" />
          )}
        </Button>

        {/* Camera */}
        <Button
          size="lg"
          variant={isCameraMuted ? "destructive" : "secondary"}
          onClick={toggleCamera}
          className="rounded-full w-14 h-14 bg-white hover:bg-gray-200 text-gray-900 border-2 border-gray-300"
          title={isCameraMuted ? "Turn on camera" : "Turn off camera"}
        >
          {isCameraMuted ? (
            <IconVideoOff className="size-5" />
          ) : (
            <IconVideo className="size-5" />
          )}
        </Button>

        {/* Screen Share */}
        <Button
          size="lg"
          variant={hasOngoingScreenShare ? "default" : "secondary"}
          onClick={toggleScreenShare}
          className={`rounded-full w-14 h-14 border-2 ${
            hasOngoingScreenShare
              ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
              : "bg-white hover:bg-gray-200 text-gray-900 border-gray-300"
          }`}
          title={hasOngoingScreenShare ? "Stop sharing" : "Share screen"}
        >
          {hasOngoingScreenShare ? (
            <IconScreenShareOff className="size-5" />
          ) : (
            <IconScreenShare className="size-5" />
          )}
        </Button>

        {/* Chat */}
        <Button
          size="lg"
          variant={settings.chatSidebarOpen ? "default" : "secondary"}
          onClick={toggleChat}
          className={`rounded-full w-14 h-14 border-2 ${
            settings.chatSidebarOpen
              ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
              : "bg-white hover:bg-gray-200 text-gray-900 border-gray-300"
          }`}
          title="Toggle chat"
        >
          <IconMessage className="size-5" />
        </Button>

        {/* Participants */}
        <Button
          size="lg"
          variant={settings.participantsSidebarOpen ? "default" : "secondary"}
          onClick={toggleParticipants}
          className={`rounded-full w-14 h-14 border-2 ${
            settings.participantsSidebarOpen
              ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
              : "bg-white hover:bg-gray-200 text-gray-900 border-gray-300"
          }`}
          title="Toggle participants"
        >
          <IconUsers className="size-5" />
        </Button>

        {/* Stats */}
        <Button
          size="lg"
          variant={settings.showCallStats ? "default" : "secondary"}
          onClick={toggleStats}
          className={`rounded-full w-14 h-14 border-2 ${
            settings.showCallStats
              ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
              : "bg-white hover:bg-gray-200 text-gray-900 border-gray-300"
          }`}
          title="Toggle call stats"
        >
          <IconChartBar className="size-5" />
        </Button>

        {/* Settings */}
        <Button
          size="lg"
          variant="secondary"
          onClick={() => setShowSettings(true)}
          className="rounded-full w-14 h-14 bg-white hover:bg-gray-200 text-gray-900 border-2 border-gray-300"
          title="Settings"
        >
          <IconSettings className="size-5" />
        </Button>

        {/* Leave Call */}
        <Button
          size="lg"
          variant="destructive"
          onClick={onLeave}
          className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700 text-white border-2 border-red-500"
          title="Leave call"
        >
          <IconPhoneOff className="size-5" />
        </Button>
      </div>

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
