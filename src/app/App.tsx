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

function createInitialSquares(): BingoSquare[] {
  return Array.from({ length: 25 }, (_, i) => ({
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
      if (Array.isArray(parsed) && parsed.length === 25) {
        // Back-fill new fields for legacy saved data
        return parsed.map((s: BingoSquare) => ({
          canvasObjects: [],
          compositeData: null,
          ...s,
        }));
      }
    }
  } catch {}
  return createInitialSquares();
}

function hasContent(squares: BingoSquare[]): boolean {
  return squares.some(
    (s) => s.text || s.canvasData || s.sticker || s.canvasObjects?.length > 0
  );
}

export default function App() {
  const [liveSquares, setLiveSquares] = useState<BingoSquare[]>(loadSquares);

  // Always start at intro screen
  const [screen, setScreen] = useState<Screen>("intro");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(liveSquares));
    } catch {}
  }, [liveSquares]);

  const updateSquare = (id: number, updates: Partial<BingoSquare>) => {
    setLiveSquares((prev) =>
      prev.map((sq) => (sq.id === id ? { ...sq, ...updates } : sq))
    );
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
            updateSquare={updateSquare}
            onDone={() => setScreen("stamp")}
          />
        )}
        {screen === "stamp" && (
          <StampScreen
            key="stamp"
            squares={liveSquares}
            updateSquare={updateSquare}
            onBack={() => setScreen("board")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}