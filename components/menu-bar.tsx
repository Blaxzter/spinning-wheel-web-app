"use client"

import { useState } from "react"
import type { WheelData } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, FileUp, Download, Plus, Share2, Database } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MenuBarProps {
  wheelName: string
  setWheelName: (name: string) => void
  saveWheel: () => void
  loadWheel: (wheelData: WheelData) => void
  getAllSavedWheels: () => { name: string; data: WheelData }[]
  handleNewWheel: () => void
}

export function MenuBar({
  wheelName,
  setWheelName,
  saveWheel,
  loadWheel,
  getAllSavedWheels,
  handleNewWheel,
}: MenuBarProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")

  const handleSave = () => {
    saveWheel()
  }

  const handleExport = () => {
    const wheelData: WheelData = {
      name: wheelName,
      options: [], // This will be filled by the parent component
      lastModified: new Date().toISOString(),
    }

    const dataStr = JSON.stringify(wheelData)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `${wheelName.replace(/\s+/g, "-").toLowerCase()}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const wheelData = JSON.parse(e.target?.result as string) as WheelData
          loadWheel(wheelData)
        } catch (error) {
          console.error("Error parsing wheel data:", error)
          alert("Invalid wheel data file")
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleShare = () => {
    // In a real app, this would generate a shareable link
    // For now, we'll just simulate it
    const dummyShareUrl = `https://example.com/wheel/${encodeURIComponent(wheelName)}`
    setShareUrl(dummyShareUrl)
    setIsShareDialogOpen(true)
  }

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl)
  }

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">Spinning Wheel</h1>
        <Input
          value={wheelName}
          onChange={(e) => setWheelName(e.target.value)}
          className="w-64"
          placeholder="Wheel Name"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleNewWheel}>
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>

        <Button variant="outline" size="sm" onClick={handleSave}>
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Database className="h-4 w-4 mr-1" />
              Load
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Saved Wheels</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {getAllSavedWheels().map(({ name, data }) => (
              <DropdownMenuItem key={name} onClick={() => loadWheel(data)}>
                {name}
              </DropdownMenuItem>
            ))}
            {getAllSavedWheels().length === 0 && <DropdownMenuItem disabled>No saved wheels</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>

        <Button variant="outline" size="sm" onClick={handleImport}>
          <FileUp className="h-4 w-4 mr-1" />
          Import
        </Button>

        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      </div>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Wheel</DialogTitle>
            <DialogDescription>Share this link with others to let them use your wheel</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Input value={shareUrl} readOnly />
            <Button onClick={handleCopyShareUrl}>Copy</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
