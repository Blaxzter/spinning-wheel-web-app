"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { WheelOption } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Trash2,
  GripVertical,
  ImageIcon,
  RefreshCw,
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowUpAZ,
  ArrowUpWideNarrow,
  Settings,
  ChevronDown,
  Volume2,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { calculateAverageColor } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SoundSettings } from "@/components/wheel/SoundSettings";

interface AdvancedEditorProps {
  options: WheelOption[];
  updateOption: (id: string, updates: Partial<WheelOption>) => void;
  deleteOption: (id: string) => void;
  addOption: (text: string) => void;
  reorderOptions: (startIndex: number, endIndex: number) => void;
  sortMode: "name" | "weight" | "custom";
  setSortMode: (mode: "name" | "weight" | "custom") => void;
  sortDirection: "asc" | "desc";
  setSortDirection: (direction: "asc" | "desc") => void;
  shuffleOptions: () => void;
  textSettings: { textRadiusPercent: number; fontSizePercent: number };
  setTextSettings: (settings: {
    textRadiusPercent: number;
    fontSizePercent: number;
  }) => void;
}

// Add this helper function at the top of the component
function isColorDark(color: string): boolean {
  // For hex colors
  if (color.startsWith("#")) {
    const r = Number.parseInt(color.slice(1, 3), 16);
    const g = Number.parseInt(color.slice(3, 5), 16);
    const b = Number.parseInt(color.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  }
  // For rgb colors
  if (color.startsWith("rgb")) {
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
      const r = Number.parseInt(match[0]);
      const g = Number.parseInt(match[1]);
      const b = Number.parseInt(match[2]);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 128;
    }
  }
  return false;
}

