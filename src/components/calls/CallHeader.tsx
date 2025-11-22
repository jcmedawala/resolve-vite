"use client"

import { Button } from "@/components/ui/button";
import { IconLayoutGrid, IconLayoutList, IconUsers } from "@tabler/icons-react";
import type { LayoutMode } from "@/contexts/CallSettingsContext";

interface CallHeaderProps {
  participantCount: number;
  duration: string;
  layoutMode: LayoutMode;
  onLayoutChange: (mode: LayoutMode) => void;
}

export function CallHeader({
  participantCount,
  duration,
  layoutMode,
  onLayoutChange,
}: CallHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
      {/* Left side - Call info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-300">
          <IconUsers className="size-5" />
          <span className="font-medium">{participantCount}</span>
        </div>
        <div className="text-gray-400">
          <span>{duration}</span>
        </div>
      </div>

      {/* Right side - Layout switcher */}
      <div className="flex items-center gap-2">
        <Button
          variant={layoutMode === 'grid' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onLayoutChange('grid')}
          className={layoutMode === 'grid' ? 'bg-blue-600 hover:bg-blue-700' : 'text-gray-400 hover:text-white'}
          title="Grid view"
        >
          <IconLayoutGrid className="size-4 mr-1.5" />
          Grid
        </Button>
        <Button
          variant={layoutMode === 'speaker' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onLayoutChange('speaker')}
          className={layoutMode === 'speaker' ? 'bg-blue-600 hover:bg-blue-700' : 'text-gray-400 hover:text-white'}
          title="Speaker view"
        >
          <IconLayoutList className="size-4 mr-1.5" />
          Speaker
        </Button>
      </div>
    </div>
  );
}
