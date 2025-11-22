"use client"

import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { IconMicrophone, IconMicrophoneOff, IconVideo, IconVideoOff } from "@tabler/icons-react";

// Stream SDK TrackType enum values
const TRACK_TYPE_AUDIO = 1;
const TRACK_TYPE_VIDEO = 2;

export function ParticipantsSidebar() {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  return (
    <div className="p-4 space-y-2 overflow-y-auto h-full">
      {participants.map((participant) => {
        // Check if audio and video tracks are published
        const isAudioMuted = !participant.publishedTracks.some(track => track === TRACK_TYPE_AUDIO);
        const isVideoMuted = !participant.publishedTracks.some(track => track === TRACK_TYPE_VIDEO);

        return (
          <div
            key={participant.sessionId}
            className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
          >
            {/* Avatar/Initial */}
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
              {participant.name?.[0]?.toUpperCase() || participant.userId[0]?.toUpperCase() || 'U'}
            </div>

            {/* Name and status */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {participant.name || `User ${participant.userId.slice(0, 8)}`}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {isAudioMuted ? (
                  <IconMicrophoneOff className="size-3.5 text-red-400" />
                ) : (
                  <IconMicrophone className="size-3.5 text-green-400" />
                )}
                {isVideoMuted ? (
                  <IconVideoOff className="size-3.5 text-red-400" />
                ) : (
                  <IconVideo className="size-3.5 text-green-400" />
                )}
              </div>
            </div>
          </div>
        );
      })}

      {participants.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          <p>No participants yet</p>
        </div>
      )}
    </div>
  );
}
