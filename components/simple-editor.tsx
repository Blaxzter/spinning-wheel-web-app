"use client"
import { useState } from "react"
import type { WheelOption } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, X, Plus } from "lucide-react"

interface SimpleEditorProps {
  options: WheelOption[]
  handleBulkCreate: (text: string) => void
  updateOption: (id: string, updates: Partial<WheelOption>) => void
  deleteOption: (id: string) => void
}

export function SimpleEditor({ options, handleBulkCreate, updateOption, deleteOption }: SimpleEditorProps) {
  const [newOptionText, setNewOptionText] = useState("")

  const handleAddOption = () => {
    if (newOptionText.trim()) {
      handleBulkCreate(newOptionText.trim())
      setNewOptionText("")
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new-option">Add New Option</Label>
        <div className="flex gap-2">
          <Input
            id="new-option"
            placeholder="Enter option text..."
            value={newOptionText}
            onChange={(e) => setNewOptionText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
          />
          <Button onClick={handleAddOption} size="icon">
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add option</span>
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Options</Label>
        <div className="border rounded-md overflow-hidden">
          {options.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No options added yet. Add your first option above.
            </div>
          ) : (
            <ul className="divide-y">
              {options.map((option) => (
                <li key={option.id} className="flex items-center gap-2 p-2 hover:bg-muted/50">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateOption(option.id, { enabled: !option.enabled })}
                    title={option.enabled ? "Disable option" : "Enable option"}
                  >
                    {option.enabled ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">{option.enabled ? "Disable" : "Enable"} option</span>
                  </Button>

                  <Input
                    value={option.text}
                    onChange={(e) => updateOption(option.id, { text: e.target.value })}
                    className="h-8 flex-1"
                  />

                  <div className="w-3 h-8 rounded-sm" style={{ backgroundColor: option.color }} title="Option color" />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteOption(option.id)}
                    title="Delete option"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Delete option</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>Switch to Advanced Mode for more customization options like colors, weights, and images.</p>
      </div>
    </div>
  )
}
