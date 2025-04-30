"use client"

import React, { useEffect, useState, useRef } from "react"
import { Wheel } from "@/components/wheel"
import { SimpleEditor } from "@/components/simple-editor"
import { AdvancedEditor } from "@/components/advanced-editor"
import { MenuBar } from "@/components/menu-bar"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { WheelOption, WheelData } from "@/lib/types"
import { generateRandomColor, type ColorPalette } from "@/lib/utils"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function SpinningWheel() {
  const [wheelName, setWheelName] = useState<string>("My Wheel")
  const [options, setOptions] = useState<WheelOption[]>([
    { id: "1", text: "Option 1", color: "#FF5733", enabled: true, weight: 1, image: null, imageMode: "center", colorSetByUser: false },
    { id: "2", text: "Option 2", color: "#33FF57", enabled: true, weight: 1, image: null, imageMode: "center", colorSetByUser: false },
    { id: "3", text: "Option 3", color: "#3357FF", enabled: true, weight: 1, image: null, imageMode: "center", colorSetByUser: false },
    { id: "4", text: "Option 4", color: "#F3FF33", enabled: true, weight: 1, image: null, imageMode: "center", colorSetByUser: false },
  ])
  const [isSpinning, setIsSpinning] = useState<boolean>(false)
  const [selectedOption, setSelectedOption] = useState<WheelOption | null>(null)
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false)
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true)
  const [sortMode, setSortMode] = useState<"name" | "weight" | "custom">("custom")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [colorPalette, setColorPalette] = useState<ColorPalette>(() => {
    // Load color palette from localStorage on initial load
    if (typeof window !== 'undefined') {
      const savedPalette = localStorage.getItem('wheelColorPalette');
      return savedPalette ? savedPalette as ColorPalette : 'default';
    }
    return 'default';
  });
  const { saveToLocalStorage, loadFromLocalStorage, getAllSavedWheels, errorDialogOpen, setErrorDialogOpen, errorMessage } = useWheelStorage()
  const [targetRotation, setTargetRotation] = useState<number | null>(null)
  const [currentRotation, setCurrentRotation] = useState<number>(0)
  const pendingSelectedOptionRef = useRef<WheelOption | null>(null)
  const getOptionAtPointerRef = useRef<(() => WheelOption | null)>(() => null)
  const [isNewWheelDialogOpen, setIsNewWheelDialogOpen] = useState(false)
  const [saveSuccessDialogOpen, setSaveSuccessDialogOpen] = useState(false)
  const [savedWheelName, setSavedWheelName] = useState("")
  const [noOptionsDialogOpen, setNoOptionsDialogOpen] = useState(false)

  // Handle spinning the wheel
  const spinWheel = () => {
    if (isSpinning) return

    setIsSpinning(true)
    setSelectedOption(null)

    // Calculate total weight for probability
    const enabledOptions = options.filter((opt) => opt.enabled)
    if (enabledOptions.length === 0) {
      setIsSpinning(false)
      setNoOptionsDialogOpen(true)
      return
    }

    const totalWeight = enabledOptions.reduce((sum, opt) => sum + opt.weight, 0)
    let random = Math.random() * totalWeight
    let selectedIndex = 0

    // Select based on weight
    for (let i = 0; i < enabledOptions.length; i++) {
      random -= enabledOptions[i].weight
      if (random <= 0) {
        selectedIndex = i
        break
      }
    }

    // Store the selected option for later
    const selectedOption = enabledOptions[selectedIndex]
    pendingSelectedOptionRef.current = selectedOption

    // Calculate the position for the selected option
    // We need to determine where in the wheel this option is located
    let currentAngle = 0

    // Calculate the angle for each option based on its weight
    for (let i = 0; i < enabledOptions.length; i++) {
      const option = enabledOptions[i]
      const sliceAngle = (360 * option.weight) / totalWeight

      if (option.id === selectedOption.id) {
        // This is our selected option
        // Calculate the middle angle of this slice
        const middleAngle = currentAngle + sliceAngle / 2

        // Calculate how much to rotate so this slice is at the right (0 degrees)
        // The pointer is at the right (0 degrees in standard polar coordinates)
        // We need to rotate the wheel so that the middle of the selected slice
        // aligns with the pointer at 0 degrees
        const rotationNeeded = -middleAngle

        // Add multiple full rotations for effect (between 5 and 8 full rotations)
        const fullRotations = (5 + Math.floor(Math.random() * 4)) * 360

        // Add a small random offset (between -5 and 5 degrees) to prevent landing exactly between options
        const randomOffset = (Math.random() - 0.5) * 10

        // Ensure we're adding to the current rotation to maintain momentum
        const finalRotation = currentRotation + fullRotations + rotationNeeded + randomOffset

        // Set the target rotation
        setTargetRotation(finalRotation)
        break
      }

      currentAngle += sliceAngle
    }
  }

  // Handle animation completion
  const handleAnimationComplete = () => {
    setIsSpinning(false)

    // Use the getOptionAtPointer function to determine the actual option at the pointer
    // This ensures the visual selection is in sync with the wheel's final position
    const actualSelectedOption = getOptionAtPointerRef.current ? 
      getOptionAtPointerRef.current() : 
      pendingSelectedOptionRef.current;
    
    setSelectedOption(actualSelectedOption)
    pendingSelectedOptionRef.current = null

    // Update current rotation to match target rotation after spin completes
    if (targetRotation !== null) {
      // Keep only the remainder after full rotations for better performance
      setCurrentRotation(targetRotation % 360)
    }
  }

  // Register the getOptionAtPointer function from Wheel component
  const registerGetOptionAtPointer = (getOptionAtPointerFn: () => WheelOption | null) => {
    getOptionAtPointerRef.current = getOptionAtPointerFn;
  }

  // Add a new option
  const addOption = (text: string) => {
    const newOption: WheelOption = {
      id: Date.now().toString(),
      text,
      color: generateRandomColor(colorPalette),
      enabled: true,
      weight: 1,
      image: null,
      imageMode: "center",
      colorSetByUser: false,
    }

    setOptions([...options, newOption])
  }

  // Update an option
  const updateOption = (id: string, updates: Partial<WheelOption>) => {
    // If the user is updating the color, mark it as manually set
    if (updates.color) {
      updates.colorSetByUser = true;
    }
    
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, ...updates } : opt)))
  }

  // Delete an option
  const deleteOption = (id: string) => {
    setOptions(options.filter((opt) => opt.id !== id))
  }

  // Handle bulk option creation from text
  const handleBulkCreate = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim() !== "")

    if (lines.length === 0) return

    const newOptions = lines.map((line) => ({
      id: Date.now() + Math.random().toString(),
      text: line.trim(),
      color: generateRandomColor(colorPalette),
      enabled: true,
      weight: 1,
      image: null,
      imageMode: "center" as const,
      colorSetByUser: false,
    }))

    setOptions([...options, ...newOptions])
  }

  // Sort options
  const sortOptions = () => {
    const sortedOptions = [...options]

    if (sortMode === "name") {
      sortedOptions.sort((a, b) => {
        return sortDirection === "asc" ? a.text.localeCompare(b.text) : b.text.localeCompare(a.text)
      })
    } else if (sortMode === "weight") {
      sortedOptions.sort((a, b) => {
        return sortDirection === "asc" ? a.weight - b.weight : b.weight - a.weight
      })
    }

    setOptions(sortedOptions)
  }

  // Shuffle options
  const shuffleOptions = () => {
    const shuffled = [...options]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    setOptions(shuffled)
    setSortMode("custom")
  }

  // Reorder options (for drag and drop)
  const reorderOptions = (startIndex: number, endIndex: number) => {
    const result = Array.from(options)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)

    setOptions(result)
    // Only set to custom if the user actually moved an item
    if (startIndex !== endIndex) {
      setSortMode("custom")
    }
  }

  // Save current wheel
  const saveWheel = () => {
    const wheelData: WheelData = {
      name: wheelName,
      options,
      lastModified: new Date().toISOString(),
      colorPalette,
    }

    const saveResult = saveToLocalStorage(wheelData)
    if (saveResult) {
      setSavedWheelName(saveResult)
      setSaveSuccessDialogOpen(true)
    }
  }

  // Load a wheel
  const loadWheel = (wheelData: WheelData) => {
    setWheelName(wheelData.name)
    setOptions(wheelData.options)
    if (wheelData.colorPalette) {
      setColorPalette(wheelData.colorPalette)
    }
  }

  // Effect to sort options when sort mode changes
  useEffect(() => {
    if (sortMode !== "custom") {
      sortOptions()
    }
  }, [sortMode, sortDirection]);

  // Regenerate colors for options without user-set colors
  const regenerateColors = () => {
    setOptions(currentOptions => 
      currentOptions.map(option => {
        // Only regenerate color if it wasn't manually set by user
        if (!option.colorSetByUser) {
          return {
            ...option,
            color: generateRandomColor(colorPalette)
          };
        }
        return option;
      })
    );
  }

  // Update colorPalette in localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wheelColorPalette', colorPalette);
      
      // Regenerate colors when palette changes
      regenerateColors();
    }
  }, [colorPalette]);

  const handleNewWheel = () => {
    setIsNewWheelDialogOpen(true)
  }

  const confirmNewWheel = () => {
    setWheelName("My Wheel")
    setOptions([
      {
        id: "1",
        text: "Option 1",
        color: generateRandomColor(colorPalette),
        enabled: true,
        weight: 1,
        image: null,
        imageMode: "center",
        colorSetByUser: false,
      },
      {
        id: "2",
        text: "Option 2",
        color: generateRandomColor(colorPalette),
        enabled: true,
        weight: 1,
        image: null,
        imageMode: "center",
        colorSetByUser: false,
      },
      {
        id: "3",
        text: "Option 3",
        color: generateRandomColor(colorPalette),
        enabled: true,
        weight: 1,
        image: null,
        imageMode: "center",
        colorSetByUser: false,
      },
      {
        id: "4",
        text: "Option 4",
        color: generateRandomColor(colorPalette),
        enabled: true,
        weight: 1,
        image: null,
        imageMode: "center",
        colorSetByUser: false,
      },
    ])
    setIsNewWheelDialogOpen(false)
  }

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      <header className="border-b">
        <MenuBar
          wheelName={wheelName}
          setWheelName={setWheelName}
          saveWheel={saveWheel}
          loadWheel={loadWheel}
          getAllSavedWheels={getAllSavedWheels}
          handleNewWheel={handleNewWheel}
          colorPalette={colorPalette}
          setColorPalette={setColorPalette}
          regenerateColors={regenerateColors}
        />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto">
          <Wheel
            options={options.filter((opt) => opt.enabled)}
            isSpinning={isSpinning}
            selectedOption={selectedOption}
            onSpin={spinWheel}
            targetRotation={targetRotation}
            currentRotation={currentRotation}
            onRotationChange={setCurrentRotation}
            onAnimationComplete={handleAnimationComplete}
            registerGetOptionAtPointer={registerGetOptionAtPointer}
          />

          {selectedOption && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 backdrop-blur-sm p-6 rounded-lg shadow-lg border z-20 text-center">
              <h2 className="text-2xl font-bold text-white">Selected:</h2>
              <p className="text-3xl mt-2 text-white font-bold">
                {selectedOption.text}
              </p>
              <div className="flex gap-2 justify-center mt-4">
                <Button 
                  variant="outline" 
                  className="bg-white hover:bg-gray-100" 
                  onClick={() => {
                    setSelectedOption(null);
                    setTargetRotation(null);
                  }}
                >
                  Hide
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => {
                    // Disable the winning option
                    setOptions(options.map(opt => 
                      opt.id === selectedOption.id 
                        ? { ...opt, enabled: false }
                        : opt
                    ));
                    setSelectedOption(null);
                    setTargetRotation(null);
                    setTimeout(() => spinWheel(), 100);
                  }}
                  disabled={options.filter(opt => opt.enabled).length <= 2}
                >
                  {options.filter(opt => opt.enabled).length <= 2 
                    ? "Not enough options left" 
                    : "Hide Option & Spin Again"}
                </Button>
              </div>
            </div>
          )}

          <Button
            size="lg"
            className="mt-8"
            onClick={spinWheel}
            disabled={isSpinning || options.filter((opt) => opt.enabled).length === 0}
          >
            {isSpinning ? "Spinning..." : "Spin the Wheel"}
          </Button>
        </main>

        <div className="flex">
          <div className="flex h-full items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-none"
            onClick={() => setIsPanelOpen(!isPanelOpen)}
          >
            {isPanelOpen ? <ChevronRight /> : <ChevronLeft />}
          </Button>
          </div>
          <div
            className={`${
              isPanelOpen ? "w-96" : "w-0"
            } transition-all duration-300 border-l overflow-hidden`}
          >
            <div className="p-4 h-full overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Options</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsAdvancedMode(!isAdvancedMode)}>
                    {isAdvancedMode ? "Simple Mode" : "Advanced Mode"}
                  </Button>
                </div>
              </div>

              {isAdvancedMode ? (
                <AdvancedEditor
                  options={options}
                  updateOption={updateOption}
                  deleteOption={deleteOption}
                  addOption={addOption}
                  reorderOptions={reorderOptions}
                  sortMode={sortMode}
                  setSortMode={setSortMode}
                  sortDirection={sortDirection}
                  setSortDirection={setSortDirection}
                  shuffleOptions={shuffleOptions}
                />
              ) : (
                <SimpleEditor
                  options={options}
                  handleBulkCreate={handleBulkCreate}
                  updateOption={updateOption}
                  deleteOption={deleteOption}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={isNewWheelDialogOpen} onOpenChange={setIsNewWheelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>New Wheel</AlertDialogTitle>
            <AlertDialogDescription>
              Create a new wheel? Unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmNewWheel}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={saveSuccessDialogOpen} onOpenChange={setSaveSuccessDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Saved</AlertDialogTitle>
            <AlertDialogDescription>
              Wheel saved as "{savedWheelName}"
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={noOptionsDialogOpen} onOpenChange={setNoOptionsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alert</AlertDialogTitle>
            <AlertDialogDescription>
              No enabled options to spin!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Custom hook for wheel storage
function useWheelStorage() {
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const showError = (message: string) => {
    setErrorMessage(message)
    setErrorDialogOpen(true)
  }

  const saveToLocalStorage = (wheelData: WheelData) => {
    try {
      const savedWheels = localStorage.getItem("savedWheels")
      const wheels: Record<string, WheelData> = savedWheels ? JSON.parse(savedWheels) : {}

      // Use name as key, but ensure it's unique
      let key = wheelData.name
      let counter = 1
      while (wheels[key] && counter < 100) {
        key = `${wheelData.name} (${counter})`
        counter++
      }

      wheels[key] = wheelData
      localStorage.setItem("savedWheels", JSON.stringify(wheels))
      return key
    } catch (error) {
      console.error("Error saving wheel:", error)
      showError("Failed to save wheel to local storage.")
      return null
    }
  }

  const loadFromLocalStorage = (name: string): WheelData | null => {
    try {
      const savedWheels = localStorage.getItem("savedWheels")
      if (!savedWheels) return null

      const wheels: Record<string, WheelData> = JSON.parse(savedWheels)
      return wheels[name] || null
    } catch (error) {
      console.error("Error loading wheel:", error)
      showError("Failed to load wheel from local storage.")
      return null
    }
  }

  const getAllSavedWheels = (): { name: string; data: WheelData }[] => {
    try {
      if (typeof window === 'undefined') return []
      const savedWheels = localStorage.getItem("savedWheels")
      if (!savedWheels) return []

      const wheels: Record<string, WheelData> = JSON.parse(savedWheels)
      return Object.entries(wheels).map(([name, data]) => ({ name, data }))
    } catch (error) {
      console.error("Error getting saved wheels:", error)
      showError("Failed to retrieve saved wheels from local storage.")
      return []
    }
  }

  return { 
    saveToLocalStorage, 
    loadFromLocalStorage, 
    getAllSavedWheels,
    errorDialogOpen,
    setErrorDialogOpen,
    errorMessage 
  }
}
