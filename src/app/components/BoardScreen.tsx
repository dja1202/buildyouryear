import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SquareEditor } from "./SquareEditor";
import type { BingoSquare } from "../App";

const YEAR = new Date().getFullYear();

interface BoardScreenProps {
  squares: BingoSquare[];
  gridSize: number;
  updateSquare: (id: number, updates: Partial<BingoSquare>) => void;
  onGridSizeChange: (newSize: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDone: () => void;
}

interface DragState {
  isDragging: boolean;
  draggedIndex: number | null;
  currentIndex: number | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

function MiniSquare({
  square,
  onClick,
  onLongPressStart,
  index,
  isDragging,
  isPlaceholder,
}: {
  square: BingoSquare;
  onClick: () => void;
  onLongPressStart: (e: React.PointerEvent) => void;
  index: number;
  isDragging: boolean;
  isPlaceholder: boolean;
}) {
  // Use composite (drawing + objects baked) for display; fall back to drawing-only
  const displayImg = square.compositeData || square.canvasData;
  const hasLegacyContent = square.text || square.sticker;
  const isEmpty = !displayImg && !hasLegacyContent && !square.canvasObjects?.length;

  return (
    <motion.button
      layout
      onClick={onClick}
      onPointerDown={onLongPressStart}
      whileHover={!isDragging ? { scale: 1.06 } : {}}
      className="relative aspect-square rounded-xl overflow-hidden flex flex-col items-center justify-center cursor-pointer"
      style={{
        background: isEmpty ? "#FFFBF5" : "white",
        border: `1.5px solid ${isEmpty ? "#EFE3D6" : "#E0D0C0"}`,
        boxShadow: isEmpty ? "none" : "0 2px 8px rgba(45,42,50,0.07)",
        opacity: isPlaceholder ? 0.3 : 1,
        touchAction: "none",
        userSelect: "none",
      }}
      transition={{ layout: { duration: 0.2, ease: "easeOut" } }}
    >
      {/* Composite / drawing image */}
      {displayImg && (
        <img
          src={displayImg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.9, pointerEvents: "none" }}
          draggable={false}
        />
      )}

      {/* Legacy sticker/text fallback (no canvas image) */}
      {!displayImg && hasLegacyContent && (
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-1 pointer-events-none">
          {square.sticker && (
            <div style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.4rem)", lineHeight: 1 }}>
              {square.sticker}
            </div>
          )}
          {square.text && (
            <div
              className="text-center w-full px-0.5 truncate"
              style={{
                fontFamily: "Caveat, cursive",
                fontSize: "clamp(0.55rem, 1.8vw, 0.75rem)",
                color: "#2D2A32",
              }}
            >
              {square.text}
            </div>
          )}
        </div>
      )}

      {/* Empty hint */}
      {isEmpty && (
        <div style={{ fontSize: "clamp(0.75rem, 2.5vw, 1.1rem)", color: "#DCCFBF", pointerEvents: "none" }}>
          +
        </div>
      )}

      {/* Square number badge */}
      <div
        className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
        style={{
          background: "rgba(232,213,196,0.55)",
          fontSize: "0.38rem",
          color: "#A89888",
          fontFamily: "Nunito, sans-serif",
          fontWeight: 700,
          pointerEvents: "none",
        }}
      >
        {index + 1}
      </div>
    </motion.button>
  );
}

function DraggingSquare({
  square,
  index,
  x,
  y,
  gridContainerRef,
}: {
  square: BingoSquare;
  index: number;
  x: number;
  y: number;
  gridContainerRef: React.RefObject<HTMLDivElement>;
}) {
  const displayImg = square.compositeData || square.canvasData;
  const hasLegacyContent = square.text || square.sticker;
  const isEmpty = !displayImg && !hasLegacyContent && !square.canvasObjects?.length;

  // Calculate size based on grid container
  const [size, setSize] = useState(100);

  useEffect(() => {
    if (gridContainerRef.current) {
      const gridRect = gridContainerRef.current.getBoundingClientRect();
      const gridWidth = gridRect.width;
      // Approximate square size (accounting for gaps)
      const cols = Math.sqrt(gridContainerRef.current.children.length);
      const squareSize = gridWidth / cols - 6; // subtract gap
      setSize(squareSize);
    }
  }, [gridContainerRef]);

  return (
    <motion.div
      className="fixed pointer-events-none z-50 rounded-xl overflow-hidden flex flex-col items-center justify-center"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        background: isEmpty ? "#FFFBF5" : "white",
        border: `1.5px solid ${isEmpty ? "#EFE3D6" : "#E0D0C0"}`,
        boxShadow: "0 12px 24px rgba(45,42,50,0.25)",
        transform: "translate(-50%, -50%) scale(1.08)",
        userSelect: "none",
      }}
      initial={{ scale: 1, rotate: 0 }}
      animate={{ scale: 1.08, rotate: 2 }}
      transition={{ duration: 0.15 }}
    >
      {/* Composite / drawing image */}
      {displayImg && (
        <img
          src={displayImg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.9 }}
          draggable={false}
        />
      )}

      {/* Legacy sticker/text fallback */}
      {!displayImg && hasLegacyContent && (
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-1">
          {square.sticker && (
            <div style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.4rem)", lineHeight: 1 }}>
              {square.sticker}
            </div>
          )}
          {square.text && (
            <div
              className="text-center w-full px-0.5 truncate"
              style={{
                fontFamily: "Caveat, cursive",
                fontSize: "clamp(0.55rem, 1.8vw, 0.75rem)",
                color: "#2D2A32",
              }}
            >
              {square.text}
            </div>
          )}
        </div>
      )}

      {/* Empty hint */}
      {isEmpty && (
        <div style={{ fontSize: "clamp(0.75rem, 2.5vw, 1.1rem)", color: "#DCCFBF" }}>
          +
        </div>
      )}

      {/* Square number badge */}
      <div
        className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
        style={{
          background: "rgba(232,213,196,0.55)",
          fontSize: "0.38rem",
          color: "#A89888",
          fontFamily: "Nunito, sans-serif",
          fontWeight: 700,
        }}
      >
        {index + 1}
      </div>
    </motion.div>
  );
}

