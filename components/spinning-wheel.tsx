"use client";

import React, { useEffect, useState, useRef } from "react";
// @ts-ignore
import ReactConfetti from "react-confetti";
import { Wheel } from "@/components/wheel";
import { SimpleEditor } from "@/components/simple-editor";
import { AdvancedEditor } from "@/components/advanced-editor";
import { MenuBar } from "@/components/menu-bar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { WheelOption, WheelData } from "@/lib/types";
import {
  generateRandomColor,
  generateDistinctColors,
  type ColorPalette,
} from "@/lib/utils";
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
} from "@/components/ui/alert-dialog";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getPredefinedWheelsCatalog,
  loadPredefinedWheel,
  getWheelById,
  type WheelCatalogItem,
} from "@/lib/predefined-wheels";

export function SpinningWheel() {
  const [wheelName, setWheelName] = useState<string>("My Wheel");
  const [options, setOptions] = useState<WheelOption[]>([]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<WheelOption | null>(
    null
  );
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);
  const [sortMode, setSortMode] = useState<"name" | "weight" | "custom">(
    "custom"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [textSettings, setTextSettings] = useState<{
    textRadiusPercent: number;
    fontSizePercent: number;
  }>({
    textRadiusPercent: 0.7, // Default position from center (70% of radius)
    fontSizePercent: 0.07, // Default font size (7% of radius)
  });
  const [colorPalette, setColorPalette] = useState<ColorPalette>(() => {
    // Load color palette from localStorage on initial load
    if (typeof window !== "undefined") {
      const savedPalette = localStorage.getItem("wheelColorPalette");
      return savedPalette ? (savedPalette as ColorPalette) : "default";
    }
    return "default";
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const {
    saveToLocalStorage,
    loadFromLocalStorage,
    getAllSavedWheels,
    deleteWheel,
    renameWheel,
    errorDialogOpen,
    setErrorDialogOpen,
    errorMessage,
  } = useWheelStorage();
  const [targetRotation, setTargetRotation] = useState<number | null>(null);
  const [currentRotation, setCurrentRotation] = useState<number>(0);
  const pendingSelectedOptionRef = useRef<WheelOption | null>(null);
  const getOptionAtPointerRef = useRef<() => WheelOption | null>(() => null);
  const [isNewWheelDialogOpen, setIsNewWheelDialogOpen] = useState(false);
  const [saveSuccessDialogOpen, setSaveSuccessDialogOpen] = useState(false);
  const [savedWheelName, setSavedWheelName] = useState("");
  const [noOptionsDialogOpen, setNoOptionsDialogOpen] = useState(false);
  const [isWheelLoaded, setIsWheelLoaded] = useState(false);
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);
  const [originalWheelName, setOriginalWheelName] = useState("");
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  // Helper function to create URL-friendly slugs
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  };

  // Function to initialize the default wheel
  const initializeDefaultWheel = () => {
    // Use a specific palette rather than relying on the state variable
    // This ensures we don't have any race conditions with palette loading
    const currentPalette =
      (localStorage.getItem("wheelColorPalette") as ColorPalette) || "default";

    // Generate distinct colors for the initial options with explicit palette
    const distinctColors = generateDistinctColors(4, currentPalette);

    // Log for debugging
    console.log("Initializing default wheel with palette:", currentPalette);
    console.log("Generated colors:", distinctColors);

    setWheelName("My Wheel");
    setOptions([
      {
        id: "1",
        text: "Option 1",
        color: distinctColors[0] || "#FF5733", // Fallback color if generation fails
        enabled: true,
        weight: 1,
        image: null,
        imageMode: "center",
        hideTextWithImage: false,
        colorSetByUser: false, // Mark as user-set to prevent regeneration
      },
      {
        id: "2",
        text: "Option 2",
        color: distinctColors[1] || "#33FF57", // Fallback color if generation fails
        enabled: true,
        weight: 1,
        image: null,
        imageMode: "center",
        hideTextWithImage: false,
        colorSetByUser: false,
      },
      {
        id: "3",
        text: "Option 3",
        color: distinctColors[2] || "#3357FF", // Fallback color if generation fails
        enabled: true,
        weight: 1,
        image: null,
        imageMode: "center",
        hideTextWithImage: false,
        colorSetByUser: false,
      },
      {
        id: "4",
        text: "Option 4",
        color: distinctColors[3] || "#F3FF33", // Fallback color if generation fails
        enabled: true,
        weight: 1,
        image: null,
        imageMode: "center",
        hideTextWithImage: false,
        colorSetByUser: false,
      },
    ]);
    setIsWheelLoaded(false);
    setOriginalWheelName("");
  };

  // Centralized wheel initialization
  useEffect(() => {
    if (initialized.current) return;

    // Show loading indicator
    setIsLoading(true);

    async function initializeWheel() {
      const wheelParam = searchParams.get("wheel");

      if (wheelParam) {
        // Try to load from localStorage first
        const savedWheels = getAllSavedWheels();
        const savedWheel = savedWheels.find(
          (wheel) => slugify(wheel.name) === wheelParam
        );

        if (savedWheel) {
          console.log("Loading wheel from localStorage:", savedWheel.data);
          loadWheel(savedWheel.data);
          initialized.current = true;
          setIsLoading(false);
          return;
        }

        // Then try predefined wheels
        try {
          const catalog = await getPredefinedWheelsCatalog();
          const predefinedWheel = catalog.find(
            (wheel) =>
              wheel.id === wheelParam || slugify(wheel.name) === wheelParam
          );

          if (predefinedWheel) {
            const wheelData = await loadPredefinedWheel(
              predefinedWheel.filename
            );
            if (wheelData) {
              console.log("Loaded predefined wheel:", wheelData);
              loadWheel({ ...wheelData, slug: predefinedWheel.id });
              initialized.current = true;
              setIsLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error("Error loading predefined wheel:", err);
        }

        // Wheel not found - clear URL parameter
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }

      // No wheel parameter or couldn't load wheel, initialize with defaults
      initializeDefaultWheel();
      initialized.current = true;
      setIsLoading(false);
    }

    initializeWheel();
  }, [searchParams, router]);

  // Handle spinning the wheel
  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setSelectedOption(null);

    // Calculate total weight for probability
    const enabledOptions = options.filter((opt) => opt.enabled);
    if (enabledOptions.length === 0) {
      setIsSpinning(false);
      setNoOptionsDialogOpen(true);
      return;
    }

    const totalWeight = enabledOptions.reduce(
      (sum, opt) => sum + opt.weight,
      0
    );
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;

    // Select based on weight
    for (let i = 0; i < enabledOptions.length; i++) {
      random -= enabledOptions[i].weight;
      if (random <= 0) {
        selectedIndex = i;
        break;
      }
    }

    // Store the selected option for later
    const selectedOption = enabledOptions[selectedIndex];
    pendingSelectedOptionRef.current = selectedOption;

    // Calculate the position for the selected option
    // We need to determine where in the wheel this option is located
    let currentAngle = 0;

    // Calculate the angle for each option based on its weight
    for (let i = 0; i < enabledOptions.length; i++) {
      const option = enabledOptions[i];
      const sliceAngle = (360 * option.weight) / totalWeight;

      if (option.id === selectedOption.id) {
        // This is our selected option
        // Calculate the middle angle of this slice
        const middleAngle = currentAngle + sliceAngle / 2;

        // Calculate how much to rotate so this slice is at the right (0 degrees)
        // The pointer is at the right (0 degrees in standard polar coordinates)
        // We need to rotate the wheel so that the middle of the selected slice
        // aligns with the pointer at 0 degrees
        const rotationNeeded = -middleAngle;

        // Add multiple full rotations for effect (between 5 and 8 full rotations)
        const fullRotations = (5 + Math.floor(Math.random() * 4)) * 360;

        // Add a small random offset (between -5 and 5 degrees) to prevent landing exactly between options
        const randomOffset = (Math.random() - 0.5) * 10;

        // Ensure we're adding to the current rotation to maintain momentum
        const finalRotation =
          currentRotation + fullRotations + rotationNeeded + randomOffset;

        // Set the target rotation
        setTargetRotation(finalRotation);
        break;
      }

      currentAngle += sliceAngle;
    }
  };

  // Handle animation completion
  const handleAnimationComplete = () => {
    setIsSpinning(false);

    // Use the getOptionAtPointer function to determine the actual option at the pointer
    // This ensures the visual selection is in sync with the wheel's final position
    const actualSelectedOption = getOptionAtPointerRef.current
      ? getOptionAtPointerRef.current()
      : pendingSelectedOptionRef.current;

    setSelectedOption(actualSelectedOption);
    pendingSelectedOptionRef.current = null;

    // Show confetti when selection is complete
    setShowConfetti(true);
    // Hide confetti after 5 seconds
    setTimeout(() => setShowConfetti(false), 5000);

    // Update current rotation to match target rotation after spin completes
    if (targetRotation !== null) {
      // Keep only the remainder after full rotations for better performance
      setCurrentRotation(targetRotation % 360);
    }
  };

  // Register the getOptionAtPointer function from Wheel component
  const registerGetOptionAtPointer = (
    getOptionAtPointerFn: () => WheelOption | null
  ) => {
    getOptionAtPointerRef.current = getOptionAtPointerFn;
  };

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
      hideTextWithImage: false,
      colorSetByUser: false,
    };

    setOptions([...options, newOption]);
  };

  // Update an option
  const updateOption = (id: string, updates: Partial<WheelOption>) => {
    // If the user is updating the color, mark it as manually set
    if (updates.color) {
      updates.colorSetByUser = true;
    }

    setOptions(
      options.map((opt) => (opt.id === id ? { ...opt, ...updates } : opt))
    );
  };

  // Delete an option
  const deleteOption = (id: string) => {
    setOptions(options.filter((opt) => opt.id !== id));
  };

  // Handle bulk option creation from text
  const handleBulkCreate = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim() !== "");

    if (lines.length === 0) return;

    const newOptions = lines.map((line) => ({
      id: Date.now() + Math.random().toString(),
      text: line.trim(),
      color: generateRandomColor(colorPalette),
      enabled: true,
      weight: 1,
      image: null,
      imageMode: "center" as const,
      hideTextWithImage: false,
      colorSetByUser: false,
    }));

    setOptions([...options, ...newOptions]);
  };

  // Sort options
  const sortOptions = () => {
    const sortedOptions = [...options];

    if (sortMode === "name") {
      sortedOptions.sort((a, b) => {
        return sortDirection === "asc"
          ? a.text.localeCompare(b.text)
          : b.text.localeCompare(a.text);
      });
    } else if (sortMode === "weight") {
      sortedOptions.sort((a, b) => {
        return sortDirection === "asc"
          ? a.weight - b.weight
          : b.weight - a.weight;
      });
    }

    setOptions(sortedOptions);
  };

  // Shuffle options
  const shuffleOptions = () => {
    const shuffled = [...options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setOptions(shuffled);
    setSortMode("custom");
  };

  // Reorder options (for drag and drop)
  const reorderOptions = (startIndex: number, endIndex: number) => {
    const result = Array.from(options);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    setOptions(result);
    // Only set to custom if the user actually moved an item
    if (startIndex !== endIndex) {
      setSortMode("custom");
    }
  };

  // Save current wheel
  const saveWheel = () => {
    const wheelData: WheelData = {
      name: wheelName,
      options,
      lastModified: new Date().toISOString(),
      colorPalette,
      textSettings,
    };

    // Check if we're saving a loaded wheel with the same name
    if (isWheelLoaded && wheelName === originalWheelName) {
      // Direct overwrite without confirmation
      const saveResult = saveToLocalStorage(wheelData, true);
      if (saveResult) {
        setSavedWheelName(saveResult);
        setSaveSuccessDialogOpen(true);
        // Since we're overwriting, update the wheel's loaded state data
        setOriginalWheelName(saveResult);

        // Update URL with wheel slug
        const wheelSlug = slugify(saveResult);
        const url = new URL(window.location.href);
        url.searchParams.set("wheel", wheelSlug);
        router.push(url.pathname + url.search);
      }
    } else {
      // Check if a wheel with this name already exists
      const existingWheels = getAllSavedWheels();
      const existingWheel = existingWheels.find(
        (wheel) => wheel.name === wheelName
      );

      if (existingWheel) {
        // Show confirmation dialog for overwrite
        setOverwriteDialogOpen(true);
      } else {
        // No conflict, save normally
        const saveResult = saveToLocalStorage(wheelData);
        if (saveResult) {
          setSavedWheelName(saveResult);
          setSaveSuccessDialogOpen(true);
          // Update the loaded state for the current wheel
          setIsWheelLoaded(true);
          setOriginalWheelName(saveResult);

          // Update URL with wheel slug
          const wheelSlug = slugify(saveResult);
          const url = new URL(window.location.href);
          url.searchParams.set("wheel", wheelSlug);
          router.push(url.pathname + url.search);
        }
      }
    }
  };

  // Handle confirming overwrite
  const confirmOverwrite = () => {
    const wheelData: WheelData = {
      name: wheelName,
      options,
      lastModified: new Date().toISOString(),
      colorPalette,
      textSettings,
    };

    const saveResult = saveToLocalStorage(wheelData, true);
    if (saveResult) {
      setSavedWheelName(saveResult);
      setSaveSuccessDialogOpen(true);
      // Update the loaded state for the current wheel
      setIsWheelLoaded(true);
      setOriginalWheelName(saveResult);

      // Update URL with wheel slug
      const wheelSlug = slugify(saveResult);
      const url = new URL(window.location.href);
      url.searchParams.set("wheel", wheelSlug);
      router.push(url.pathname + url.search);
    }

    setOverwriteDialogOpen(false);
  };

  // Load a wheel
  const loadWheel = (wheelData: WheelData) => {
    setWheelName(wheelData.name);

    if (wheelData.colorPalette) {
      setColorPalette(wheelData.colorPalette);
    }
    if (wheelData.textSettings) {
      setTextSettings(wheelData.textSettings);
    }
    // set colorSetByUser to the options
    const optionsWithColorSetByUser = wheelData.options.map((option) => ({
      ...option,
      colorSetByUser: true,
    }));
    setOptions(optionsWithColorSetByUser);
    setIsWheelLoaded(true);
    setOriginalWheelName(wheelData.name);

    const wheelSlug = wheelData.slug || slugify(wheelData.name);
    const url = new URL(window.location.href);
    url.searchParams.set("wheel", wheelSlug);
    router.push(url.pathname + url.search);
  };

  // Effect to sort options when sort mode changes
  useEffect(() => {
    if (sortMode !== "custom") {
      sortOptions();
    }
  }, [sortMode, sortDirection]);

  // Regenerate colors for options without user-set colors
  const regenerateColors = () => {
    // Use the function form of setOptions to work with the current state
    setOptions((currentOptions) => {
      // Check if any colors have been manually set
      const hasUserSetColors = currentOptions.some(
        (option) => option.colorSetByUser
      );

      if (!hasUserSetColors) {
        // If no colors have been manually set, use generateDistinctColors for all options
        const distinctColors = generateDistinctColors(
          currentOptions.length,
          colorPalette
        );

        return currentOptions.map((option, index) => ({
          ...option,
          color: distinctColors[index],
        }));
      } else {
        // If some colors have been manually set, only regenerate the ones that weren't
        return currentOptions.map((option) => {
          if (!option.colorSetByUser) {
            return {
              ...option,
              color: generateRandomColor(colorPalette),
            };
          }
          return option;
        });
      }
    });
  };

  // Update colorPalette in localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("wheelColorPalette", colorPalette);

      // Regenerate colors when palette changes
      regenerateColors();
    }
  }, [colorPalette]);

  // Add effect to recalculate colors when options change
  useEffect(() => {
    // Skip if not initialized yet
    if (!initialized.current) return;

    // Use the function form of setOptions to work with current state
    setOptions((currentOptions) => {
      // Check if any colors have been manually set
      const hasUserSetColors = currentOptions.some(
        (option) => option.colorSetByUser
      );

      // Only recalculate colors if none have been manually set
      if (!hasUserSetColors) {
        const distinctColors = generateDistinctColors(
          currentOptions.length,
          colorPalette
        );

        return currentOptions.map((option, index) => ({
          ...option,
          color: distinctColors[index],
        }));
      }

      // If colors are user-set, return unchanged options
      return currentOptions;
    });
  }, [options.length, colorPalette]);

  // Reset all wheel data to create a new wheel
  const handleNewWheel = () => {
    setIsNewWheelDialogOpen(true);
  };

  const confirmNewWheel = () => {
    initializeDefaultWheel();
    setIsNewWheelDialogOpen(false);

    // Clear the wheel parameter from URL
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      {showConfetti && (
        <ReactConfetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
          initialVelocityY={20}
          initialVelocityX={8}
        />
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <img src="/loading.svg" alt="Loading" className="w-24 h-24" />
          <p className="mt-4 text-lg">Initializing wheel...</p>
        </div>
      ) : (
        <>
          <header className="border-b">
            <MenuBar
              wheelName={wheelName}
              setWheelName={setWheelName}
              saveWheel={saveWheel}
              loadWheel={loadWheel}
              getAllSavedWheels={getAllSavedWheels}
              deleteWheel={deleteWheel}
              renameWheel={(oldName, newName) => {
                const success = renameWheel(oldName, newName);
                // Update the original wheel name if we're currently viewing the renamed wheel
                if (success && isWheelLoaded && originalWheelName === oldName) {
                  setOriginalWheelName(newName);

                  // Update URL with new wheel slug
                  const wheelSlug = slugify(newName);
                  const url = new URL(window.location.href);
                  url.searchParams.set("wheel", wheelSlug);
                  router.push(url.pathname + url.search);
                }
                return success;
              }}
              handleNewWheel={handleNewWheel}
              colorPalette={colorPalette}
              setColorPalette={setColorPalette}
              regenerateColors={regenerateColors}
              isWheelLoaded={isWheelLoaded}
              originalWheelName={originalWheelName}
              options={options}
              textSettings={textSettings}
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
                textSettings={textSettings}
              />

              {selectedOption && (
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 backdrop-blur-sm p-6 rounded-lg shadow-lg z-20 text-center"
                  style={{ border: `3px solid ${selectedOption.color}` }}
                >
                  <h2 className="text-2xl font-bold text-white">Selected:</h2>
                  {selectedOption.image && (
                    <div className="my-3 flex justify-center">
                      <img
                        src={selectedOption.image}
                        alt={selectedOption.text}
                        className="max-h-[120px] max-w-full rounded"
                      />
                    </div>
                  )}
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
                        setOptions(
                          options.map((opt) =>
                            opt.id === selectedOption.id
                              ? { ...opt, enabled: false }
                              : opt
                          )
                        );
                        setSelectedOption(null);
                        setTargetRotation(null);
                        setTimeout(() => spinWheel(), 100);
                      }}
                      disabled={
                        options.filter((opt) => opt.enabled).length <= 2
                      }
                    >
                      {options.filter((opt) => opt.enabled).length <= 2
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
                disabled={
                  isSpinning || options.filter((opt) => opt.enabled).length <= 2
                }
              >
                {isSpinning ? "Spinning..." : "Spin the Wheel"}
              </Button>
            </main>

            <div className="flex">
              <div className="hidden md:flex h-full items-center justify-center">
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
                  isPanelOpen
                    ? "w-[450px] max-sm:max-w-[450px] max-sm:w-auto"
                    : "w-0"
                } transition-all duration-300 border-l overflow-hidden max-md:fixed max-md:right-0 max-md:top-0 max-md:bottom-0 max-md:h-full max-md:bg-background max-md:z-40 max-md:shadow-lg`}
              >
                <div className="p-4 h-full overflow-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Options</h2>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                      >
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
                      textSettings={textSettings}
                      setTextSettings={setTextSettings}
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

          {/* Mobile options toggle button */}
          <Button
            variant="outline"
            size="sm"
            className="md:hidden fixed bottom-4 right-4 z-50 shadow-md"
            onClick={() => setIsPanelOpen(!isPanelOpen)}
          >
            {isPanelOpen ? "Hide Options" : "Show Options"}
          </Button>

          <AlertDialog
            open={isNewWheelDialogOpen}
            onOpenChange={setIsNewWheelDialogOpen}
          >
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

          <AlertDialog
            open={saveSuccessDialogOpen}
            onOpenChange={setSaveSuccessDialogOpen}
          >
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

          <AlertDialog
            open={noOptionsDialogOpen}
            onOpenChange={setNoOptionsDialogOpen}
          >
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
                <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction>OK</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog
            open={overwriteDialogOpen}
            onOpenChange={setOverwriteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Overwrite</AlertDialogTitle>
                <AlertDialogDescription>
                  A wheel named "{wheelName}" already exists. Do you want to
                  overwrite it?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmOverwrite}>
                  Overwrite
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}

// Custom hook for wheel storage
function useWheelStorage() {
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const showError = (message: string) => {
    setErrorMessage(message);
    setErrorDialogOpen(true);
  };

  const saveToLocalStorage = (
    wheelData: WheelData,
    overwrite: boolean = false
  ) => {
    try {
      const savedWheels = localStorage.getItem("savedWheels");
      const wheels: Record<string, WheelData> = savedWheels
        ? JSON.parse(savedWheels)
        : {};

      // Use name as key
      let key = wheelData.name;

      if (overwrite) {
        // Direct overwrite
        wheels[key] = wheelData;
        localStorage.setItem("savedWheels", JSON.stringify(wheels));
        return key;
      } else {
        // Check for duplicates and generate unique name if needed
        let counter = 1;
        let originalKey = key;
        while (wheels[key] && counter < 100) {
          key = `${originalKey} (${counter})`;
          counter++;
        }

        wheels[key] = wheelData;
        localStorage.setItem("savedWheels", JSON.stringify(wheels));
        return key;
      }
    } catch (error) {
      console.error("Error saving wheel:", error);
      showError("Failed to save wheel to local storage.");
      return null;
    }
  };

  const loadFromLocalStorage = (name: string): WheelData | null => {
    try {
      const savedWheels = localStorage.getItem("savedWheels");
      if (!savedWheels) return null;

      const wheels: Record<string, WheelData> = JSON.parse(savedWheels);
      return wheels[name] || null;
    } catch (error) {
      console.error("Error loading wheel:", error);
      showError("Failed to load wheel from local storage.");
      return null;
    }
  };

  const getAllSavedWheels = (): { name: string; data: WheelData }[] => {
    try {
      if (typeof window === "undefined") return [];
      const savedWheels = localStorage.getItem("savedWheels");
      if (!savedWheels) return [];

      const wheels: Record<string, WheelData> = JSON.parse(savedWheels);
      return Object.entries(wheels).map(([name, data]) => ({ name, data }));
    } catch (error) {
      console.error("Error getting saved wheels:", error);
      showError("Failed to retrieve saved wheels from local storage.");
      return [];
    }
  };

  const deleteWheel = (name: string): boolean => {
    try {
      const savedWheels = localStorage.getItem("savedWheels");
      if (!savedWheels) return false;

      const wheels: Record<string, WheelData> = JSON.parse(savedWheels);

      if (!wheels[name]) return false;

      delete wheels[name];
      localStorage.setItem("savedWheels", JSON.stringify(wheels));
      return true;
    } catch (error) {
      console.error("Error deleting wheel:", error);
      showError("Failed to delete wheel from local storage.");
      return false;
    }
  };

  const renameWheel = (oldName: string, newName: string): boolean => {
    try {
      const savedWheels = localStorage.getItem("savedWheels");
      if (!savedWheels) return false;

      const wheels: Record<string, WheelData> = JSON.parse(savedWheels);

      if (!wheels[oldName]) return false;

      // If a wheel with the new name already exists, don't overwrite it
      if (wheels[newName]) {
        showError(
          `A wheel named "${newName}" already exists. Please choose a different name.`
        );
        return false;
      }

      // Store the wheel with the new name
      const wheelData = wheels[oldName];
      wheelData.name = newName; // Update the name inside the data as well

      wheels[newName] = wheelData;
      delete wheels[oldName];

      localStorage.setItem("savedWheels", JSON.stringify(wheels));

      return true;
    } catch (error) {
      console.error("Error renaming wheel:", error);
      showError("Failed to rename wheel in local storage.");
      return false;
    }
  };

  return {
    saveToLocalStorage,
    loadFromLocalStorage,
    getAllSavedWheels,
    deleteWheel,
    renameWheel,
    errorDialogOpen,
    setErrorDialogOpen,
    errorMessage,
  };
}
