# Porsche 996.1 Safari Configurator - Phase 1

## Directory Structure

```
porsche-configurator/
├── package.json                 # Dependencies & scripts
├── vite.config.js              # Vite configuration
├── index.html                  # Entry HTML
├── Dockerfile                  # Docker build config
├── docker-compose.yml          # Docker compose config
└── src/
    ├── main.jsx               # React entry point
    ├── App.jsx                # Main app component
    ├── App.css                # Global styles with CSS variables
    ├── store.js               # Zustand store (state management)
    └── components/
        ├── Scene.jsx          # Three.js Canvas setup
        ├── Car911.jsx         # Main 3D car model (507 lines)
        └── ConfigPanel.jsx    # Sidebar configurator UI
```

## Features Implemented

### 3D Car Model (Car911.jsx)
- ExtrudeGeometry body based on 996.1 side profile
- 4 wheels with size options (17", 18", 19")
- 3 wheel types: OEM, Fuchs-style, Beadlock
- Lift system: Stock, Mild (+50mm), Safari (+130mm)
- Windows, headlights, and taillights
- 4 spoiler options: None, Stock Lip, Ducktail, Whaletail
- Racing stripe (togglable)
- Roof rack (togglable)
- Safari light bar (togglable)
- Skid plate (togglable)
- Smooth lift animation using useFrame + lerp

### Configurator UI (ConfigPanel.jsx)
- **Paint**: 8 preset colors + custom color picker
- **Wheels**: Type (OEM/Fuchs/Beadlock), Size (17/18/19), Color picker
- **Suspension**: Stock/Mild/Safari lift heights
- **Spoiler**: 4 options
- **Accessories**: Roof Rack, Safari Lights, Skid Plate toggles
- Dark sidebar with monospace title
- CSS variables for theming (accent color #e85d04)

### Scene (Scene.jsx)
- R3F Canvas with shadows
- Orbit controls (pan disabled)
- Multiple light sources with different intensities
- Ground plane
- City environment preset
- Fog for depth

### State Management (store.js)
- Zustand store with all car configuration options
- Setter functions for each property
- Defaults match classic Porsche Safari aesthetic

## Styling (App.css)
- 336 lines of comprehensive CSS
- CSS variables for consistent theming
- Dark theme (#111, #1a1a1a)
- Smooth transitions and hover effects
- Responsive grid layouts
- Custom scrollbars
- Color swatches with active states
- Button groups with flexible layouts

## Build & Run

```bash
# Using Docker (recommended)
docker-compose up

# Manual build (requires Node 20+)
npm install
npm run build
npm run preview
```

The app will be served on http://localhost:3000

## Technical Notes

- All Three.js geometries use `useMemo` for performance
- Car body uses `useRef` with `useFrame` for smooth lift animation
- Material objects are memoized to prevent recreation
- Each wheel is rendered as a group with tire, rim, and spokes/beadlock
- Spoiler geometry changes based on selection
- Responsive layout: flex on desktop, column on mobile (< 768px)
- All shadows enabled on compatible meshes
- Environment reflections using drei's Environment preset
