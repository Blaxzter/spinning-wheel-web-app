export interface WheelOption {
  id: string
  text: string
  color: string
  enabled: boolean
  weight: number
  image: string | null
  imageMode: "center" | "fill"
}

export interface WheelData {
  name: string
  options: WheelOption[]
  lastModified: string
}
