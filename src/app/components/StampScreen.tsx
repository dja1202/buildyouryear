import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import type { BingoSquare } from "../App";
import { ArrowLeft, Stamp, Download } from "lucide-react";

const YEAR = new Date().getFullYear();

interface StampScreenProps {
  squares: BingoSquare[];
  gridSize: number;
  updateSquare: (id: number, updates: Partial<BingoSquare>) => void;
  onBack: () => void;
}

// ─── Confetti burst ────────────────────────────────────────────────────────
function fireConfetti() {
  const end = Date.now() + 2800;
  // Side cannons
  const frame = () => {
    confetti({
      angle: 58,
      spread: 52,
      particleCount: 6,
      origin: { x: 0 },
      colors: ["#fffafa", "#f5c4c5", "#f2dcdd"],
    });
    confetti({
      angle: 122,
      spread: 52,
      particleCount: 6,
      origin: { x: 1 },
      colors: ["#f5c4c5", "#fffafa", "#f2dcdd"],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// ─── Stamp overlay ─────────────────────────────────────────────────────────
function StampOverlay({ justStamped, stampedDate }: { justStamped: boolean; stampedDate?: string }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={
        justStamped
          ? { scale: 4, opacity: 0, rotate: -40 }
          : false
      }
      animate={{ scale: 1, opacity: 1, rotate: -14 }}
      transition={
        justStamped
          ? { type: "spring", stiffness: 480, damping: 22, mass: 0.9 }
          : { duration: 0 }
      }
    >
      {/* Ripple on new stamp */}
      {justStamped && (
        <motion.div
          className="absolute rounded-full"
          style={{ border: "2px solid rgba(217, 143, 164, 0.4)" }}
          initial={{ width: "45%", height: "45%", opacity: 0.9 }}
          animate={{ width: "140%", height: "140%", opacity: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />
      )}

      {/* Stamp circle */}
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: "80%",
          aspectRatio: "1",
          border: "3px solid rgba(217, 143, 164, 0.88)",
          background: "rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            color: "rgba(217, 143, 164, 0.9)",
            fontFamily: "Caveat, cursive",
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1,
          }}
        >
          <div style={{ fontSize: "clamp(0.7rem, 2.4vw, 1.1rem)", letterSpacing: "0.06em" }}>
            DID
          </div>
          <div style={{ fontSize: "clamp(0.7rem, 2.4vw, 1.1rem)", letterSpacing: "0.1em" }}>
            IT
          </div>
          <div style={{ fontSize: "clamp(0.3rem, 1vw, 0.48rem)", opacity: 0.7 }}>
            {stampedDate || YEAR}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── StampSquare ───────────────────────────────────────────────────────────
function StampSquare({
  square,
  isStampMode,
  onStamp,
  onUnstamp,
  justStamped,
}: {
  square: BingoSquare;
  isStampMode: boolean;
  onStamp: () => void;
  onUnstamp: () => void;
  justStamped: boolean;
}) {
  const displayImg = square.compositeData || square.canvasData;
  const hasContent =
    displayImg ||
    square.text ||
    square.sticker ||
    square.canvasObjects?.length;
  
  // Can stamp if: stamp mode is on, has content, and not already stamped
  const canStamp = isStampMode && !square.completed && !!hasContent;
  
  // Can unstamp if: stamp mode is on and already stamped
  const canUnstamp = isStampMode && square.completed;
  
  const isClickable = canStamp || canUnstamp;

  return (
    <motion.div
      className={`relative aspect-square rounded-xl overflow-hidden ${isClickable ? "stamp-cursor" : ""}`}
      style={{
        background: square.completed ? "#FFF5F5" : hasContent ? "white" : "#F7F0E8",
        border: `1.5px solid ${square.completed ? "rgba(217, 143, 164, 0.22)" : "#E8D5C4"}`,
      }}
      whileHover={isClickable ? { scale: 1.07 } : {}}
      whileTap={isClickable ? { scale: 0.92 } : {}}
      onClick={() => {
        if (canStamp) onStamp();
        if (canUnstamp) onUnstamp();
      }}
    >
      {/* Composite image */}
      {displayImg && (
        <img
          src={displayImg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: square.completed ? 0.22 : 0.88 }}
        />
      )}

      {/* Legacy text/sticker fallback */}
      {!displayImg && (square.text || square.sticker) && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center p-1"
          style={{ opacity: square.completed ? 0.25 : 1 }}
        >
          {square.sticker && (
            <div style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.4rem)" }}>
              {square.sticker}
            </div>
          )}
          {square.text && (
            <div
              className="text-center w-full truncate"
              style={{
                fontFamily: "Caveat, cursive",
                fontSize: "clamp(0.5rem, 1.6vw, 0.7rem)",
                color: "#2D2A32",
              }}
            >
              {square.text}
            </div>
          )}
        </div>
      )}

      {/* Empty label */}
      {!hasContent && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ fontSize: "0.55rem", color: "#D8C8B8", fontFamily: "Nunito, sans-serif" }}
        >
          empty
        </div>
      )}

      {/* DID IT stamp */}
      {square.completed && (
        <StampOverlay justStamped={justStamped} stampedDate={square.stampedDate} />
      )}

      {/* Stamp-mode hover tint */}
      {isClickable && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{ background: "rgba(217, 143, 164, 0.07)" }}
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        />
      )}
    </motion.div>
  );
}

