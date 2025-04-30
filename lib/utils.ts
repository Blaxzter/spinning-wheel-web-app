import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type ColorPalette = "default" | "pastel" | "vibrant" | "muted" | "dark"

export function generateRandomColor(palette: ColorPalette = "default"): string {
  const hue = Math.floor(Math.random() * 360)
  let saturation: number
  let lightness: number

  switch (palette) {
    case "pastel":
      saturation = 55 + Math.floor(Math.random() * 15) // 55-70%
      lightness = 70 + Math.floor(Math.random() * 10)  // 70-80%
      break
    case "vibrant":
      saturation = 80 + Math.floor(Math.random() * 20) // 80-100%
      lightness = 50 + Math.floor(Math.random() * 10)  // 50-60%
      break
    case "muted":
      saturation = 30 + Math.floor(Math.random() * 20) // 30-50%
      lightness = 40 + Math.floor(Math.random() * 20)  // 40-60%
      break
    case "dark":
      saturation = 60 + Math.floor(Math.random() * 30) // 60-90%
      lightness = 15 + Math.floor(Math.random() * 20)  // 15-35%
      break
    default:
      saturation = 70 + Math.floor(Math.random() * 30) // 70-100%
      lightness = 45 + Math.floor(Math.random() * 10)  // 45-55%
  }

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
