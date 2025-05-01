import { ColorPalette } from "./utils";

export interface WheelOption {
  id: string;
  text: string;
  color: string;
  enabled: boolean;
  weight: number;
  image: string | null;
  imageMode: "center" | "fill";
  hideTextWithImage: boolean;
  colorSetByUser?: boolean;
}

export interface WheelData {
  name: string;
  options: WheelOption[];
  lastModified: string;
  colorPalette?: ColorPalette;
  textSettings?: {
    textRadiusPercent: number; // Position of text from center (0.7 default)
    fontSizePercent: number; // Font size as percentage of radius (0.07 default)
  };
  predefined?: boolean; // Flag to indicate if this is a predefined wheel
  slug?: string; // Slug for the wheel
}
