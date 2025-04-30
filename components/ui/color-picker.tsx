"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  // State for each color format
  const [hexColor, setHexColor] = useState("#000000")
  const [rgbColor, setRgbColor] = useState({ r: 0, g: 0, b: 0 })
  const [hslColor, setHslColor] = useState({ h: 0, s: 0, l: 0 })
  
  // Parse the initial color on mount and when color prop changes
  useEffect(() => {
    console.log("Input color:", color)
    
    // Handle HSL format: HSL(240, 59%, 70%)
    if (typeof color === 'string' && color.toUpperCase().startsWith('HSL')) {
      try {
        const match = color.match(/HSL\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/i)
        if (match) {
          const h = parseInt(match[1], 10)
          const s = parseInt(match[2], 10)
          const l = parseInt(match[3], 10)
          
          console.log("Parsed HSL:", h, s, l)
          
          // Set HSL values
          const hslValues = { h, s, l }
          setHslColor(hslValues)
          
          // Convert HSL to RGB
          const rgbValues = hslToRgb(h, s, l)
          setRgbColor(rgbValues)
          
          // Convert RGB to HEX
          const hexValue = rgbToHex(rgbValues.r, rgbValues.g, rgbValues.b)
          setHexColor(hexValue)
          
          console.log("Converted to hex:", hexValue)
          return
        }
      } catch (e) {
        console.error("Error parsing HSL:", e)
      }
    }
    
    // Handle hex format with or without # prefix
    let hexValue = color
    if (!hexValue.startsWith("#")) {
      hexValue = "#" + hexValue
    }
    
    // Validate hex format
    if (!/^#[0-9A-Fa-f]{6}$/.test(hexValue)) {
      console.log("Invalid hex, defaulting to #000000")
      hexValue = "#000000"
    }
    
    setHexColor(hexValue)
    
    // Convert hex to RGB
    const rgb = hexToRgb(hexValue)
    setRgbColor(rgb)
    
    // Convert RGB to HSL
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    setHslColor(hsl)
    
    console.log("Set from hex:", { hexValue, rgb, hsl })
  }, [color])
  
  // Convert hex to RGB
  const hexToRgb = (hex: string): { r: number, g: number, b: number } => {
    // Remove # if present
    const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex
    
    // Parse the hex values
    const r = parseInt(cleanHex.substr(0, 2), 16)
    const g = parseInt(cleanHex.substr(2, 2), 16)
    const b = parseInt(cleanHex.substr(4, 2), 16)
    
    // Ensure values are valid numbers
    return {
      r: isNaN(r) ? 0 : r,
      g: isNaN(g) ? 0 : g,
      b: isNaN(b) ? 0 : b
    }
  }
  
  // Convert RGB to hex
  const rgbToHex = (r: number, g: number, b: number): string => {
    // Ensure values are within valid range
    r = Math.min(255, Math.max(0, Math.round(r)))
    g = Math.min(255, Math.max(0, Math.round(g)))
    b = Math.min(255, Math.max(0, Math.round(b)))
    
    // Convert to hex
    const toHex = (c: number) => {
      const hex = c.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }
  
  // Convert RGB to HSL
  const rgbToHsl = (r: number, g: number, b: number): { h: number, s: number, l: number } => {
    // Convert RGB to [0, 1] range
    r /= 255
    g /= 255
    b /= 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2
    
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      
      h /= 6
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    }
  }
  
  // Convert HSL to RGB
  const hslToRgb = (h: number, s: number, l: number): { r: number, g: number, b: number } => {
    // Convert to [0, 1] range
    h = Math.max(0, Math.min(360, h)) / 360
    s = Math.max(0, Math.min(100, s)) / 100
    l = Math.max(0, Math.min(100, l)) / 100
    
    let r, g, b
    
    if (s === 0) {
      // Achromatic (gray)
      r = g = b = l
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1/6) return p + (q - p) * 6 * t
        if (t < 1/2) return q
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
        return p
      }
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }
    
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    }
  }
  
  // Handle hex input change
  const handleHexChange = (value: string) => {
    if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
      // Pad with zeros if needed
      let hexValue = value
      if (hexValue.length < 7) {
        hexValue = hexValue.padEnd(7, '0')
      }
      
      setHexColor(hexValue)
      
      // Only update other values when we have a complete hex
      if (hexValue.length === 7) {
        const rgb = hexToRgb(hexValue)
        setRgbColor(rgb)
        
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
        setHslColor(hsl)
        
        onChange(hexValue)
      }
    }
  }
  
  // Handle RGB input change
  const handleRgbChange = (component: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...rgbColor, [component]: value }
    setRgbColor(newRgb)
    
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
    setHexColor(newHex)
    
    const newHsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b)
    setHslColor(newHsl)
    
    onChange(newHex)
  }
  
  // Handle HSL input change
  const handleHslChange = (component: 'h' | 's' | 'l', value: number) => {
    const newHsl = { ...hslColor, [component]: value }
    setHslColor(newHsl)
    
    const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l)
    setRgbColor(newRgb)
    
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
    setHexColor(newHex)
    
    onChange(newHex)
  }

  return (
    <div className="grid gap-4">
      <Tabs defaultValue="hex" className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="hex">Hex</TabsTrigger>
          <TabsTrigger value="rgb">RGB</TabsTrigger>
          <TabsTrigger value="hsl">HSL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="hex" className="mt-4">
          <div className="grid gap-2">
            <Label htmlFor="color-picker">Hex Color</Label>
            <div className="flex gap-2">
              <Input
                id="color-picker"
                type="color"
                value={hexColor}
                onChange={(e) => handleHexChange(e.target.value)}
                className="w-full h-24"
              />
            </div>
            <div className="mt-2">
              <Input 
                value={hexColor.toUpperCase()}
                onChange={(e) => handleHexChange(e.target.value.toLowerCase())}
                placeholder="#000000"
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="rgb" className="mt-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="r-value">Red ({rgbColor.r})</Label>
              <Slider
                id="r-value"
                min={0}
                max={255}
                step={1}
                value={[rgbColor.r]}
                onValueChange={(values) => handleRgbChange('r', values[0])}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="g-value">Green ({rgbColor.g})</Label>
              <Slider
                id="g-value"
                min={0}
                max={255}
                step={1}
                value={[rgbColor.g]}
                onValueChange={(values) => handleRgbChange('g', values[0])}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="b-value">Blue ({rgbColor.b})</Label>
              <Slider
                id="b-value"
                min={0}
                max={255}
                step={1}
                value={[rgbColor.b]}
                onValueChange={(values) => handleRgbChange('b', values[0])}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={rgbColor.r}
                  onChange={(e) => handleRgbChange('r', Number(e.target.value))}
                />
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={rgbColor.g}
                  onChange={(e) => handleRgbChange('g', Number(e.target.value))}
                />
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  min={0}
                  max={255}
                  value={rgbColor.b}
                  onChange={(e) => handleRgbChange('b', Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="hsl" className="mt-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="h-value">Hue ({hslColor.h}°)</Label>
              <Slider
                id="h-value"
                min={0}
                max={360}
                step={1}
                value={[hslColor.h]}
                onValueChange={(values) => handleHslChange('h', values[0])}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="s-value">Saturation ({hslColor.s}%)</Label>
              <Slider
                id="s-value"
                min={0}
                max={100}
                step={1}
                value={[hslColor.s]}
                onValueChange={(values) => handleHslChange('s', values[0])}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="l-value">Lightness ({hslColor.l}%)</Label>
              <Slider
                id="l-value"
                min={0}
                max={100}
                step={1}
                value={[hslColor.l]}
                onValueChange={(values) => handleHslChange('l', values[0])}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  min={0}
                  max={360}
                  value={hslColor.h}
                  onChange={(e) => handleHslChange('h', Number(e.target.value))}
                />
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={hslColor.s}
                  onChange={(e) => handleHslChange('s', Number(e.target.value))}
                />
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={hslColor.l}
                  onChange={(e) => handleHslChange('l', Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex flex-col gap-2 mt-2">
        <div 
          className="w-full h-12 rounded border"
          style={{ backgroundColor: hexColor }}
        />
        <div className="text-xs overflow-hidden">
          <div>Hex: {hexColor.toUpperCase()}</div>
          <div>RGB: {rgbColor.r}, {rgbColor.g}, {rgbColor.b}</div>
          <div>HSL: {hslColor.h}°, {hslColor.s}%, {hslColor.l}%</div>
        </div>
      </div>
    </div>
  )
} 