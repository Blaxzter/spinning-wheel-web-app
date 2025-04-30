"use client"

import { useEffect, useRef, useState } from "react"
import type { WheelOption } from "@/lib/types"

interface WheelProps {
  options: WheelOption[]
  isSpinning: boolean
  selectedOption: WheelOption | null
  onSpin: () => void
  targetRotation: number | null
  currentRotation: number
  onRotationChange: (rotation: number) => void
  onAnimationComplete: () => void
  registerGetOptionAtPointer?: (getOptionAtPointerFn: () => WheelOption | null) => void
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
}: WheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 })
  const animationRef = useRef<number | undefined>(undefined)
  const pointerAngle = 0 // Pointer is at the right (0 degrees)
  const lastFrameTimeRef = useRef<number>(0)
  const spinSpeedRef = useRef<number>(0)
  const animationCompleteRef = useRef<boolean>(false)
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map())

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const size = Math.min(window.innerWidth - 40, window.innerHeight - 200, 600)
      setCanvasSize({ width: size, height: size })
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Preload and cache images
  useEffect(() => {
    // Preload all images when options change
    options.forEach((option) => {
      if (option.image && !imageCache.current.has(option.image)) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = option.image

        img.onload = () => {
          imageCache.current.set(option.image!, img)
          // Force redraw when image loads
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d")
            if (ctx) drawWheel(ctx)
          }
        }
      }
    })
  }, [options])

  // Reset animation complete flag when spinning starts
  useEffect(() => {
    if (isSpinning) {
      animationCompleteRef.current = false
    }
  }, [isSpinning])

  // Handle spinning animation
  useEffect(() => {
    if (isSpinning && targetRotation !== null) {
      // Start animation
      const startTime = performance.now()
      const duration = 3000 // 3 seconds
      const startRotation = currentRotation
      const rotationDiff = targetRotation - startRotation

      // Set initial spin speed (degrees per second)
      spinSpeedRef.current = (rotationDiff / 3) * 0.5 // Initial speed is higher than average

      const animate = (time: number) => {
        const elapsed = time - startTime
        const progress = Math.min(elapsed / duration, 1)
        const deltaTime = time - (lastFrameTimeRef.current || time)
        lastFrameTimeRef.current = time

        // Easing function for natural slowdown
        const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
        const newRotation = startRotation + rotationDiff * easeOut(progress)

        // Update the current rotation
        onRotationChange(newRotation)

        // Calculate instantaneous speed for visual feedback
        if (deltaTime > 0) {
          const instantSpeed = ((newRotation - currentRotation) / deltaTime) * 1000 // degrees per second
          spinSpeedRef.current = instantSpeed
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          // Ensure we end exactly at the target rotation
          onRotationChange(targetRotation)
          spinSpeedRef.current = 0

          // Signal animation completion
          if (!animationCompleteRef.current) {
            animationCompleteRef.current = true
            onAnimationComplete()
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isSpinning, targetRotation])

  // Calculate which option is at the pointer position
  const getOptionAtPointer = () => {
    if (options.length === 0) return null

    // Calculate total weight
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0)

    // Convert current rotation to a value between 0-360
    const normalizedRotation = ((currentRotation % 360) + 360) % 360

    // The pointer is at 0 degrees, so we need to find which slice is there
    // We need to adjust by the current rotation to find the correct slice
    const pointerPosition = (360 - normalizedRotation) % 360

    // Find which slice contains this position
    let currentAngle = 0
    for (const option of options) {
      const sliceAngle = (360 * option.weight) / totalWeight
      if (pointerPosition >= currentAngle && pointerPosition < currentAngle + sliceAngle) {
        return option
      }
      currentAngle += sliceAngle
    }

    // Fallback to first option if something went wrong
    return options[0]
  }

  // Register the getOptionAtPointer function if the prop is provided
  useEffect(() => {
    if (registerGetOptionAtPointer) {
      registerGetOptionAtPointer(getOptionAtPointer);
    }
  }, [registerGetOptionAtPointer, options, currentRotation]);

  // Draw the wheel - extracted to a function for reuse
  const drawWheel = (ctx: CanvasRenderingContext2D) => {
    if (!canvasRef.current || options.length === 0) return

    const canvas = canvasRef.current

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 10

    // Calculate total weight
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0)

    // Draw wheel segments
    const startAngle = (currentRotation * Math.PI) / 180
    let currentAngle = startAngle

    for (let i = 0; i < options.length; i++) {
      const option = options[i]
      const sliceAngle = (2 * Math.PI * option.weight) / totalWeight

      // Draw segment
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
      ctx.closePath()

      // Highlight the selected option
      const fillColor = option.color
      if (selectedOption && option.id === selectedOption.id) {
        // Create a slightly brighter version of the color for highlighting
        ctx.fillStyle = fillColor
        ctx.fill()

        // Add a subtle glow effect
        ctx.save()
        ctx.globalAlpha = 0.3
        ctx.shadowColor = "white"
        ctx.shadowBlur = 15
        ctx.fill()
        ctx.restore()
      } else {
        ctx.fillStyle = fillColor
        ctx.fill()
      }

      // Fill with color or image
      if (option.image) {
        // Use cached image if available
        const cachedImg = imageCache.current.get(option.image)

        if (cachedImg && cachedImg.complete) {
          // Create pattern or draw image based on mode
          if (option.imageMode === "fill") {
            // Save the current state
            ctx.save()

            // Create a clipping path for this segment
            ctx.beginPath()
            ctx.moveTo(centerX, centerY)
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
            ctx.closePath()
            ctx.clip()

            // Calculate the middle angle of this segment
            const middleAngle = currentAngle + sliceAngle / 2
            
            // Get the position where text would be rendered (for alignment)
            const textX = centerX + Math.cos(middleAngle) * (radius * 0.7)
            const textY = centerY + Math.sin(middleAngle) * (radius * 0.7)
            
            // Apply transformation at the text position
            ctx.translate(textX, textY)
            ctx.rotate(middleAngle + Math.PI/2)
            
            // Use a more appropriate size for the image
            const imgSize = radius * 1.5
            
            // Draw the image centered on the text position
            ctx.drawImage(cachedImg, -imgSize / 2, -imgSize / 2, imgSize, imgSize)

            // Restore the context
            ctx.restore()
            
            // Add a semi-transparent overlay to improve text readability
            ctx.save()
            ctx.beginPath()
            ctx.moveTo(centerX, centerY)
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
            ctx.closePath()
            ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
            ctx.fill()
            ctx.restore()

            // Redraw the segment border
            ctx.beginPath()
            ctx.moveTo(centerX, centerY)
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
            ctx.closePath()
            ctx.lineWidth = 2
            ctx.strokeStyle = "#ffffff"
            ctx.stroke()
          } else {
            // Center mode - draw image in center of segment
            ctx.fillStyle = option.color
            ctx.fill()

            // Calculate position for centered image
            const imgSize = radius * 0.4
            const distanceFromCenter = radius * 0.7
            // Position image at same radius as text for better alignment
            const imgX = centerX + Math.cos(currentAngle + sliceAngle / 2) * distanceFromCenter - imgSize / 2
            const imgY = centerY + Math.sin(currentAngle + sliceAngle / 2) * distanceFromCenter - imgSize / 2

            // Create a clipping path for this segment to prevent overlap
            ctx.save()
            ctx.beginPath()
            ctx.moveTo(centerX, centerY)
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
            ctx.closePath()
            ctx.clip()
            
            // Draw the image within the clipped area
            ctx.translate(imgX + imgSize / 2, imgY + imgSize / 2)
            // Adjust rotation to keep image upright relative to text
            ctx.rotate(currentAngle + sliceAngle / 2 + Math.PI / 2)
            ctx.drawImage(cachedImg, -imgSize / 2, -imgSize / 2, imgSize, imgSize)
            ctx.restore()
          }
        } else {
          // If image isn't loaded yet, just fill with color
          ctx.fillStyle = option.color
          ctx.fill()
        }
      } else {
        ctx.fillStyle = option.color
        ctx.fill()
      }

      // Draw segment border
      ctx.lineWidth = 2
      ctx.strokeStyle = "#ffffff"
      ctx.stroke()

      // Draw text
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(currentAngle + sliceAngle / 2)

      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillStyle = "#ffffff"
      ctx.font = `bold ${radius * 0.07}px sans-serif`

      // Draw text along arc
      const text = option.text
      const textRadius = radius * 0.7

      // Add text shadow for better visibility over images
      ctx.shadowColor = "rgba(0, 0, 0, 0.7)"
      ctx.shadowBlur = 3
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1

      // Only draw text if we're not hiding it when an image is present
      if (!(option.image && option.hideTextWithImage)) {
        // Draw text along arc
        ctx.fillText(text, textRadius, 0)
      }

      // Reset shadow
      ctx.shadowColor = "transparent"
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      ctx.restore()

      // Move to next segment
      currentAngle += sliceAngle
    }

    // Draw center circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.1, 0, 2 * Math.PI)
    ctx.fillStyle = "#ffffff"
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = "#333333"
    ctx.stroke()

    // Draw pointer at the right (0 degrees)
    const pointerX = centerX + radius + 5
    const pointerY = centerY

    ctx.beginPath()
    ctx.moveTo(pointerX, pointerY)
    ctx.lineTo(pointerX + 15, pointerY - 15)
    ctx.lineTo(pointerX + 15, pointerY + 15)
    ctx.closePath()

    // Highlight the pointer when a selection is made
    if (selectedOption) {
      ctx.fillStyle = "#ffcc00"
      ctx.strokeStyle = "#cc9900"
    } else {
      ctx.fillStyle = "#cccccc"
      ctx.strokeStyle = "#333333"
    }

    ctx.fill()
    ctx.lineWidth = 2
    ctx.stroke()

    // Add a subtle motion blur effect when spinning fast
    if (isSpinning && Math.abs(spinSpeedRef.current) > 100) {
      const blurAmount = Math.min(10, Math.abs(spinSpeedRef.current) / 100)
      ctx.filter = `blur(${blurAmount}px)`

      // Redraw a faded version of the wheel with blur for motion effect
      ctx.globalAlpha = 0.3
      ctx.drawImage(canvas, 0, 0)

      // Reset filters
      ctx.filter = "none"
      ctx.globalAlpha = 1.0
    }
  }

  // Draw the wheel
  useEffect(() => {
    if (!canvasRef.current || options.length === 0) return
    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    drawWheel(ctx)
  }, [options, currentRotation, canvasSize, isSpinning, selectedOption])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && e.ctrlKey) {
        onSpin()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onSpin])

  return (
    <div className="relative">
      {options.filter(opt => opt.enabled).length >= 2 ? (
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
            {options.filter(opt => opt.enabled).length === 0 
              ? "No options available to spin" 
              : "At least two options are required to spin"}
          </p>
        </div>
      )}
    </div>
  )
}
