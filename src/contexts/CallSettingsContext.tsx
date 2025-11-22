"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type LayoutMode = 'grid' | 'speaker';

export interface CallSettings {
  // Device preferences
  selectedMicrophone?: string;
  selectedCamera?: string;
  selectedSpeaker?: string;

  // Layout preferences
  layoutMode: LayoutMode;

  // Effects
  backgroundBlurEnabled: boolean;
  noiseCancellationEnabled: boolean;

  // UI preferences
  chatSidebarOpen: boolean;
  participantsSidebarOpen: boolean;
  showCallStats: boolean;
}

interface CallSettingsContextType {
  settings: CallSettings;
  updateSettings: (updates: Partial<CallSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: CallSettings = {
  layoutMode: 'speaker',
  backgroundBlurEnabled: false,
  noiseCancellationEnabled: false,
  chatSidebarOpen: false,
  participantsSidebarOpen: false,
  showCallStats: false,
};

const STORAGE_KEY = 'resolve-call-settings';

const CallSettingsContext = createContext<CallSettingsContextType | undefined>(undefined);

export function CallSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CallSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (err) {
      console.error('[CallSettings] Error loading settings:', err);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error('[CallSettings] Error saving settings:', err);
    }
  }, [settings]);

  const updateSettings = (updates: Partial<CallSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <CallSettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </CallSettingsContext.Provider>
  );
}

export function useCallSettings() {
  const context = useContext(CallSettingsContext);
  if (!context) {
    throw new Error('useCallSettings must be used within CallSettingsProvider');
  }
  return context;
}
