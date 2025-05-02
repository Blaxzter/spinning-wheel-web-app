"use client";

import React from "react";
import { useSound } from "@/contexts/SoundContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

export function SoundSettings() {
  const {
    tickSound,
    setTickSound,
    tickVolume,
    setTickVolume,
    isSoundEnabled,
    setSoundEnabled,
    playTick,
    availableSounds,
  } = useSound();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Sound Settings</CardTitle>
        <CardDescription>Customize the wheel sound effects</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="sound-enabled" className="flex items-center gap-2">
            Enable sounds
          </Label>
          <Switch
            id="sound-enabled"
            checked={isSoundEnabled}
            onCheckedChange={setSoundEnabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tick-sound">Tick Sound</Label>
          <div className="flex items-center gap-2">
            <Select
              value={tickSound}
              onValueChange={setTickSound}
              disabled={!isSoundEnabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a sound" />
              </SelectTrigger>
              <SelectContent>
                {availableSounds.map((sound) => (
                  <SelectItem key={sound.id} value={sound.path || "none"}>
                    {sound.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={playTick}
              disabled={
                !isSoundEnabled || tickSound === "" || tickSound === "none"
              }
              className="flex-shrink-0"
              title="Preview sound"
            >
              ▶
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="volume-slider">Volume</Label>
            <span>
              {isSoundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </span>
          </div>
          <div className="pt-1">
            <Slider
              id="volume-slider"
              disabled={!isSoundEnabled}
              value={[tickVolume * 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value: number[]) => setTickVolume(value[0] / 100)}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
