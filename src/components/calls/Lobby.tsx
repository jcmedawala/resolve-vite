"use client"

import { useState } from "react";
import {
  useCall,
  useCallStateHooks,
  VideoPreview,
} from "@stream-io/video-react-sdk";
import { DeviceSelector } from "./DeviceSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IconVideo,
  IconVideoOff,
  IconMicrophone,
  IconMicrophoneOff,
  IconSettings,
  IconArrowLeft,
} from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface LobbyProps {
  onJoin: (options: { micEnabled: boolean; cameraEnabled: boolean }) => void;
  onBack: () => void;
}

export function Lobby({ onJoin, onBack }: LobbyProps) {
  const call = useCall();
  const { useCameraState, useMicrophoneState } = useCallStateHooks();
  const { camera, isMute: isCameraMuted } = useCameraState();
  const { microphone, isMute: isMicMuted } = useMicrophoneState();
  const [showSettings, setShowSettings] = useState(false);

  // Get current user info
  const currentUser = useQuery(api.myFunctions.getCurrentUser);

  const userName = currentUser?.name ||
    `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() ||
    'User';

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

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 text-white hover:text-white hover:bg-white/10"
        >
          <IconArrowLeft className="mr-2 size-4" />
          Back to Calls
        </Button>

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Ready to join?</CardTitle>
            <CardDescription className="text-gray-400">
              Check your camera and microphone before joining the call
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Video Preview - Centered */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-2xl aspect-video bg-gray-900 rounded-lg overflow-hidden">
                {call && (
                  <VideoPreview
                    className="w-full h-full object-cover"
                    DisabledVideoPreview={() => (
                      <div className="flex items-center justify-center h-full bg-gray-900">
                        <div className="text-center">
                          <IconVideoOff className="size-16 text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-400">Camera is off</p>
                        </div>
                      </div>
                    )}
                  />
                )}

                {/* User name overlay */}
                <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1.5 rounded-lg">
                  <p className="text-white font-medium">{userName}</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              {/* Microphone toggle */}
              <Button
                size="lg"
                variant={isMicMuted ? "destructive" : "secondary"}
                onClick={toggleMicrophone}
                className="rounded-full w-14 h-14"
                title={isMicMuted ? "Unmute microphone" : "Mute microphone"}
              >
                {isMicMuted ? (
                  <IconMicrophoneOff className="size-5" />
                ) : (
                  <IconMicrophone className="size-5" />
                )}
              </Button>

              {/* Camera toggle */}
              <Button
                size="lg"
                variant={isCameraMuted ? "destructive" : "secondary"}
                onClick={toggleCamera}
                className="rounded-full w-14 h-14"
                title={isCameraMuted ? "Turn on camera" : "Turn off camera"}
              >
                {isCameraMuted ? (
                  <IconVideoOff className="size-5" />
                ) : (
                  <IconVideo className="size-5" />
                )}
              </Button>

              {/* Settings button */}
              <Button
                size="lg"
                variant="secondary"
                onClick={() => setShowSettings(!showSettings)}
                className="rounded-full w-14 h-14"
                title="Device settings"
              >
                <IconSettings className="size-5" />
              </Button>
            </div>

            {/* Device Settings */}
            {showSettings && call && (
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Device Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <DeviceSelector />
                </CardContent>
              </Card>
            )}

            {/* Join button */}
            <Button
              size="lg"
              onClick={() => onJoin({ micEnabled: !isMicMuted, cameraEnabled: !isCameraMuted })}
              className="w-full text-lg h-12 bg-blue-600 hover:bg-blue-700"
            >
              Join Call
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
