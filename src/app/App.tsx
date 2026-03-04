import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { IntroScreen } from "./components/IntroScreen";
import { BoardScreen } from "./components/BoardScreen";
import { StampScreen } from "./components/StampScreen";

export interface CanvasObject {
  id: string;
  type: "text" | "sticker";
  content: string;
  x: number; // 0–1, fraction of canvas width
  y: number; // 0–1, fraction of canvas height
  size: number; // font-size in canvas pixels
  color: string;
}

export interface BingoSquare {
  id: number;
  text: string; // legacy
  canvasData: string | null; // pure drawing (no objects)
  canvasObjects: CanvasObject[]; // freely-placed text / sticker objects
  compositeData: string | null; // canvasData + objects composited → used for display
  sticker: string | null; // legacy
  completed: boolean;
  stampedDate?: string; // Date when stamp was applied (mm/dd/yyyy format)
}

const YEAR = new Date().getFullYear();
const STORAGE_KEY = `bingo-board-${YEAR}`;
const GRID_SIZE_KEY = `bingo-grid-size-${YEAR}`;

function createInitialSquares(gridSize: number): BingoSquare[] {
  return Array.from({ length: gridSize * gridSize }, (_, i) => ({
    id: i,
    text: "",
    canvasData: null,
    canvasObjects: [],
    compositeData: null,
    sticker: null,
    completed: false,
  }));
}

type Screen = "intro" | "board" | "stamp";

function loadSquares(): BingoSquare[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Back-fill new fields for legacy saved data
        return parsed.map((s: BingoSquare) => ({
          canvasObjects: [],
          compositeData: null,
          ...s,
        }));
      }
    }
  } catch {}
  return createInitialSquares(5);
}

function loadGridSize(): number {
  try {
    const saved = localStorage.getItem(GRID_SIZE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if ([3, 4, 5, 6].includes(parsed)) {
        return parsed;
      }
    }
  } catch {}
  return 5; // default
}

function hasContent(squares: BingoSquare[]): boolean {
  return squares.some(
    (s) => s.text || s.canvasData || s.sticker || s.canvasObjects?.length > 0
  );
}

export default function App() {
  const [gridSize, setGridSize] = useState<number>(loadGridSize);
  const [liveSquares, setLiveSquares] = useState<BingoSquare[]>(loadSquares);

  // Always start at intro screen
  const [screen, setScreen] = useState<Screen>("intro");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(liveSquares));
    } catch {}
  }, [liveSquares]);

  useEffect(() => {
    try {
      localStorage.setItem(GRID_SIZE_KEY, String(gridSize));
    } catch {}
  }, [gridSize]);

  const updateSquare = (id: number, updates: Partial<BingoSquare>) => {
    setLiveSquares((prev) =>
      prev.map((sq) => (sq.id === id ? { ...sq, ...updates } : sq))
    );
  };

  const handleGridSizeChange = (newSize: number) => {
    setGridSize(newSize);
    // Reset all squares when grid size changes
    setLiveSquares(createInitialSquares(newSize));
  };

  return (
    <div className="min-h-screen w-full" style={{ fontFamily: "Nunito, sans-serif" }}>
      <AnimatePresence mode="wait">
        {screen === "intro" && (
          <IntroScreen key="intro" onComplete={() => setScreen("board")} />
        )}
        {screen === "board" && (
          <BoardScreen
            key="board"
            squares={liveSquares}
            gridSize={gridSize}
            updateSquare={updateSquare}
            onGridSizeChange={handleGridSizeChange}
            onDone={() => setScreen("stamp")}
          />
        )}
        {screen === "stamp" && (
          <StampScreen
            key="stamp"
            squares={liveSquares}
            gridSize={gridSize}
            updateSquare={updateSquare}
            onBack={() => setScreen("board")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}