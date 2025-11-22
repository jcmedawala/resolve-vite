"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeviceSelector } from "./DeviceSelector";
import { useCallSettings } from "@/contexts/CallSettingsContext";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useCallSettings();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Call Settings</DialogTitle>
          <DialogDescription className="text-gray-400">
            Adjust your devices and call preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Device Settings */}
          <div>
            <h3 className="text-sm font-medium mb-3">Devices</h3>
            <DeviceSelector />
          </div>

          {/* Effects Settings */}
          <div>
            <h3 className="text-sm font-medium mb-3">Effects</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="background-blur" className="text-sm font-medium">
                    Background Blur
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Blur your background during the call
                  </p>
                </div>
                <Switch
                  id="background-blur"
                  checked={settings.backgroundBlurEnabled}
                  onCheckedChange={(checked) =>
                    updateSettings({ backgroundBlurEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="noise-cancellation" className="text-sm font-medium">
                    Noise Cancellation
                  </Label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Reduce background noise from your microphone
                  </p>
                </div>
                <Switch
                  id="noise-cancellation"
                  checked={settings.noiseCancellationEnabled}
                  onCheckedChange={(checked) =>
                    updateSettings({ noiseCancellationEnabled: checked })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
