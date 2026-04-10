# ClassBoard | Virtual Whiteboard 🎨

A modern, high-performance virtual whiteboard built with React and Vite. Designed for distance learning, brainstorming sessions, and professional presentations.

## ✨ Features

- **13 Specialized Tools**: Pencil, Eraser, Shapes (Rectangle/Circle), Lines, Arrows, Text, Sticky Notes, Laser Pointer, and more.
- **Premium Drawing Engine**: Sub-pixel precision drawing with support for high DPI screens.
- **Dynamic Laser Pointer**: Real-time fading laser for highlighting content during presentations.
- **Advanced History (80 Steps)**: Reliable Undo/Redo system with deep state snapshots.
- **Screen Sharing & Recording**: Built-in PiP video window for screen sharing and session recording (WebM format).
- **Pro UI Aesthetics**: Premium glassmorphism design with Framer Motion animations and Outfit typography.
- **Rich Customization**: 24 preset colors, adjustable stroke weight, and opacity controls.
- **Grid View**: Toggle between plain and grid backgrounds for precise diagramming.

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Locally**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

## 🛠️ Technology Stack

- **Framework**: React 18
- **Bundler**: Vite
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Interactions**: React Draggable
- **Effects**: Canvas Confetti
- **Styling**: Vanilla CSS (Custom Glassmorphism)

## 📁 Project Structure

```
classboard/
├── public/index.html
├── src/
│   ├── constants/ (Tools, Colors)
│   ├── hooks/ (History, Display, Canvas)
│   ├── components/ (Modular UI)
│   ├── App.jsx + App.css
│   └── index.js
└── package.json
```

## 📄 License
MIT
