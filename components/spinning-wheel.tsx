"use client"

import { useEffect, useState, useRef } from "react"
import { Wheel } from "./wheel"
import { SimpleEditor } from "./simple-editor"
import { AdvancedEditor } from "./advanced-editor"
import { MenuBar } from "./menu-bar"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { WheelOption, WheelData } from "@/lib/types"
import { generateRandomColor } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export function SpinningWheel() {
  const { toast } = useToast()
  const [wheelName, setWheelName] = useState<string>("My Wheel")
  const [options, setOptions] = useState<WheelOption[]>([
    { id: "1", text: "Option 1", color: "#FF5733", enabled: true, weight: 1, image: null, imageMode: "center" },
    { id: "2", text: "Option 2", color: "#33FF57", enabled: true, weight: 1, image: null, imageMode: "center" },
    { id: "3", text: "Option 3", color: "#3357FF", enabled: true, weight: 1, image: null, imageMode: "center" },
    { id: "4", text: "Option 4", color: "#F3FF33", enabled: true, weight: 1, image: null, imageMode: "center" },
  ])
  const [isSpinning, setIsSpinning] = useState<boolean>(false)
  const [selectedOption, setSelectedOption] = useState<WheelOption | null>(null)
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false)
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true)
  const [sortMode, setSortMode] = useState<"name" | "weight" | "custom">("custom")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const { saveToLocalStorage, loadFromLocalStorage, getAllSavedWheels } = useWheelStorage()
  const [targetRotation, setTargetRotation] = useState<number | null>(null)
  const [currentRotation, setCurrentRotation] = useState<number>(0)
  const pendingSelectedOptionRef = useRef<WheelOption | null>(null)

  // Handle spinning the wheel
  const spinWheel = () => {
    if (isSpinning) return

    setIsSpinning(true)
    setSelectedOption(null)

    // Calculate total weight for probability
    const enabledOptions = options.filter((opt) => opt.enabled)
    if (enabledOptions.length === 0) {
      setIsSpinning(false)
      toast({
        title: "Alert",
        description: "No enabled options to spin!",
      })
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

        // Calculate how much to rotate so this slice is at the top (270 degrees)
        // The pointer is at the top (270 degrees in standard polar coordinates)
        const rotationNeeded = 270 - middleAngle

        // Add multiple full rotations for effect (between 5 and 8 full rotations)
        const fullRotations = (5 + Math.floor(Math.random() * 4)) * 360

        // Ensure we're adding to the current rotation to maintain momentum
        // and add a small random offset to make each spin feel different
        const finalRotation = currentRotation + fullRotations + rotationNeeded

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

    // Set the selected option from our stored reference
    if (pendingSelectedOptionRef.current) {
      setSelectedOption(pendingSelectedOptionRef.current)
      pendingSelectedOptionRef.current = null
    }

    // Update current rotation to match target rotation after spin completes
    if (targetRotation !== null) {
      // Keep only the remainder after full rotations for better performance
      setCurrentRotation(targetRotation % 360)
    }
  }

  // Add a new option
  const addOption = (text: string) => {
    const newOption: WheelOption = {
      id: Date.now().toString(),
      text,
      color: generateRandomColor(),
      enabled: true,
      weight: 1,
      image: null,
      imageMode: "center",
    }

    setOptions([...options, newOption])
  }

  // Update an option
  const updateOption = (id: string, updates: Partial<WheelOption>) => {
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
      color: generateRandomColor(),
      enabled: true,
      weight: 1,
      image: null,
      imageMode: "center" as const,
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
    setSortMode("custom")
  }

  // Save current wheel
  const saveWheel = () => {
    const wheelData: WheelData = {
      name: wheelName,
      options,
      lastModified: new Date().toISOString(),
    }

    const saveResult = saveToLocalStorage(wheelData)
    if (saveResult) {
      toast({
        title: "Saved",
        description: `Wheel saved as "${saveResult}"`,
      })
    }
  }

  // Load a wheel
  const loadWheel = (wheelData: WheelData) => {
    setWheelName(wheelData.name)
    setOptions(wheelData.options)
  }

  // Effect to sort options when sort mode changes
  useEffect(() => {
    if (sortMode !== "custom") {
      sortOptions()
    }
  }, [sortMode, sortDirection])

  const handleNewWheel = () => {
    toast({
      title: "New Wheel",
      description: "Create a new wheel? Unsaved changes will be lost.",
      action: (
        <Button
          onClick={() => {
            setWheelName("My Wheel")
            setOptions([
              {
                id: "1",
                text: "Option 1",
                color: "#FF5733",
                enabled: true,
                weight: 1,
                image: null,
                imageMode: "center",
              },
              {
                id: "2",
                text: "Option 2",
                color: "#33FF57",
                enabled: true,
                weight: 1,
                image: null,
                imageMode: "center",
              },
              {
                id: "3",
                text: "Option 3",
                color: "#3357FF",
                enabled: true,
                weight: 1,
                image: null,
                imageMode: "center",
              },
              {
                id: "4",
                text: "Option 4",
                color: "#F3FF33",
                enabled: true,
                weight: 1,
                image: null,
                imageMode: "center",
              },
            ])
          }}
          variant="outline"
          size="sm"
        >
          Confirm
        </Button>
      ),
    })
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col h-screen overflow-hidden">
      <MenuBar
        wheelName={wheelName}
        setWheelName={setWheelName}
        saveWheel={saveWheel}
        loadWheel={loadWheel}
        getAllSavedWheels={getAllSavedWheels}
        handleNewWheel={handleNewWheel}
      />

      <div className="flex flex-col md:flex-row gap-4 h-full">
        <div
          className={`${
            isPanelOpen ? "w-full md:w-96 lg:w-1/3" : "w-0 overflow-hidden"
          } transition-all duration-300 border-r`}
        >
          <div className="p-4 h-full">
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

        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 md:flex hidden"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
        >
          {isPanelOpen ? <ChevronLeft /> : <ChevronRight />}
        </Button>

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <Wheel
            options={options.filter((opt) => opt.enabled)}
            isSpinning={isSpinning}
            selectedOption={selectedOption}
            onSpin={spinWheel}
            targetRotation={targetRotation}
            currentRotation={currentRotation}
            onRotationChange={setCurrentRotation}
            onAnimationComplete={handleAnimationComplete}
          />

          {selectedOption && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background/90 backdrop-blur-sm p-6 rounded-lg shadow-lg border z-20 text-center">
              <h2 className="text-2xl font-bold">Selected:</h2>
              <p className="text-3xl mt-2" style={{ color: selectedOption.color }}>
                {selectedOption.text}
              </p>
              <Button variant="outline" className="mt-4" onClick={() => setSelectedOption(null)}>
                Close
              </Button>
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
        </div>
      </div>
    </div>
  )
}

// Custom hook for wheel storage
function useWheelStorage() {
  const { toast } = useToast()

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
      toast({
        title: "Error",
        description: "Failed to save wheel to local storage.",
      })
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
      toast({
        title: "Error",
        description: "Failed to load wheel from local storage.",
      })
      return null
    }
  }

  const getAllSavedWheels = (): { name: string; data: WheelData }[] => {
    try {
      const savedWheels = localStorage.getItem("savedWheels")
      if (!savedWheels) return []

      const wheels: Record<string, WheelData> = JSON.parse(savedWheels)
      return Object.entries(wheels).map(([name, data]) => ({ name, data }))
    } catch (error) {
      console.error("Error getting saved wheels:", error)
      toast({
        title: "Error",
        description: "Failed to retrieve saved wheels from local storage.",
      })
      return []
    }
  }

  return { saveToLocalStorage, loadFromLocalStorage, getAllSavedWheels }
}