// ─── StampScreen ───────────────────────────────────────────────────────────
export function StampScreen({ squares, gridSize, updateSquare, onBack }: StampScreenProps) {
  const [justStampedId, setJustStampedId] = useState<number | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showBingoMessage, setShowBingoMessage] = useState(false);
  const [bingoMessage, setBingoMessage] = useState("");
  const [previousBingoCount, setPreviousBingoCount] = useState(0);
  const [hasShownFirstBingo, setHasShownFirstBingo] = useState(false);
  const confettiFiredRef = useRef(false);

  const filledCount = squares.filter(
    (s) =>
      s.compositeData || s.canvasData || s.text || s.sticker || s.canvasObjects?.length
  ).length;
  const completedCount = squares.filter((s) => s.completed).length;
  const hasStamps = completedCount > 0;

  // Fire confetti exactly once when all 25 squares are stamped
  useEffect(() => {
    if (completedCount === 25 && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      fireConfetti();
    }
    if (completedCount < 25) {
      confettiFiredRef.current = false;
    }
  }, [completedCount]);

  // Count bingo lines
  const bingoLineCount = (() => {
    const g = squares.map((s) => s.completed);
    let count = 0;
    
    // Check rows
    for (let r = 0; r < gridSize; r++) {
      if (Array.from({ length: gridSize }, (_, c) => g[r * gridSize + c]).every(Boolean)) count++;
    }
    
    // Check columns
    for (let c = 0; c < gridSize; c++) {
      if (Array.from({ length: gridSize }, (_, r) => g[r * gridSize + c]).every(Boolean)) count++;
    }
    
    // Check diagonals
    if (Array.from({ length: gridSize }, (_, i) => g[i * gridSize + i]).every(Boolean)) count++;
    if (Array.from({ length: gridSize }, (_, i) => g[i * gridSize + (gridSize - 1 - i)]).every(Boolean)) count++;
    
    return count;
  })();

  // Show BINGO message when a new line is completed
  useEffect(() => {
    // If board is fully complete (25/25), show permanent message
    if (completedCount === 25) {
      setBingoMessage(`Congratulations, you turned all your ${YEAR} goals into reality!`);
      setShowBingoMessage(true);
      return;
    }
    
    // Show message when exactly 1 bingo line exists (first line completed)
    if (bingoLineCount === 1) {
      setBingoMessage(`BINGO! You got your first bigno line! absolutely crushing ${YEAR}!`);
      setShowBingoMessage(true);
    }
    
    // Hide message when 2 or more bingo lines exist
    if (bingoLineCount >= 2) {
      setShowBingoMessage(false);
    }
    
    // Hide message when no bingo lines
    if (bingoLineCount === 0) {
      setShowBingoMessage(false);
    }
  }, [bingoLineCount, completedCount]);

  const handleStamp = (id: number) => {
    setJustStampedId(id);
    // Get current date and format as mm/dd/yyyy
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    const stampedDate = `${month}/${day}/${year}`;
    
    updateSquare(id, { completed: true, stampedDate });
    setTimeout(() => setJustStampedId(null), 900);
  };

  const handleUnstamp = (id: number) => {
    updateSquare(id, { completed: false, stampedDate: undefined });
  };

  // Export function
  const handleExport = async (includeStamps: boolean) => {
    const canvas = document.createElement("canvas");
    const squareSize = 400;
    const gap = 20;
    const padding = 60;
    const headerHeight = 140;
    
    const gridSize = squareSize * 5 + gap * 4;
    canvas.width = gridSize + padding * 2;
    canvas.height = gridSize + padding * 2 + headerHeight;

    const ctx = canvas.getContext("2d")!;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#FFF8F0");
    gradient.addColorStop(1, "#FFF0E8");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      await document.fonts.ready;
    } catch {}

    // Draw title only
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "#664E44";
    ctx.font = "400 94px 'Coming Soon', cursive";
    ctx.fillText(`${YEAR} Bingo`, canvas.width / 2, padding + 85);
    ctx.restore();

    // Draw squares
    const startY = padding + headerHeight;
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const sqIndex = row * 5 + col;
        const square = squares[sqIndex];
        const x = padding + col * (squareSize + gap);
        const y = startY + row * (squareSize + gap);

        // Square background
        ctx.save();
        ctx.fillStyle = (includeStamps && square.completed) ? "#FFF5F5" : "#FFFBF5";
        ctx.strokeStyle = (includeStamps && square.completed) ? "rgba(217, 143, 164, 0.22)" : "#E0D0C0";
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
              
              ctx.globalAlpha = (includeStamps && square.completed) ? 0.22 : 1;
              ctx.drawImage(img, x, y, squareSize, squareSize);
              ctx.restore();
              resolve();
            };
            img.onerror = () => resolve();
          });
        } else if (square.text || square.sticker) {
          // Legacy content
          ctx.save();
          ctx.globalAlpha = (includeStamps && square.completed) ? 0.25 : 1;
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

        // Draw "DID IT" stamp if includeStamps and square is completed
        if (includeStamps && square.completed) {
          ctx.save();
          ctx.translate(x + squareSize / 2, y + squareSize / 2);
          ctx.rotate(-14 * Math.PI / 180);
          
          // Stamp circle (80% to match on-screen version)
          const stampSize = squareSize * 0.8;
          ctx.strokeStyle = "rgba(217, 143, 164, 0.88)";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(0, 0, stampSize / 2, 0, Math.PI * 2);
          ctx.stroke();
          
          // Stamp text
          ctx.fillStyle = "rgba(217, 143, 164, 0.9)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = "700 78px Caveat, cursive";
          ctx.letterSpacing = "0.06em";
          ctx.fillText("DID", 0, -35);
          ctx.letterSpacing = "0.1em";
          ctx.fillText("IT", 0, 25);
          ctx.font = "400 38px Caveat, cursive";
          ctx.globalAlpha = 0.7;
          ctx.fillText(square.stampedDate || String(YEAR), 0, 65);
          
          ctx.restore();
        }
      }
    }

    // Download
    const suffix = includeStamps ? "-with-stamps" : "";
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${YEAR}-bingo-board${suffix}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
    
    setShowExportMenu(false);
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
      <div className="w-full max-w-lg px-5 pt-8 pb-3">
        <motion.button
          onClick={onBack}
          whileTap={{ scale: 0.9 }}
          className="flex items-center gap-1.5 mb-5"
          style={{
            fontFamily: "Nunito, sans-serif",
            fontSize: "0.82rem",
            color: "#A89888",
            fontWeight: 600,
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#664E44";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#A89888";
          }}
        >
          <ArrowLeft size={14} /> Back to editing
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1
            style={{
              fontFamily: "'Coming Soon', cursive",
              fontSize: "clamp(1.6rem, 6vw, 2.3rem)",
              color: "#664E44",
              fontWeight: 400,
              lineHeight: 1.1,
            }}
          >
            Let's start turning<br />these squares into wins.
          </h1>
          <p
            className="mt-1.5"
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "0.8rem",
              color: "#A89888",
            }}
          >
            {completedCount} / {filledCount} done
            {completedCount === gridSize * gridSize && " · 🎉 All done!"}
            <span
              style={{
                marginLeft: "0.5rem",
                color: "#B0A090",
                fontSize: "0.75rem",
              }}
              className="inline md:hidden"
            >
              · click to stamp
            </span>
          </p>
        </motion.div>

        {/* Bingo text message (auto-disappears after 5 seconds) */}
        <AnimatePresence>
          {showBingoMessage && (
            <motion.p
              className="mt-3"
              style={{
                fontFamily: "'Coming Soon', cursive",
                fontSize: "1rem",
                color: "#8A7060",
                fontWeight: 400,
              }}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              {bingoMessage}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Grid */}
      <div className="w-full max-w-lg px-4">
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          }}
        >
          {squares.map((sq) => (
            <StampSquare
              key={sq.id}
              square={sq}
              isStampMode={true}
              justStamped={justStampedId === sq.id}
              onStamp={() => handleStamp(sq.id)}
              onUnstamp={() => handleUnstamp(sq.id)}
            />
          ))}
        </div>
      </div>

      {/* DID IT stamp toggle + hint */}
      <div className="w-full max-w-lg px-4 mt-5 pb-10">
        {/* Export button */}
        {filledCount > 0 && (
          <div className="mt-6">
            {/* Export button */}
            <motion.button
              onClick={() => setShowExportMenu(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl"
              style={{
                background: "#8A7060",
                color: "white",
                fontFamily: "Nunito, sans-serif",
                fontWeight: 700,
                fontSize: "0.95rem",
                letterSpacing: "0.02em",
                transition: "background 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#6E594A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#8A7060";
              }}
            >
              <Download size={18} />
              Export as Image
            </motion.button>

            {/* Export Modal */}
            <AnimatePresence>
              {showExportMenu && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowExportMenu(false)}
                    style={{ background: "rgba(45,42,50,0.6)", backdropFilter: "blur(5px)" }}
                  >
                    {/* Modal Card */}
                    <motion.div
                      className="w-full max-w-sm rounded-3xl overflow-hidden"
                      style={{
                        background: "#FFFBF5",
                        boxShadow: "0 24px 64px rgba(45,42,50,0.3)",
                      }}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Modal Header */}
                      <div
                        className="px-6 py-5 border-b relative"
                        style={{ borderColor: "#F0E8E0" }}
                      >
                        <h3
                          style={{
                            fontFamily: "Nunito, sans-serif",
                            fontSize: "1.5rem",
                            color: "#2D2A32",
                            fontWeight: 700,
                          }}
                        >
                          Export your bingo
                        </h3>
                        <p
                          style={{
                            fontFamily: "Nunito, sans-serif",
                            fontSize: "0.8rem",
                            color: "#A89888",
                            marginTop: "2px",
                          }}
                        >
                          Choose how you want to save it
                        </p>
                        
                        {/* X button */}
                        <motion.button
                          onClick={() => setShowExportMenu(false)}
                          whileTap={{ scale: 0.88 }}
                          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ background: "#dba1a2", color: "white" }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          >
                            <path d="M1 1L13 13M13 1L1 13" />
                          </svg>
                        </motion.button>
                      </div>

                      {/* Options */}
                      <div className="p-4 space-y-3">
                        <button
                          onClick={() => {
                            handleExport(false);
                            setShowExportMenu(false);
                          }}
                          className="w-full py-4 px-5 flex items-start gap-3 rounded-2xl"
                          style={{
                            border: "2px solid #F0E8E0",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#FFF8F0";
                            e.currentTarget.style.borderColor = "#E8D5C4";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "white";
                            e.currentTarget.style.borderColor = "#F0E8E0";
                          }}
                        >
                          <div
                            className="flex-shrink-0 rounded-full flex items-center justify-center"
                            style={{
                              width: 40,
                              height: 40,
                              background: "#F0E8E0",
                            }}
                          >
                            <span style={{ fontSize: "1.2rem" }}>📋</span>
                          </div>
                          <div className="flex-1 text-left">
                            <div
                              style={{
                                fontFamily: "Nunito, sans-serif",
                                fontWeight: 700,
                                fontSize: "1rem",
                                color: "#2D2A32",
                              }}
                            >
                              Export board only
                            </div>
                            <div
                              style={{
                                fontFamily: "Nunito, sans-serif",
                                fontSize: "0.8rem",
                                color: "#A89888",
                                marginTop: "3px",
                              }}
                            >
                              Clean board without stamps
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            if (!hasStamps) return;
                            handleExport(true);
                            setShowExportMenu(false);
                          }}
                          disabled={!hasStamps}
                          className="w-full py-4 px-5 flex items-start gap-3 rounded-2xl"
                          style={{
                            border: `2px solid ${hasStamps ? '#FFE8E8' : '#F0E8E0'}`,
                            transition: "all 0.2s",
                            cursor: hasStamps ? 'pointer' : 'not-allowed',
                            opacity: hasStamps ? 1 : 0.5,
                          }}
                          onMouseEnter={(e) => {
                            if (hasStamps) {
                              e.currentTarget.style.background = "#FFF5F5";
                              e.currentTarget.style.borderColor = "#FFD5D5";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (hasStamps) {
                              e.currentTarget.style.background = "white";
                              e.currentTarget.style.borderColor = "#FFE8E8";
                            }
                          }}
                        >
                          <div
                            className="flex-shrink-0 rounded-full flex items-center justify-center"
                            style={{
                              width: 40,
                              height: 40,
                              background: hasStamps ? "#FFE8E8" : "#F0E8E0",
                            }}
                          >
                            <Stamp size={18} style={{ color: hasStamps ? "#CC2936" : "#B0A090" }} />
                          </div>
                          <div className="flex-1 text-left">
                            <div
                              style={{
                                fontFamily: "Nunito, sans-serif",
                                fontWeight: 700,
                                fontSize: "1rem",
                                color: hasStamps ? "#2D2A32" : "#B0A090",
                              }}
                            >
                              Export with stamps
                            </div>
                            <div
                              style={{
                                fontFamily: "Nunito, sans-serif",
                                fontSize: "0.8rem",
                                color: "#A89888",
                                marginTop: "3px",
                              }}
                            >
                              {hasStamps ? 'Include all "DID IT" stamps' : 'No stamps added yet'}
                            </div>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}