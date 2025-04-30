import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateRandomColor(): string {
  const hue = Math.floor(Math.random() * 360)
  const saturation = 70 + Math.floor(Math.random() * 30)
  const lightness = 45 + Math.floor(Math.random() * 10)

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

export async function calculateAverageColor(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = imageUrl

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }

      // Draw image to canvas
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // Calculate average color
      let r = 0,
        g = 0,
        b = 0,
        count = 0

      for (let i = 0; i < data.length; i += 4) {
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
        count++
      }

      r = Math.floor(r / count)
      g = Math.floor(g / count)
      b = Math.floor(b / count)

      // Lighten the color
      r = Math.min(255, r + 40)
      g = Math.min(255, g + 40)
      b = Math.min(255, b + 40)

      resolve(`rgb(${r}, ${g}, ${b})`)
    }

    img.onerror = () => {
      reject(new Error("Could not load image"))
    }
  })
}
