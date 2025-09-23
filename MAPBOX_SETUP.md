# Mapbox Setup Instructions

## Getting Started with Mapbox

1. **Get a Mapbox Access Token:**
   - Go to [Mapbox Account](https://account.mapbox.com/)
   - Sign up for a free account or log in
   - Go to "Access tokens" section
   - Copy your default public token or create a new one
   - For development, the default public token works fine

2. **Add the Access Token to your project:**
   - Create a `.env` file in the root directory
   - Add your access token: `VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here`
   - Make sure to add `.env` to your `.gitignore` file

3. **Features included:**
   - Interactive Mapbox maps
   - Heatmap visualization with Snapchat colors
   - Responsive design with Tailwind CSS
   - Location markers and density analysis

## Component Usage

The MapboxMap component accepts these props:
- `center`: Object with lat/lng coordinates
- `zoom`: Number for zoom level (1-20)
- `apiKey`: Your Mapbox access token
- `showHeatmap`: Boolean to enable/disable heatmap

Example:
```jsx
<MapboxMap 
  center={{ lat: 37.7749, lng: -122.4194 }}
  zoom={10}
  apiKey={MAPBOX_ACCESS_TOKEN}
  showHeatmap={true}
/>
```

## Mapbox vs Google Maps

**Advantages of Mapbox:**
- More customizable styling
- Better performance for large datasets
- More advanced visualization options
- Better mobile performance
- More detailed map styles

**Heatmap Features:**
- Snapchat-inspired color gradient
- Zoom-responsive intensity
- Smooth animations
- High-performance rendering
