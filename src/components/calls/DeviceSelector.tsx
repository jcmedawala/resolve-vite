"use client"

import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DeviceSelector() {
  const { useCameraState, useMicrophoneState } = useCallStateHooks();
  const { camera, devices: cameraDevices } = useCameraState();
  const { microphone, devices: micDevices } = useMicrophoneState();

  return (
    <div className="space-y-4">
      {/* Camera Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-white">Camera</Label>
        <Select
          value={camera?.selectedDevice || ''}
          onValueChange={(deviceId) => camera?.select(deviceId)}
        >
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Select camera" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white">
            {cameraDevices?.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Microphone Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-white">Microphone</Label>
        <Select
          value={microphone?.selectedDevice || ''}
          onValueChange={(deviceId) => microphone?.select(deviceId)}
        >
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Select microphone" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white">
            {micDevices?.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Speaker Selection - if available */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-white">Speaker</Label>
        <Select disabled>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="System default" />
          </SelectTrigger>
        </Select>
        <p className="text-xs text-gray-500">Speaker selection controlled by browser</p>
      </div>
    </div>
  );
}
