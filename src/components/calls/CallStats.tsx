"use client"

import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CallStats() {
  const { useCallStatsReport } = useCallStateHooks();
  const statsReport = useCallStatsReport();

  if (!statsReport) {
    return (
      <Card className="bg-gray-900/90 border-gray-800 backdrop-blur-sm w-64">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white">Call Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-400">No stats available</p>
        </CardContent>
      </Card>
    );
  }

  // Get the first publisher/subscriber stats (usually there's only one)
  const pubStats = (statsReport as any)?.publisherStats?.[0];
  const subStats = (statsReport as any)?.subscriberStats?.[0];

  return (
    <Card className="bg-gray-900/90 border-gray-800 backdrop-blur-sm w-64">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-white">Call Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {/* Publisher Stats (Outgoing) */}
        {pubStats && (
          <div>
            <h4 className="text-gray-400 font-medium mb-1.5">Outgoing</h4>
            <div className="space-y-1 text-gray-300">
              <div className="flex justify-between">
                <span>Bitrate:</span>
                <span className="font-mono">{Math.round((pubStats.bitrate || 0) / 1000)} kbps</span>
              </div>
              <div className="flex justify-between">
                <span>FPS:</span>
                <span className="font-mono">{pubStats.framesPerSecond || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Resolution:</span>
                <span className="font-mono">
                  {pubStats.frameWidth}x{pubStats.frameHeight}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Subscriber Stats (Incoming) */}
        {subStats && (
          <div>
            <h4 className="text-gray-400 font-medium mb-1.5">Incoming</h4>
            <div className="space-y-1 text-gray-300">
              <div className="flex justify-between">
                <span>Bitrate:</span>
                <span className="font-mono">{Math.round((subStats.bitrate || 0) / 1000)} kbps</span>
              </div>
              <div className="flex justify-between">
                <span>Jitter:</span>
                <span className="font-mono">{Math.round(subStats.jitter || 0)} ms</span>
              </div>
              <div className="flex justify-between">
                <span>Packet Loss:</span>
                <span className="font-mono">{subStats.packetsLost || 0}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
