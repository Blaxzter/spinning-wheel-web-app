"use client"

import type React from "react"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import type { WheelOption } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Trash2,
  GripVertical,
  RefreshCw,
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface OptionsProps {
  options: WheelOption[]
  updateOption: (id: string, updates: Partial<WheelOption>) => void
  deleteOption: (id: string) => void
  addOption: (text: string) => void
  reorderOptions: (startIndex: number, endIndex: number) => void
  sortMode: "name" | "weight" | "custom"
  setSortMode: (mode: "name" | "weight" | "custom") => void
  sortDirection: "asc" | "desc"
  setSortDirection: (direction: "asc" | "desc") => void
  shuffleOptions: () => void
}

export function OptionsPanel({
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
}: OptionsProps) {
  const [newOptionText, setNewOptionText] = useState("")

  const handleAddOption = () => {
    if (newOptionText.trim()) {
      addOption(newOptionText.trim())
      setNewOptionText("")
    }
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    reorderOptions(result.source.index, result.destination.index)
  }

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        updateOption(id, { image: event.target.result as string })
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={shuffleOptions} title="Shuffle options">
          <RefreshCw className="h-4 w-4 mr-1" />
          Shuffle
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (sortMode === "name") {
              if (sortDirection === "asc") {
                setSortDirection("desc")
              } else {
                setSortMode("weight")
                setSortDirection("desc")
              }
            } else if (sortMode === "weight") {
              if (sortDirection === "desc") {
                setSortDirection("asc")
              } else {
                setSortMode("name")
                setSortDirection("asc")
              }
            } else {
              setSortMode("name")
              setSortDirection("asc")
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
          {sortMode === "name" ? "Name" : sortMode === "weight" ? "Weight" : "Custom"}
        </Button>
      </div>

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
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {options.map((option, index) => (
                  <Draggable key={option.id} draggableId={option.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="border rounded-md p-3 bg-background"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div {...provided.dragHandleProps} className="cursor-grab">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                          </div>

                          <Switch
                            checked={option.enabled}
                            onCheckedChange={(checked) => updateOption(option.id, { enabled: checked })}
                          />

                          <div className="flex-1">
                            <Input
                              value={option.text}
                              onChange={(e) => updateOption(option.id, { text: e.target.value })}
                              className="h-8"
                            />
                          </div>

                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                style={{ backgroundColor: option.color }}
                              >
                                <span className="sr-only">Pick color</span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                              <div className="space-y-2">
                                <Label>Color</Label>
                                <Input
                                  type="color"
                                  value={option.color}
                                  onChange={(e) => updateOption(option.id, { color: e.target.value })}
                                  className="h-8"
                                />
                              </div>
                            </PopoverContent>
                          </Popover>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => deleteOption(option.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
    </div>
  )
}
