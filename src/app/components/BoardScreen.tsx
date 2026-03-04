import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SquareEditor } from "./SquareEditor";
import type { BingoSquare } from "../App";

const YEAR = new Date().getFullYear();

interface BoardScreenProps {
  squares: BingoSquare[];
  updateSquare: (id: number, updates: Partial<BingoSquare>) => void;
  onDone: () => void;
}

function MiniSquare({
  square,
  onClick,
  index,
}: {
  square: BingoSquare;
  onClick: () => void;
  index: number;
}) {
  // Use composite (drawing + objects baked) for display; fall back to drawing-only
  const displayImg = square.compositeData || square.canvasData;
  const hasLegacyContent = square.text || square.sticker;
  const isEmpty = !displayImg && !hasLegacyContent && !square.canvasObjects?.length;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      className="relative aspect-square rounded-xl overflow-hidden flex flex-col items-center justify-center cursor-pointer"
      style={{
        background: isEmpty ? "#FFFBF5" : "white",
        border: `1.5px solid ${isEmpty ? "#EFE3D6" : "#E0D0C0"}`,
        boxShadow: isEmpty ? "none" : "0 2px 8px rgba(45,42,50,0.07)",
      }}
    >
      {/* Composite / drawing image */}
      {displayImg && (
        <img
          src={displayImg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.9 }}
        />
      )}

      {/* Legacy sticker/text fallback (no canvas image) */}
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
    </motion.button>
  );
}

export function BoardScreen({ squares, updateSquare, onDone }: BoardScreenProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const editingSquare = editingId !== null ? squares.find((s) => s.id === editingId) : null;

  const filledCount = squares.filter(
    (s) =>
      s.compositeData ||
      s.canvasData ||
      s.text ||
      s.sticker ||
      s.canvasObjects?.length
  ).length;

  const handleExport = async () => {
    if (filledCount === 0) return;

    // Create a canvas with proper dimensions for the board
    const canvas = document.createElement("canvas");
    const squareSize = 400; // Each square is 400x400px
    const gap = 20; // Gap between squares
    const padding = 60; // Padding around the board
    const headerHeight = 160; // Space for title
    const labelHeight = 80; // Space for BINGO letters
    
    const gridSize = squareSize * 5 + gap * 4;
    canvas.width = gridSize + padding * 2;
    canvas.height = gridSize + padding * 2 + headerHeight + labelHeight;

    const ctx = canvas.getContext("2d")!;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#FFF8F0");
    gradient.addColorStop(1, "#FFF0E8");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Wait for fonts
    try {
      await document.fonts.ready;
    } catch {}

    // Draw title
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "#2D2A32";
    ctx.font = "700 72px Caveat, cursive";
    ctx.fillText(`${YEAR} Bingo`, canvas.width / 2, padding + 60);
    ctx.font = "600 28px Nunito, sans-serif";
    ctx.fillStyle = "#A89888";
    ctx.fillText("My Year in Review", canvas.width / 2, padding + 110);
    ctx.restore();

    // Draw squares
    const startY = padding + headerHeight + labelHeight;
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const sqIndex = row * 5 + col;
        const square = squares[sqIndex];
        const x = padding + col * (squareSize + gap);
        const y = startY + row * (squareSize + gap);

        // Square background
        ctx.save();
        ctx.fillStyle = "#FFFBF5";
        ctx.strokeStyle = "#E0D0C0";
        ctx.lineWidth = 3;
        
        // Rounded rectangle
        const radius = 24;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + squareSize - radius, y);
        ctx.arcTo(x + squareSize, y, x + squareSize, y + radius, radius);
        ctx.lineTo(x + squareSize, y + squareSize - radius);
        ctx.arcTo(x + squareSize, y + squareSize, x + squareSize - radius, y + squareSize, radius);
        ctx.lineTo(x + radius, y + squareSize);
        ctx.arcTo(x, y + squareSize, x, y + squareSize - radius, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Draw square content if it exists
        const displayImg = square.compositeData || square.canvasData;
        if (displayImg) {
          const img = new Image();
          img.src = displayImg;
          await new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.save();
              // Clip to rounded rectangle
              ctx.beginPath();
              ctx.moveTo(x + radius, y);
              ctx.lineTo(x + squareSize - radius, y);
              ctx.arcTo(x + squareSize, y, x + squareSize, y + radius, radius);
              ctx.lineTo(x + squareSize, y + squareSize - radius);
              ctx.arcTo(x + squareSize, y + squareSize, x + squareSize - radius, y + squareSize, radius);
              ctx.lineTo(x + radius, y + squareSize);
              ctx.arcTo(x, y + squareSize, x, y + squareSize - radius, radius);
              ctx.lineTo(x, y + radius);
              ctx.arcTo(x, y, x + radius, y, radius);
              ctx.closePath();
              ctx.clip();
              
              ctx.drawImage(img, x, y, squareSize, squareSize);
              ctx.restore();
              resolve();
            };
            img.onerror = () => resolve();
          });
        } else if (square.text || square.sticker) {
          // Legacy content
          ctx.save();
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          if (square.sticker) {
            ctx.font = "72px serif";
            ctx.fillText(square.sticker, x + squareSize / 2, y + squareSize / 2 - 20);
          }
          if (square.text) {
            ctx.font = "32px Caveat, cursive";
            ctx.fillStyle = "#2D2A32";
            ctx.fillText(square.text, x + squareSize / 2, y + squareSize / 2 + (square.sticker ? 50 : 0));
          }
          ctx.restore();
        }

        // Square number badge
        ctx.save();
        ctx.fillStyle = "rgba(232,213,196,0.7)";
        ctx.beginPath();
        ctx.arc(x + 25, y + 25, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#A89888";
        ctx.font = "600 16px Nunito, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(sqIndex + 1), x + 25, y + 25);
        ctx.restore();
      }
    }

    // Download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${YEAR}-bingo-board.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

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
          {filledCount}/25 filled · tap any square to edit
        </motion.p>
      </div>

      {/* Grid */}
      <div className="w-full max-w-lg px-4">
        <motion.div
          className="grid grid-cols-5 gap-1.5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {squares.map((sq, i) => (
            <MiniSquare
              key={sq.id}
              square={sq}
              index={i}
              onClick={() => setEditingId(sq.id)}
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