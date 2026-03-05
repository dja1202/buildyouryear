import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SquareEditor } from "./SquareEditor";
import type { BingoSquare } from "../App";

const YEAR = new Date().getFullYear();

interface BoardScreenProps {
  squares: BingoSquare[];
  gridSize: number;
  updateSquare: (id: number, updates: Partial<BingoSquare>) => void;
  onGridSizeChange: (newSize: number) => void;
  onDone: () => void;
}

function MiniSquare({
  square,
  onClick,
  index,
  onClearSquare,
  isEditorOpen,
}: {
  square: BingoSquare;
  onClick: () => void;
  index: number;
  onClearSquare: () => void;
  isEditorOpen: boolean;
}) {
  // Use composite (drawing + objects baked) for display; fall back to drawing-only
  const displayImg = square.compositeData || square.canvasData;
  const hasLegacyContent = square.text || square.sticker;
  const isEmpty = !displayImg && !hasLegacyContent && !square.canvasObjects?.length;

  return (
    <motion.div
      layout={!isEditorOpen}
      onClick={isEditorOpen ? undefined : onClick}
      whileHover={!isEditorOpen ? { scale: 1.06 } : {}}
      className="relative aspect-square rounded-xl overflow-hidden flex flex-col items-center justify-center cursor-pointer"
      style={{
        background: isEmpty ? "#FFFBF5" : "white",
        border: `1.5px solid ${isEmpty ? "#EFE3D6" : "#E0D0C0"}`,
        boxShadow: isEmpty ? "none" : "0 2px 8px rgba(45,42,50,0.07)",
        touchAction: "none",
        userSelect: "none",
        pointerEvents: isEditorOpen ? "none" : "auto",
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

      {/* Square number badge OR clear button for filled squares */}
      {isEmpty ? (
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
      ) : (
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onClearSquare();
          }}
          whileTap={{ scale: 0.88 }}
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full flex items-center justify-center z-20"
          style={{
            background: "#dba1a2",
            color: "white",
            fontSize: "0.9rem",
            pointerEvents: "auto",
          }}
          title="Clear this goal"
        >
          ×
        </motion.button>
      )}
    </motion.div>
  );
}

export function BoardScreen({ squares, gridSize, updateSquare, onGridSizeChange, onDone }: BoardScreenProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showGridSizeDropdown, setShowGridSizeDropdown] = useState(false);
  const editingSquare = editingId !== null ? squares.find((s) => s.id === editingId) : null;

  const filledCount = squares.filter(
    (s) =>
      s.compositeData ||
      s.canvasData ||
      s.text ||
      s.sticker ||
      s.canvasObjects?.length
  ).length;

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
          {filledCount}/{gridSize * gridSize} filled · tap to edit
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
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            pointerEvents: editingId !== null ? "none" : "auto",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {squares.map((sq, index) => (
            <MiniSquare
              key={sq.id}
              square={sq}
              index={index}
              onClick={() => setEditingId(sq.id)}
              onClearSquare={() => updateSquare(sq.id, { compositeData: null, canvasData: null, text: null, sticker: null, canvasObjects: [] })}
              isEditorOpen={editingId !== null}
            />
          ))}
        </motion.div>
      </div>

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
