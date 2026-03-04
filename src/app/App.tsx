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
  savedAt?: number; // Timestamp when square was saved (for preserving order across grid size changes)
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

  // Prevent context menu and copy/paste globally
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("paste", handlePaste);
    };
  }, []);

  const updateSquare = (id: number, updates: Partial<BingoSquare>) => {
    setLiveSquares((prev) =>
      prev.map((sq) => {
        if (sq.id !== id) return sq;
        
        const updated = { ...sq, ...updates };
        
        // Set savedAt timestamp if content is being added
        const hasNewContent = 
          updates.canvasData || 
          updates.text || 
          updates.sticker || 
          (updates.canvasObjects && updates.canvasObjects.length > 0);
        
        const isFirstSave = !sq.savedAt;
        
        if (hasNewContent && isFirstSave) {
          updated.savedAt = Date.now();
        }
        
        return updated;
      })
    );
  };

  const handleGridSizeChange = (newSize: number) => {
    setGridSize(newSize);
    
    // Filter to saved squares (those with content)
    const savedSquares = liveSquares.filter((sq) => 
      sq.text || sq.canvasData || sq.sticker || sq.canvasObjects?.length > 0
    );
    
    // Sort by savedAt timestamp (earliest first)
    savedSquares.sort((a, b) => {
      const aTime = a.savedAt ?? 0;
      const bTime = b.savedAt ?? 0;
      return aTime - bTime;
    });
    
    // Take only the first N squares that fit in the new grid
    const maxSquares = newSize * newSize;
    const squaresToKeep = savedSquares.slice(0, maxSquares);
    
    // Create new grid with empty squares
    const newSquares = createInitialSquares(newSize);
    
    // Map saved squares to new grid positions (0, 1, 2, ...)
    squaresToKeep.forEach((savedSq, index) => {
      newSquares[index] = {
        ...savedSq,
        id: index, // Update ID to match new position
      };
    });
    
    setLiveSquares(newSquares);
  };

  const reorderSquares = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    setLiveSquares((prev) => {
      const newSquares = [...prev];
      const [movedSquare] = newSquares.splice(fromIndex, 1);
      newSquares.splice(toIndex, 0, movedSquare);
      
      // Update IDs to match new positions
      return newSquares.map((sq, index) => ({
        ...sq,
        id: index,
      }));
    });
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
            onReorder={reorderSquares}
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