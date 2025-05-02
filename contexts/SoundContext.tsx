"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SoundContextType {
  tickSound: string;
  setTickSound: (sound: string) => void;
  tickVolume: number;
  setTickVolume: (volume: number) => void;
  isSoundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playTick: () => void;
  availableSounds: { id: string; name: string; path: string }[];
}

const defaultSounds = [
  { id: "tick1", name: "Tick 1", path: "/sounds/tick1.mp3" },
  { id: "tick2", name: "Tick 2", path: "/sounds/tick2.mp3" },
  { id: "tick3", name: "Tick 3", path: "/sounds/tick3.mp3" },
  { id: "tick4", name: "Tick 4", path: "/sounds/tick4.mp3" },
  { id: "none", name: "None", path: "none" },
];

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [tickSound, setTickSound] = useState<string>("/sounds/tick1.mp3");
  const [tickVolume, setTickVolume] = useState<number>(0.5);
  const [isSoundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Initialize audio on client side with improved preloading
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load sound settings from localStorage
      const savedTickSound = localStorage.getItem("wheelTickSound");
      const savedTickVolume = localStorage.getItem("wheelTickVolume");
      const savedSoundEnabled = localStorage.getItem("wheelSoundEnabled");

      if (savedTickSound) setTickSound(savedTickSound);
      if (savedTickVolume) setTickVolume(parseFloat(savedTickVolume));
      if (savedSoundEnabled) setSoundEnabled(savedSoundEnabled === "true");

      // Pre-load audio files
      defaultSounds.forEach((sound) => {
        if (sound.path !== "none") {
          const audio = new Audio(sound.path);
          audio.load();
        }
      });
    }
  }, []);

  useEffect(() => {
    // Update audio elements when sound changes
    if (tickSound && tickSound !== "none") {
      // Preload the sound file
      const audio = new Audio(tickSound);
      audio.load();
    }

    // Save settings to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("wheelTickSound", tickSound);
    }
  }, [tickSound]);

  useEffect(() => {
    // Save volume setting to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("wheelTickVolume", tickVolume.toString());
    }
  }, [tickVolume]);

  useEffect(() => {
    // Save sound enabled setting to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("wheelSoundEnabled", isSoundEnabled.toString());
    }
  }, [isSoundEnabled]);

  const playTick = () => {
    if (!isSoundEnabled || !tickSound || tickSound === "none") {
      return;
    }

    try {
      // Simple approach: create a new Audio instance each time
      const audio = new Audio(tickSound);
      audio.volume = tickVolume;

      audio.play().catch((err) => {
        console.error("Sound playback failed:", err);
      });
    } catch (err) {
      console.error("Error in playTick:", err);
    }
  };

  return (
    <SoundContext.Provider
      value={{
        tickSound,
        setTickSound,
        tickVolume,
        setTickVolume,
        isSoundEnabled,
        setSoundEnabled,
        playTick,
        availableSounds: defaultSounds,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
}
