import { ColorPalette } from "./utils"

export interface WheelOption {
  id: string
  text: string
  color: string
  enabled: boolean
  weight: number
  image: string | null
  imageMode: "center" | "fill"
  hideTextWithImage: boolean
  colorSetByUser?: boolean
}

export interface WheelData {
  name: string
  options: WheelOption[]
  lastModified: string
  colorPalette?: ColorPalette
}
