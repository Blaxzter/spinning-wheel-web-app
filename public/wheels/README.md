# Predefined Wheels

This directory contains predefined wheel configurations that are available to all users.

## Adding a New Predefined Wheel

To add a new predefined wheel:

1. Create a new JSON file in this directory with a descriptive name (e.g., `months.json`)
2. Use the following structure for your wheel:

```json
{
  "name": "Display Name of Your Wheel",
  "options": [
    {
      "id": "1",
      "text": "Option Text",
      "color": "#HEXCOLOR",
      "enabled": true,
      "weight": 1,
      "image": null,
      "imageMode": "center",
      "hideTextWithImage": false,
      "colorSetByUser": true
    }
    // Add more options as needed
  ],
  "lastModified": "2024-01-01T00:00:00.000Z",
  "colorPalette": "default",
  "textSettings": {
    "textRadiusPercent": 0.7,
    "fontSizePercent": 0.07
  },
  "predefined": true
}
```

3. The new wheel will automatically appear in the "Predefined Wheels" tab of the load dialog.

## Guidelines

- Choose distinct colors for better visualization
- Keep option text concise and clear
- Use meaningful weights if applicable
- Ensure all predefined wheels have the `"predefined": true` property