export function AdvancedEditor({
  options,
  updateOption,
  deleteOption,
  addOption,
  reorderOptions,
  sortMode,
  setSortMode,
  sortDirection,
  setSortDirection,
  shuffleOptions,
  textSettings,
  setTextSettings,
}: AdvancedEditorProps) {
  const [newOptionText, setNewOptionText] = useState("");
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [textSettingsPanelOpen, setTextSettingsPanelOpen] = useState(false);
  const [soundSettingsPanelOpen, setSoundSettingsPanelOpen] = useState(false);

  // Initialize color picker when dialog opens
  useEffect(() => {
    if (colorDialogOpen && editingOptionId) {
      const option = options.find((opt) => opt.id === editingOptionId);
      if (option) {
        setCurrentColor(option.color);
      }
    }
  }, [colorDialogOpen, editingOptionId, options]);

  const handleAddOption = () => {
    if (newOptionText.trim()) {
      addOption(newOptionText.trim());
      setNewOptionText("");
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    reorderOptions(result.source.index, result.destination.index);
  };

  const handleImageUpload = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const imageUrl = event.target.result as string;

        // Calculate average color from image
        try {
          const avgColor = await calculateAverageColor(imageUrl);
          // Lighten the color a bit
          const lighterColor = avgColor;

          updateOption(id, {
            image: imageUrl,
            color: lighterColor,
            imageMode: "center", // Default to center mode
          });
        } catch (error) {
          console.error("Error calculating average color:", error);
          updateOption(id, {
            image: imageUrl,
            imageMode: "center", // Default to center mode
          });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={shuffleOptions}
          title="Shuffle options"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Shuffle
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (sortMode === "name") {
              if (sortDirection === "asc") {
                setSortDirection("desc");
              } else {
                setSortMode("weight");
                setSortDirection("desc");
              }
            } else if (sortMode === "weight") {
              if (sortDirection === "desc") {
                setSortDirection("asc");
              } else {
                setSortMode("name");
                setSortDirection("asc");
              }
            } else {
              // If in custom mode, start with name ascending
              setSortMode("name");
              setSortDirection("asc");
            }
          }}
          title="Change sort order"
        >
          {sortMode === "name" ? (
            sortDirection === "asc" ? (
              <ArrowDownAZ className="h-4 w-4 mr-1" />
            ) : (
              <ArrowUpAZ className="h-4 w-4 mr-1" />
            )
          ) : sortMode === "weight" ? (
            sortDirection === "asc" ? (
              <ArrowDownWideNarrow className="h-4 w-4 mr-1" />
            ) : (
              <ArrowUpWideNarrow className="h-4 w-4 mr-1" />
            )
          ) : (
            <GripVertical className="h-4 w-4 mr-1" />
          )}
          {sortMode === "name"
            ? "Name"
            : sortMode === "weight"
            ? "Weight"
            : "Custom"}
        </Button>

        <div className="flex-1" />

        <Button
          variant={textSettingsPanelOpen ? "default" : "outline"}
          size="sm"
          onClick={() => setTextSettingsPanelOpen(!textSettingsPanelOpen)}
          title="Text settings"
        >
          <Settings className="h-4 w-4" />
        </Button>

        <Button
          variant={soundSettingsPanelOpen ? "default" : "outline"}
          size="sm"
          onClick={() => setSoundSettingsPanelOpen(!soundSettingsPanelOpen)}
          title="Sound settings"
        >
          <Volume2 className="h-4 w-4" />
        </Button>
      </div>

      <Collapsible
        open={textSettingsPanelOpen}
        onOpenChange={setTextSettingsPanelOpen}
        className="w-full"
      >
        <CollapsibleContent className="border rounded-md mb-4 CollapsibleContent">
          <div className="p-4">
            <h3 className="font-medium">Text Settings</h3>

            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="text-position">Text Position</Label>
                  <span className="text-xs">
                    {Math.round(textSettings.textRadiusPercent * 100)}%
                  </span>
                </div>
                <Slider
                  id="text-position"
                  value={[textSettings.textRadiusPercent * 100]}
                  min={40}
                  max={90}
                  step={1}
                  onValueChange={(value) =>
                    setTextSettings({
                      ...textSettings,
                      textRadiusPercent: value[0] / 100,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Adjust the distance of text from the center (40% - 90%)
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="font-size">Font Size</Label>
                  <span className="text-xs">
                    {Math.round(textSettings.fontSizePercent * 1000) / 10}%
                  </span>
                </div>
                <Slider
                  id="font-size"
                  value={[textSettings.fontSizePercent * 100]}
                  min={2}
                  max={15}
                  step={0.1}
                  onValueChange={(value) =>
                    setTextSettings({
                      ...textSettings,
                      fontSizePercent: value[0] / 100,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Adjust the text size (2% - 15% of wheel radius)
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible
        open={soundSettingsPanelOpen}
        onOpenChange={setSoundSettingsPanelOpen}
        className="w-full"
      >
        <CollapsibleContent className="CollapsibleContent">
          <SoundSettings />
        </CollapsibleContent>
      </Collapsible>

      <div className="flex gap-2">
        <Input
          placeholder="Add new option..."
          value={newOptionText}
          onChange={(e) => setNewOptionText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
        />
        <Button onClick={handleAddOption}>Add</Button>
      </div>

      <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="options-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {options.map((option, index) => (
                  <Draggable
                    key={option.id}
                    draggableId={option.id}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="border rounded-md p-3 bg-background"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab"
                          >
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                          </div>

                          <Switch
                            checked={option.enabled}
                            onCheckedChange={(checked) =>
                              updateOption(option.id, { enabled: checked })
                            }
                          />

                          <div className="flex-1 min-w-[100px]">
                            <Input
                              value={option.text}
                              onChange={(e) =>
                                updateOption(option.id, {
                                  text: e.target.value,
                                })
                              }
                              className="h-8"
                            />
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => deleteOption(option.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Replace the color selection section in the grid */}
                          <div className="space-y-2">
                            <Label>Color</Label>
                            <div
                              className="h-8 rounded border cursor-pointer flex items-center justify-center"
                              style={{ backgroundColor: option.color }}
                              onClick={() => {
                                setEditingOptionId(option.id);
                                setCurrentColor(option.color);
                                setColorDialogOpen(true);
                              }}
                            >
                              <span
                                className="text-xs font-mono"
                                style={{
                                  color: isColorDark(option.color)
                                    ? "white"
                                    : "black",
                                  textShadow: "0 0 2px rgba(0,0,0,0.5)",
                                }}
                              >
                                {option.color.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Weight</Label>
                            <div className="flex gap-2 items-center">
                              <Slider
                                value={[option.weight]}
                                min={1}
                                max={10}
                                step={1}
                                onValueChange={(value) =>
                                  updateOption(option.id, { weight: value[0] })
                                }
                                className="flex-1"
                              />
                              <span className="w-8 text-center">
                                {option.weight}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 space-y-2">
                          <Label>Image</Label>
                          <div className="flex flex-wrap gap-2 items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => {
                                const input = document.createElement("input");
                                input.type = "file";
                                input.accept = "image/*";
                                input.onchange = (e) =>
                                  handleImageUpload(option.id, e as any);
                                input.click();
                              }}
                            >
                              <ImageIcon className="h-4 w-4 mr-1" />
                              {option.image ? "Change Image" : "Add Image"}
                            </Button>

                            {option.image && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() =>
                                  updateOption(option.id, { image: null })
                                }
                              >
                                Remove Image
                              </Button>
                            )}
                          </div>

                          {option.image && (
                            <div className="mt-2">
                              <img
                                src={option.image || "/placeholder.svg"}
                                alt={option.text}
                                className="h-16 object-contain rounded-md"
                              />

                              <div className="mt-2">
                                <Label className="mb-1 block">Image Mode</Label>
                                <div className="flex gap-2 flex-wrap">
                                  <Button
                                    type="button"
                                    variant={
                                      option.imageMode === "center"
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    onClick={() =>
                                      updateOption(option.id, {
                                        imageMode: "center",
                                      })
                                    }
                                    className="flex-1"
                                  >
                                    Center
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={
                                      option.imageMode === "fill"
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    onClick={() =>
                                      updateOption(option.id, {
                                        imageMode: "fill",
                                      })
                                    }
                                    className="flex-1"
                                  >
                                    Fill
                                  </Button>
                                </div>
                              </div>

                              <div className="mt-2">
                                <Button
                                  type="button"
                                  variant={
                                    option.hideTextWithImage
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() =>
                                    updateOption(option.id, {
                                      hideTextWithImage:
                                        !option.hideTextWithImage,
                                    })
                                  }
                                  className="w-full"
                                >
                                  {option.hideTextWithImage
                                    ? "Text Hidden"
                                    : "Show Text With Image"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <Dialog open={colorDialogOpen} onOpenChange={setColorDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Choose Color</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <ColorPicker color={currentColor} onChange={setCurrentColor} />
            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setColorDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingOptionId) {
                    updateOption(editingOptionId, { color: currentColor });
                  }
                  setColorDialogOpen(false);
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
