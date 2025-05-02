"use client";

import { useEffect, useRef, useState } from "react";
import type { WheelOption } from "@/lib/types";
import { useSound } from "@/contexts/SoundContext";

interface WheelProps {
  options: WheelOption[];
  isSpinning: boolean;
  selectedOption: WheelOption | null;
  onSpin: () => void;
  targetRotation: number | null;
  currentRotation: number;
  onRotationChange: (rotation: number) => void;
  onAnimationComplete: () => void;
  registerGetOptionAtPointer?: (
    getOptionAtPointerFn: () => WheelOption | null
  ) => void;
  textSettings?: {
    textRadiusPercent: number; // Position of text from center
    fontSizePercent: number; // Font size as percentage of radius
  };
}

export function Wheel({
  options,
  isSpinning,
  selectedOption,
  onSpin,
  targetRotation,
  currentRotation,
  onRotationChange,
  onAnimationComplete,
  registerGetOptionAtPointer,
  textSettings = { textRadiusPercent: 0.7, fontSizePercent: 0.07 }, // Default values
}: WheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 });
  const animationRef = useRef<number | undefined>(undefined);
  const pointerAngle = 0; // Pointer is at the right (0 degrees)
  const lastFrameTimeRef = useRef<number>(0);
  const spinSpeedRef = useRef<number>(0);
  const animationCompleteRef = useRef<boolean>(false);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const { playTick } = useSound();

  // Store callback refs to avoid dependency issues
  const onRotationChangeRef = useRef(onRotationChange);
  const onAnimationCompleteRef = useRef(onAnimationComplete);
  const optionsRef = useRef(options);
  const currentRotationRef = useRef(currentRotation);

  // Track the currently pointed option to detect transitions
  const lastOptionIdRef = useRef<string | null>(null);

  // Refs for animation timing
  const lastStateUpdateTimeRef = useRef(0);
  const STATE_UPDATE_INTERVAL = 50; // Only update state every 50ms

  // Update refs when props change
  useEffect(() => {
    onRotationChangeRef.current = onRotationChange;
    onAnimationCompleteRef.current = onAnimationComplete;
    optionsRef.current = options;
    currentRotationRef.current = currentRotation;
  }, [onRotationChange, onAnimationComplete, options, currentRotation]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const size = Math.min(
        window.innerWidth - 40,
        window.innerHeight - 200,
        600
      );
      setCanvasSize({ width: size, height: size });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Preload and cache images
  useEffect(() => {
    // Preload all images when options change
    options.forEach((option) => {
      if (option.image && !imageCache.current.has(option.image)) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = option.image;

        img.onload = () => {
          imageCache.current.set(option.image!, img);
          // Force redraw when image loads
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) drawWheel(ctx);
          }
        };
      }
    });
  }, [options]);

  // Reset animation complete flag when spinning starts
  useEffect(() => {
    if (isSpinning) {
      animationCompleteRef.current = false;
      // Reset the last option ID to ensure we detect the first transition
      lastOptionIdRef.current = null;
    }
  }, [isSpinning]);

  // Handle spinning animation
  useEffect(() => {
    if (isSpinning && targetRotation !== null) {
      // Start animation
      const startTime = performance.now();
      const duration = 3000; // 3 seconds
      const startRotation = currentRotationRef.current;
      const rotationDiff = targetRotation - startRotation;

      // Set initial spin speed (degrees per second)
      spinSpeedRef.current = (rotationDiff / 3) * 0.5;

      const animate = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const deltaTime = time - (lastFrameTimeRef.current || time);
        lastFrameTimeRef.current = time;

        // Easing function for natural slowdown
        const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
        const newRotation = startRotation + rotationDiff * easeOut(progress);

        // Store the new rotation value in our ref
        currentRotationRef.current = newRotation;

        // Only update state periodically to avoid too many renders
        const shouldUpdateState =
          time - lastStateUpdateTimeRef.current >= STATE_UPDATE_INTERVAL ||
          progress === 1;

        if (shouldUpdateState) {
          onRotationChangeRef.current(newRotation);
          lastStateUpdateTimeRef.current = time;
        }

        // Calculate instantaneous speed for visual feedback
        if (deltaTime > 0) {
          const instantSpeed =
            ((newRotation - currentRotationRef.current) / deltaTime) * 1000;
          spinSpeedRef.current = instantSpeed;
        }

        // Check if the pointer is over a new option using our ref value
        const currentOption = getOptionAtPointer();

        // Play tick sound when transitioning between slices
        if (
          currentOption &&
          (lastOptionIdRef.current === null ||
            lastOptionIdRef.current !== currentOption.id)
        ) {
          // Play sound for each transition
          playTick();

          // Update the reference to the current option
          lastOptionIdRef.current = currentOption.id;
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Final update - ensure we end exactly at target
          onRotationChangeRef.current(targetRotation);
          spinSpeedRef.current = 0;

          // Reset animation state
          lastStateUpdateTimeRef.current = 0;
          currentRotationRef.current = targetRotation;

          // Signal animation completion
          if (!animationCompleteRef.current) {
            animationCompleteRef.current = true;
            onAnimationCompleteRef.current();
          }
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      // Reset animation state on cleanup
      animationCompleteRef.current = false;
      spinSpeedRef.current = 0;
    };
  }, [isSpinning, targetRotation, playTick]); // Minimal dependency array

  // Calculate which option is at the pointer position
  const getOptionAtPointer = () => {
    if (optionsRef.current.length === 0) return null;

    // Filter to only enabled options
    const enabledOptions = optionsRef.current.filter((opt) => opt.enabled);
    if (enabledOptions.length === 0) return null;

    // Calculate total weight
    const totalWeight = enabledOptions.reduce(
      (sum, opt) => sum + opt.weight,
      0
    );

    // Convert current rotation to a value between 0-360
    const normalizedRotation = ((currentRotationRef.current % 360) + 360) % 360;

    // The pointer is at 0 degrees, so we need to find which slice is there
    // We need to adjust by the current rotation to find the correct slice
    const pointerPosition = (360 - normalizedRotation) % 360;

    // Find which slice contains this position
    let currentAngle = 0;
    for (const option of enabledOptions) {
      const sliceAngle = (360 * option.weight) / totalWeight;
      if (
        pointerPosition >= currentAngle &&
        pointerPosition < currentAngle + sliceAngle
      ) {
        return option;
      }
      currentAngle += sliceAngle;
    }

    // Fallback to first option if something went wrong
    return enabledOptions[0];
  };

  // Register the getOptionAtPointer function if the prop is provided
  useEffect(() => {
    if (registerGetOptionAtPointer) {
      registerGetOptionAtPointer(getOptionAtPointer);
    }
  }, [registerGetOptionAtPointer]); // Only depend on the registration function

  // Draw the wheel - extracted to a function for reuse
  const drawWheel = (ctx: CanvasRenderingContext2D) => {
    if (!canvasRef.current || options.length === 0) return;

    const canvas = canvasRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Calculate total weight
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);

    // Draw wheel segments
    const startAngle = (currentRotation * Math.PI) / 180;
    let currentAngle = startAngle;

    // Disable shadow effects when spinning for better performance
    if (isSpinning) {
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const sliceAngle = (2 * Math.PI * option.weight) / totalWeight;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(
        centerX,
        centerY,
        radius,
        currentAngle,
        currentAngle + sliceAngle
      );
      ctx.closePath();

      // Highlight the selected option
      const fillColor = option.color;
      if (selectedOption && option.id === selectedOption.id) {
        // Create a slightly brighter version of the color for highlighting
        ctx.fillStyle = fillColor;
        ctx.fill();

        // Add a subtle glow effect
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.shadowColor = "white";
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = fillColor;
        ctx.fill();
      }

      // Fill with color or image
      if (option.image) {
        // Use cached image if available
        const cachedImg = imageCache.current.get(option.image);

        if (cachedImg && cachedImg.complete) {
          // Create pattern or draw image based on mode
          if (option.imageMode === "fill") {
            // Save the current state
            ctx.save();

            // Create a clipping path for this segment
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(
              centerX,
              centerY,
              radius,
              currentAngle,
              currentAngle + sliceAngle
            );
            ctx.closePath();
            ctx.clip();

            // Calculate the middle angle of this segment
            const middleAngle = currentAngle + sliceAngle / 2;

            // Get the position where text would be rendered (for alignment)
            const textX =
              centerX +
              Math.cos(middleAngle) * (radius * textSettings.textRadiusPercent);
            const textY =
              centerY +
              Math.sin(middleAngle) * (radius * textSettings.textRadiusPercent);

            // Apply transformation at the text position
            ctx.translate(textX, textY);
            ctx.rotate(middleAngle + Math.PI / 2);

            // Use a more appropriate size for the image
            const imgSize = radius * 1.5;

            // Draw the image centered on the text position
            ctx.drawImage(
              cachedImg,
              -imgSize / 2,
              -imgSize / 2,
              imgSize,
              imgSize
            );

            // Restore the context
            ctx.restore();

            // Add a semi-transparent overlay to improve text readability
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(
              centerX,
              centerY,
              radius,
              currentAngle,
              currentAngle + sliceAngle
            );
            ctx.closePath();
            ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
            ctx.fill();
            ctx.restore();

            // Redraw the segment border
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(
              centerX,
              centerY,
              radius,
              currentAngle,
              currentAngle + sliceAngle
            );
            ctx.closePath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#ffffff";
            ctx.stroke();
          } else {
            // Center mode - draw image in center of segment
            ctx.fillStyle = option.color;
            ctx.fill();

            // Calculate position for centered image
            const imgSize = radius * 0.4;
            const distanceFromCenter = radius * textSettings.textRadiusPercent;
            // Position image at same radius as text for better alignment
            const imgX =
              centerX +
              Math.cos(currentAngle + sliceAngle / 2) * distanceFromCenter -
              imgSize / 2;
            const imgY =
              centerY +
              Math.sin(currentAngle + sliceAngle / 2) * distanceFromCenter -
              imgSize / 2;

            // Create a clipping path for this segment to prevent overlap
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(
              centerX,
              centerY,
              radius,
              currentAngle,
              currentAngle + sliceAngle
            );
            ctx.closePath();
            ctx.clip();

            // Draw the image within the clipped area
            ctx.translate(imgX + imgSize / 2, imgY + imgSize / 2);
            // Adjust rotation to keep image upright relative to text
            ctx.rotate(currentAngle + sliceAngle / 2 + Math.PI / 2);
            ctx.drawImage(
              cachedImg,
              -imgSize / 2,
              -imgSize / 2,
              imgSize,
              imgSize
            );
            ctx.restore();
          }
        } else {
          // If image isn't loaded yet, just fill with color
          ctx.fillStyle = option.color;
          ctx.fill();
        }
      } else {
        ctx.fillStyle = option.color;
        ctx.fill();
      }

      // Draw segment border
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(currentAngle + sliceAngle / 2);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";

      // Calculate optimal font size based on available space
      const text = option.text;
      const textRadius = radius * textSettings.textRadiusPercent;

      // Start with the base font size from settings
      let fontSize = radius * textSettings.fontSizePercent;

      // Calculate the arc length available for text
      const arcLength = sliceAngle * textRadius;

      // Adaptive font sizing - reduce size for long text or small slices
      if (text.length > 0) {
        // Estimate the width of the text - this is approximate
        // We use a factor to account for variable-width fonts
        const approximateCharWidth = fontSize * 0.6; // Approximate width of a character
        const textWidth = text.length * approximateCharWidth;

        // If text would be too wide for the arc, reduce font size
        if (textWidth > arcLength) {
          // Scale down font size to fit
          const scaleFactor = arcLength / textWidth;
          fontSize = Math.max(fontSize * scaleFactor * 0.9, fontSize * 0.4); // Don't go below 40% of original size
        }
      }

      ctx.font = `bold ${fontSize}px sans-serif`;

      // Add text shadow for better visibility over images
      ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Only draw text if we're not hiding it when an image is present
      if (!(option.image && option.hideTextWithImage)) {
        // Draw text along arc
        ctx.fillText(text, textRadius, 0);
      }

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      ctx.restore();

      // Move to next segment
      currentAngle += sliceAngle;
    }

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.1, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#333333";
    ctx.stroke();

    // Draw pointer at the right (0 degrees)
    const pointerX = centerX + radius + 5;
    const pointerY = centerY;

    ctx.beginPath();
    ctx.moveTo(pointerX, pointerY);
    ctx.lineTo(pointerX + 15, pointerY - 15);
    ctx.lineTo(pointerX + 15, pointerY + 15);
    ctx.closePath();

    // Highlight the pointer when a selection is made
    if (selectedOption) {
      ctx.fillStyle = "#ffcc00";
      ctx.strokeStyle = "#cc9900";
    } else {
      ctx.fillStyle = "#cccccc";
      ctx.strokeStyle = "#333333";
    }

    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();

    // Add a subtle motion blur effect when spinning fast
    if (isSpinning && Math.abs(spinSpeedRef.current) > 100) {
      // Skip blur effect on lower-end devices for better performance
      const isLowPerformanceDevice = window.navigator.hardwareConcurrency
        ? window.navigator.hardwareConcurrency <= 4
        : false;

      if (!isLowPerformanceDevice) {
        const blurAmount = Math.min(5, Math.abs(spinSpeedRef.current) / 200);
        ctx.filter = `blur(${blurAmount}px)`;

        // Redraw a faded version of the wheel with blur for motion effect
        ctx.globalAlpha = 0.2;
        ctx.drawImage(canvas, 0, 0);

        // Reset filters
        ctx.filter = "none";
        ctx.globalAlpha = 1.0;
      }
    }
  };

  // Draw the wheel with optimized rendering schedule
  useEffect(() => {
    if (!canvasRef.current || options.length === 0) return;
    const ctx = canvasRef.current.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Only draw once when this effect runs, don't create another animation loop
    drawWheel(ctx);

    // No need for animation frame here since the spinning animation
    // is already handled by the previous useEffect

    return () => {
      // No need to cancel animation frames here
    };
  }, [options, currentRotation, canvasSize, isSpinning, selectedOption]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && e.ctrlKey) {
        onSpin();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSpin]);

  return (
    <div className="relative">
      {options.filter((opt) => opt.enabled).length >= 2 ? (
        <>
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onClick={onSpin}
            className="cursor-pointer"
          />
          {!isSpinning && !selectedOption && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center bg-black/50 text-white px-4 py-2 rounded-full">
                <p>Click to spin</p>
                <p className="text-sm">or press ctrl+enter</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <p className="text-lg text-muted-foreground">
            {options.filter((opt) => opt.enabled).length === 0
              ? "No options available to spin"
              : "At least two options are required to spin"}
          </p>
        </div>
      )}
    </div>
  );
}
