"use client"

import { useState, useEffect } from "react"
import type { WheelData, WheelOption } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, FileUp, Download, Plus, Share2, Database, Palette, Menu, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ColorPalette } from "@/lib/utils"
import { LoadWheelDialog } from "@/components/load-wheel-dialog"

interface MenuBarProps {
  wheelName: string
  setWheelName: (name: string) => void
  saveWheel: () => void
  loadWheel: (wheelData: WheelData) => void
  getAllSavedWheels: () => { name: string; data: WheelData }[]
  deleteWheel: (wheelName: string) => void
  renameWheel: (oldName: string, newName: string) => void
  handleNewWheel: () => void
  colorPalette: ColorPalette
  setColorPalette: (palette: ColorPalette) => void
  regenerateColors: () => void
  isWheelLoaded: boolean
  originalWheelName: string
  options: WheelOption[]
}

export function MenuBar({
  wheelName,
  setWheelName,
  saveWheel,
  loadWheel,
  getAllSavedWheels,
  deleteWheel,
  renameWheel,
  handleNewWheel,
  colorPalette,
  setColorPalette,
  regenerateColors,
  isWheelLoaded,
  originalWheelName,
  options,
}: MenuBarProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [savedWheels, setSavedWheels] = useState<{ name: string; data: WheelData }[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Refresh the saved wheels list when the dialog opens or wheels are modified
  useEffect(() => {
    if (isLoadDialogOpen) {
      setSavedWheels(getAllSavedWheels());
    }
  }, [isLoadDialogOpen, getAllSavedWheels]);
  
  // Handlers for wheel operations that refresh the list
  const handleDeleteWheel = (wheelName: string) => {
    deleteWheel(wheelName);
    setSavedWheels(getAllSavedWheels());
  };
  
  const handleRenameWheel = (oldName: string, newName: string) => {
    renameWheel(oldName, newName);
    setSavedWheels(getAllSavedWheels());
  };

  const handleSave = () => {
    saveWheel()
  }

  const handleExport = () => {
    const wheelData: WheelData = {
      name: wheelName,
      options: options,
      lastModified: new Date().toISOString(),
      colorPalette: colorPalette
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

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl)
  }

  // Color palette display names
  const paletteNames: Record<ColorPalette, string> = {
    default: "Default",
    pastel: "Pastel",
    vibrant: "Vibrant",
    muted: "Muted",
    dark: "Dark",
  }

  return (
    <div className="border-b">
      {/* Desktop menu (large screens) */}
      <div className="hidden lg:flex items-center justify-between p-4">
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

          <Button variant="outline" size="sm" onClick={() => setIsLoadDialogOpen(true)}>
            <Database className="h-4 w-4 mr-1" />
            Load
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Palette className="h-4 w-4 mr-1" />
                Colors: {paletteNames[colorPalette]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Color Palette</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(paletteNames).map(([value, name]) => (
                <DropdownMenuItem 
                  key={value} 
                  onClick={() => setColorPalette(value as ColorPalette)}
                  className={colorPalette === value ? "bg-accent" : ""}
                >
                  {name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={regenerateColors}>
                Regenerate Colors
              </DropdownMenuItem>
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
        </div>
      </div>

      {/* Medium screens layout */}
      <div className="hidden md:flex lg:hidden flex-col p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Spinning Wheel</h1>
            <Input
              value={wheelName}
              onChange={(e) => setWheelName(e.target.value)}
              className="w-36 sm:w-48"
              placeholder="Wheel Name"
            />
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={handleNewWheel} className="px-2">
              <Plus className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={handleSave} className="px-2">
              <Save className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={() => setIsLoadDialogOpen(true)} className="px-2">
              <Database className="h-4 w-4" />
            </Button>

            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="px-2">
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Color Palette: {paletteNames[colorPalette]}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(paletteNames).map(([value, name]) => (
                <DropdownMenuItem 
                  key={value} 
                  onClick={() => setColorPalette(value as ColorPalette)}
                  className={colorPalette === value ? "bg-accent" : ""}
                >
                  {name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={regenerateColors}>
                Regenerate Colors
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={handleExport} className="px-2">
            <Download className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="sm" onClick={handleImport} className="px-2">
            <FileUp className="h-4 w-4" />
          </Button>
          </div>
        </div>
        
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">Spinning Wheel</h1>
          
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
        
        {mobileMenuOpen && (
          <div className="absolute left-0 right-0 z-50 px-4 py-4 bg-background border-b shadow-md">
            <Input
              value={wheelName}
              onChange={(e) => setWheelName(e.target.value)}
              className="w-full mb-2"
              placeholder="Wheel Name"
            />
              
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={handleNewWheel}>
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>

              <Button variant="outline" size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>

              <Button variant="outline" size="sm" onClick={() => setIsLoadDialogOpen(true)}>
                <Database className="h-4 w-4 mr-1" />
                Load
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Palette className="h-4 w-4 mr-1" />
                    Colors
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Color Palette</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(paletteNames).map(([value, name]) => (
                    <DropdownMenuItem 
                      key={value} 
                      onClick={() => setColorPalette(value as ColorPalette)}
                      className={colorPalette === value ? "bg-accent" : ""}
                    >
                      {name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={regenerateColors}>
                    Regenerate Colors
                  </DropdownMenuItem>
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
            </div>
          </div>
        )}
      </div>

      <LoadWheelDialog
        isOpen={isLoadDialogOpen}
        onOpenChange={setIsLoadDialogOpen}
        savedWheels={savedWheels}
        onLoadWheel={loadWheel}
        onDeleteWheel={handleDeleteWheel}
        onRenameWheel={handleRenameWheel}
      />

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