export function BoardScreen({ squares, gridSize, updateSquare, onGridSizeChange, onReorder, onDone }: BoardScreenProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showGridSizeDropdown, setShowGridSizeDropdown] = useState(false);
  const editingSquare = editingId !== null ? squares.find((s) => s.id === editingId) : null;

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasMovedRef = useRef(false);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedIndex: null,
    currentIndex: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const filledCount = squares.filter(
    (s) =>
      s.compositeData ||
      s.canvasData ||
      s.text ||
      s.sticker ||
      s.canvasObjects?.length
  ).length;

  // Calculate current drop index based on pointer position
  const getDropIndex = (clientX: number, clientY: number): number | null => {
    if (!gridContainerRef.current) return null;

    const gridRect = gridContainerRef.current.getBoundingClientRect();
    const children = Array.from(gridContainerRef.current.children);

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const rect = child.getBoundingClientRect();
      
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return i;
      }
    }

    return null;
  };

  const handleLongPressStart = (index: number, e: React.PointerEvent) => {
    e.preventDefault();
    hasMovedRef.current = false;

    // Start long-press timer
    longPressTimerRef.current = setTimeout(() => {
      // Enter drag mode
      setDragState({
        isDragging: true,
        draggedIndex: index,
        currentIndex: index,
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
      });

      // Add vibration feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 400); // 400ms long press
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!dragState.isDragging || dragState.draggedIndex === null) return;

    hasMovedRef.current = true;

    const dropIndex = getDropIndex(e.clientX, e.clientY);

    setDragState((prev) => ({
      ...prev,
      currentX: e.clientX,
      currentY: e.clientY,
      currentIndex: dropIndex !== null ? dropIndex : prev.currentIndex,
    }));
  };

  const handlePointerUp = () => {
    // Clear long-press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (dragState.isDragging && dragState.draggedIndex !== null && dragState.currentIndex !== null) {
      // Perform the reorder
      if (dragState.draggedIndex !== dragState.currentIndex) {
        onReorder(dragState.draggedIndex, dragState.currentIndex);
      }
    }

    // Reset drag state
    setDragState({
      isDragging: false,
      draggedIndex: null,
      currentIndex: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });
  };

  const handleSquareClick = (index: number) => {
    // Only open editor if not dragging and hasn't moved
    if (!dragState.isDragging && !hasMovedRef.current) {
      setEditingId(squares[index].id);
    }
  };

  // Add global pointer event listeners when dragging
  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);

      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
      };
    }
  }, [dragState.isDragging, dragState.draggedIndex, dragState.currentIndex]);

  // Create display array with reordering
  const displaySquares = [...squares];
  if (dragState.isDragging && dragState.draggedIndex !== null && dragState.currentIndex !== null) {
    const [movedSquare] = displaySquares.splice(dragState.draggedIndex, 1);
    displaySquares.splice(dragState.currentIndex, 0, movedSquare);
  }

  const handleProceed = () => {
    if (filledCount > 0) {
      onDone();
    }
  };

  return (
    <motion.div
      className="min-h-screen w-full flex flex-col items-center justify-center py-8"
      style={{ background: "linear-gradient(160deg, #FFF8F0 0%, #FFF0E8 100%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="w-full max-w-lg px-5 pt-10 pb-6 flex flex-col items-center">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            fontFamily: "'Coming Soon', cursive",
            fontSize: "clamp(3.5rem, 12vw, 4rem)",
            color: "#664E44",
            lineHeight: 1,
            fontWeight: 400,
          }}
        >
          {YEAR} Bingo
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-2"
          style={{ fontFamily: "Nunito, sans-serif", fontSize: "0.85rem", color: "#A89888" }}
        >
          {filledCount}/{gridSize * gridSize} filled · tap to edit · hold to rearrange
        </motion.p>

        {/* Grid Size Selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 relative"
        >
          <button
            onClick={() => setShowGridSizeDropdown(!showGridSizeDropdown)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{
              background: "#FFFBF5",
              border: "1.5px solid #E0D0C0",
              fontFamily: "Nunito, sans-serif",
              fontSize: "0.85rem",
              color: "#664E44",
              fontWeight: 600,
            }}
          >
            <span style={{ color: "#A89888", fontSize: "0.75rem" }}>Grid Size:</span>
            {gridSize} × {gridSize}
            <span style={{ marginLeft: "2px", fontSize: "0.7rem" }}>▼</span>
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {showGridSizeDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full mt-2 left-0 right-0 rounded-xl overflow-hidden"
                style={{
                  background: "#FFFBF5",
                  border: "1.5px solid #E0D0C0",
                  boxShadow: "0 4px 12px rgba(45,42,50,0.12)",
                  zIndex: 10,
                }}
              >
                {[3, 4, 5, 6].map((size) => (
                  <motion.button
                    key={size}
                    onClick={() => {
                      onGridSizeChange(size);
                      setShowGridSizeDropdown(false);
                    }}
                    whileHover={{ background: "#F7F0E8" }}
                    className="w-full px-4 py-2.5 text-left flex items-center justify-between"
                    style={{
                      fontFamily: "Nunito, sans-serif",
                      fontSize: "0.85rem",
                      color: gridSize === size ? "#664E44" : "#8A7060",
                      fontWeight: gridSize === size ? 700 : 500,
                      background: gridSize === size ? "#F0E8DC" : "rgba(247, 240, 232, 0)",
                      borderBottom: size !== 6 ? "1px solid #F0E8DC" : "none",
                    }}
                  >
                    <span>{size} × {size}</span>
                    {gridSize === size && (
                      <span style={{ fontSize: "0.9rem" }}>✓</span>
                    )}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Grid */}
      <div className="w-full max-w-lg px-4">
        <motion.div
          ref={gridContainerRef}
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {displaySquares.map((sq, displayIndex) => {
            const originalIndex = squares.findIndex(s => s.id === sq.id);
            const isBeingDragged = dragState.isDragging && dragState.draggedIndex === originalIndex;
            
            return (
              <MiniSquare
                key={sq.id}
                square={sq}
                index={originalIndex}
                onClick={() => handleSquareClick(originalIndex)}
                onLongPressStart={(e) => handleLongPressStart(originalIndex, e)}
                isDragging={isBeingDragged}
                isPlaceholder={isBeingDragged}
              />
            );
          })}
        </motion.div>
      </div>

      {/* Dragging square overlay */}
      {dragState.isDragging && dragState.draggedIndex !== null && (
        <DraggingSquare
          square={squares[dragState.draggedIndex]}
          index={dragState.draggedIndex}
          x={dragState.currentX}
          y={dragState.currentY}
          gridContainerRef={gridContainerRef}
        />
      )}

      {/* Done button */}
      <div className="w-full max-w-lg px-4 pb-10 mt-8">
        <motion.button
          onClick={handleProceed}
          disabled={filledCount === 0}
          whileHover={{ scale: filledCount > 0 ? 1.02 : 1 }}
          whileTap={{ scale: filledCount > 0 ? 0.97 : 1 }}
          className="w-full py-4 rounded-2xl"
          style={{
            background: filledCount > 0 ? "#dba0b1" : "#EDE5DC",
            color: filledCount > 0 ? "white" : "#B0A090",
            fontFamily: "Nunito, sans-serif",
            fontWeight: 700,
            fontSize: "1rem",
            letterSpacing: "0.02em",
            transition: "background 0.3s",
          }}
          onMouseEnter={(e) => {
            if (filledCount > 0) {
              e.currentTarget.style.background = "#c99394";
            }
          }}
          onMouseLeave={(e) => {
            if (filledCount > 0) {
              e.currentTarget.style.background = "#dba1a2";
            }
          }}
        >
          {filledCount > 0 ? "I'm ready! Let's go →" : "Fill in at least one square first"}
        </motion.button>
      </div>

      {/* Square Editor modal */}
      <AnimatePresence>
        {editingSquare && (
          <SquareEditor
            key={editingSquare.id}
            square={editingSquare}
            onSave={(updates) => updateSquare(editingSquare.id, updates)}
            onClose={() => setEditingId(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
