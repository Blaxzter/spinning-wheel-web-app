import type { WheelData } from "./types";

// Define the catalog structure
export interface WheelCatalogItem {
  id: string;
  name: string;
  filename: string;
  previewOptions: string[];
}

interface WheelCatalog {
  wheels: WheelCatalogItem[];
}

/**
 * Fetches the catalog of available predefined wheels
 * @returns A promise that resolves to the catalog of available wheels
 */
export async function getPredefinedWheelsCatalog(): Promise<
  WheelCatalogItem[]
> {
  try {
    const response = await fetch("/wheels/catalog.json");
    if (!response.ok) {
      throw new Error("Failed to fetch predefined wheels catalog");
    }

    const catalog = (await response.json()) as WheelCatalog;
    return catalog.wheels;
  } catch (error) {
    console.error("Error fetching predefined wheels catalog:", error);
    return [];
  }
}

/**
 * Loads a specific wheel by its filename
 * @param filename The filename of the wheel to load
 * @returns A promise that resolves to the wheel data
 */
export async function loadPredefinedWheel(
  filename: string
): Promise<WheelData | null> {
  try {
    const url = `/wheels/${filename}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error("Response not OK:", response.status, response.statusText);
      throw new Error(`Failed to fetch wheel: ${filename}`);
    }

    const wheelData = await response.json();
    return wheelData as WheelData;
  } catch (error) {
    console.error(`Error loading wheel ${filename}:`, error);
    return null;
  }
}

/**
 * Gets a wheel by its ID
 * @param id The ID of the wheel to get
 * @returns A promise that resolves to the wheel data
 */
export async function getWheelById(id: string): Promise<WheelData | null> {
  try {
    // First get the catalog
    const catalog = await getPredefinedWheelsCatalog();

    // Find the wheel with the matching ID
    const wheel = catalog.find((w) => w.id.toLowerCase() === id.toLowerCase());

    if (!wheel) {
      return null;
    }

    // Load the wheel data
    return await loadPredefinedWheel(wheel.filename);
  } catch (error) {
    console.error(`Error getting wheel by ID ${id}:`, error);
    return null;
  }
}
