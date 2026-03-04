import {
  useRef,
  useEffect,
  useState,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Trash2,
  Pencil,
  PenTool,
  Paintbrush,
  Eraser,
  Smile,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import { HexColorPicker } from "react-colorful";
import type { BingoSquare, CanvasObject } from "../App";

// ─── Constants ───────────────────────────────────────────────────────────────
const STICKERS = [
  "⭐","🎯","💫","🎨","📚","🏃","🌟","❤️","🎵","🌈",
  "🏆","🌻","🎂","🦋","🌙","🔥","🎪","🍀","🎭","💎",
  "🚀","🎸","🌺","🦄","🍕","✈️","🎬","🏖️","🎹","🌊",
  "🎃","🎄","🎆","🌸","🐉","🦁","🐬","🌮","☕","🎠",
];

type ToolType = "brush" | "eraser" | "sticker";

// ─── ObjectItem: draggable / resizable sticker ────────────────────────
interface ObjectItemProps {
  obj: CanvasObject;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (u: Partial<CanvasObject>) => void;
  onDelete: () => void;
}

function ObjectItem({
  obj,
  containerRef,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: ObjectItemProps) {
  const handleDragPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();

    const startCX = e.clientX;
    const startCY = e.clientY;
    const startX = obj.x;
    const startY = obj.y;
    const rect = containerRef.current!.getBoundingClientRect();

    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startCX) / rect.width;
      const dy = (ev.clientY - startCY) / rect.height;
      onUpdate({
        x: Math.max(0.01, Math.min(0.99, startX + dx)),
        y: Math.max(0.01, Math.min(0.99, startY + dy)),
      });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startCX = e.clientX;
    const startSize = obj.size;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startCX;
      const minSize = 18;
      onUpdate({ size: Math.max(minSize, startSize + dx * 0.7) });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      style={{
        position: "absolute",
        left: `${obj.x * 100}%`,
        top: `${obj.y * 100}%`,
        transform: "translate(-50%, -50%)",
        cursor: "move",
        userSelect: "none",
        touchAction: "none",
        zIndex: isSelected ? 20 : 10,
      }}
      onPointerDown={handleDragPointerDown}
    >
      {/* Content */}
      <div
        style={{
          fontSize: obj.size,
          fontFamily: "serif",
          lineHeight: 1,
          whiteSpace: "nowrap",
          outline: isSelected ? "1.5px dashed #dba1a2" : "none",
          outlineOffset: 5,
          borderRadius: 4,
          padding: "1px 3px",
        }}
      >
        {obj.content}
      </div>

      {/* Selection handles */}
      {isSelected && (
        <>
          {/* Delete button */}
          <button
            style={{
              position: "absolute",
              top: -14,
              right: -14,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#c99394",
              color: "white",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              lineHeight: 1,
              zIndex: 30,
              touchAction: "none",
              boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
          >
            ×
          </button>

          {/* Resize handle (bottom-right) */}
          <div
            style={{
              position: "absolute",
              bottom: -9,
              right: -9,
              width: 17,
              height: 17,
              borderRadius: 4,
              background: "#dba1a2",
              cursor: "se-resize",
              touchAction: "none",
              zIndex: 30,
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }}
            onPointerDown={handleResizePointerDown}
          />
        </>
      )}
    </div>
  );
}

// ─── SquareEditor ─────────────────────────────────────────────────────────────
interface SquareEditorProps {
  square: BingoSquare;
  onSave: (updates: Partial<BingoSquare>) => void;
  onClose: () => void;
}

export function SquareEditor({ square, onSave, onClose }: SquareEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDrawingRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIdxRef = useRef(-1);

  const [tool, setTool] = useState<ToolType>("brush");
  const [penColor, setPenColor] = useState("#2D2A32");
  const [brushSize, setBrushSize] = useState(5); // User-controlled brush size
  const [eraserSize, setEraserSize] = useState(16); // Selected eraser size
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [objects, setObjects] = useState<CanvasObject[]>(
    () => square.canvasObjects ?? []
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // ── Canvas setup ──────────────────────────────────────────────────────────
  const syncUndoRedo = useCallback(() => {
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const setupCanvas = () => {
      const w = container.offsetWidth || Math.floor(container.getBoundingClientRect().width);
      const h = w; // Make it square (same as board editor grid)
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";

      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#FFFBF5";
      ctx.fillRect(0, 0, w, h);

      const init = () => {
        historyRef.current = [canvas.toDataURL()];
        historyIdxRef.current = 0;
        syncUndoRedo();
      };

      if (square.canvasData) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, w, h);
          init();
        };
        img.onerror = init;
        img.src = square.canvasData;
      } else {
        init();
      }
    };

    const id = setTimeout(setupCanvas, 60);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Undo / Redo ───────────────────────────────────────────────────────────
  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snapshot = canvas.toDataURL();
    const next = historyRef.current.slice(0, historyIdxRef.current + 1);
    next.push(snapshot);
    if (next.length > 30) next.shift();
    historyRef.current = next;
    historyIdxRef.current = next.length - 1;
    syncUndoRedo();
  }, [syncUndoRedo]);

  const restoreFromHistory = useCallback(
    (idx: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas) return;
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = "#FFFBF5";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        syncUndoRedo();
      };
      img.src = historyRef.current[idx];
    },
    [syncUndoRedo]
  );

  const handleUndo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current--;
    restoreFromHistory(historyIdxRef.current);
  }, [restoreFromHistory]);

  const handleRedo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current++;
    restoreFromHistory(historyIdxRef.current);
  }, [restoreFromHistory]);

  // ── Drawing handlers ──────────────────────────────────────────────────────
  const getPoint = (e: React.PointerEvent): { x: number; y: number } => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const isDrawTool = tool === "brush" || tool === "eraser";
    if (!isDrawTool) return;
    
    e.preventDefault();
    setSelectedId(null);
    setShowColorPicker(false);
    isDrawingRef.current = true;
    const pt = getPoint(e);
    lastPtRef.current = pt;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      const size = tool === "eraser" ? eraserSize : brushSize;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = tool === "eraser" ? "#FFFBF5" : penColor;
      ctx.fill();
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const isDrawTool = tool === "brush" || tool === "eraser";
    if (!isDrawTool) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !lastPtRef.current) return;

    const pt = getPoint(e);
    const size = tool === "eraser" ? eraserSize : brushSize;
    
    ctx.beginPath();
    ctx.moveTo(lastPtRef.current.x, lastPtRef.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.strokeStyle = tool === "eraser" ? "#FFFBF5" : penColor;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPtRef.current = pt;
  };

  const handleCanvasPointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPtRef.current = null;
    saveToHistory();
  };

  // ── Objects ───────────────────────────────────────────────────────────────
  const addStickerObject = (emoji: string) => {
    const id = `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setObjects((prev) => [
      ...prev,
      {
        id,
        type: "sticker",
        content: emoji,
        x: 0.25 + Math.random() * 0.5,
        y: 0.2 + Math.random() * 0.5,
        size: 52,
        color: "#000",
      },
    ]);
    setSelectedId(id);
    setShowStickerPicker(false);
    setTool("sticker");
  };

  const updateObject = (id: string, updates: Partial<CanvasObject>) => {
    setObjects((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
  };

  const deleteObject = (id: string) => {
    setObjects((prev) => prev.filter((o) => o.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.fillStyle = "#FFFBF5";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
    setObjects([]);
    setSelectedId(null);
  };

  // ── Save: check if empty and reset if needed ─────────
  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      // Clear the square if canvas doesn't exist, including any stamp
      onSave({ canvasData: null, canvasObjects: [], compositeData: null, text: "", completed: false, stampedDate: undefined });
      onClose();
      return;
    }

    // Check if canvas is empty (only has blank background)
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // Check if all pixels are the background color (#FFFBF5 = rgb(255, 251, 245))
    const bgR = 255, bgG = 251, bgB = 245;
    let hasDrawing = false;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] !== bgR || pixels[i + 1] !== bgG || pixels[i + 2] !== bgB) {
        hasDrawing = true;
        break;
      }
    }

    // If completely empty, clear the square and remove any stamp
    if (!hasDrawing && objects.length === 0) {
      onSave({ canvasData: null, canvasObjects: [], compositeData: null, text: "", completed: false, stampedDate: undefined });
      onClose();
      return;
    }

    // Otherwise save the content and reset any existing stamp
    const canvasData = canvas.toDataURL("image/png");

    // Composite: drawing + objects baked in
    const temp = document.createElement("canvas");
    temp.width = canvas.width;
    temp.height = canvas.height;
    const tempCtx = temp.getContext("2d")!;

    tempCtx.fillStyle = "#FFFBF5";
    tempCtx.fillRect(0, 0, temp.width, temp.height);
    tempCtx.drawImage(canvas, 0, 0);

    try {
      await document.fonts.ready;
    } catch {}

    for (const obj of objects) {
      tempCtx.save();
      tempCtx.textAlign = "center";
      tempCtx.textBaseline = "middle";
      tempCtx.font = `${obj.size}px serif`;
      tempCtx.fillStyle = "#000";
      tempCtx.fillText(
        obj.content,
        obj.x * canvas.width,
        obj.y * canvas.height
      );
      tempCtx.restore();
    }

    const compositeData = temp.toDataURL("image/jpeg", 0.88);

    // Reset stamp when saving edited content
    onSave({ canvasData, canvasObjects: objects, compositeData, text: "", completed: false, stampedDate: undefined });
    onClose();
  };

  // ── Overlay interactivity ───────────
  const overlayInteractive = tool === "sticker";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: "rgba(45,42,50,0.6)", backdropFilter: "blur(5px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="w-full sm:max-w-md flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          background: "#FFFBF5",
          maxHeight: "96vh",
          boxShadow: "0 24px 64px rgba(45,42,50,0.3)",
        }}
        initial={{ y: 80, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 80, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 420, damping: 38 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0"
          style={{ borderBottom: "1.5px solid #F0E8DC" }}
        >
          <span
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "1.2rem",
              color: "#664E44",
              fontWeight: 700,
            }}
          >
            Square #{square.id + 1}
          </span>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleClearCanvas}
              whileTap={{ scale: 0.88 }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
              style={{ background: "#F0E8DC", color: "#8A7060", fontFamily: "Nunito, sans-serif", fontWeight: 600 }}
            >
              <Trash2 size={12} /> Clear
            </motion.button>
            <motion.button
              onClick={onClose}
              whileTap={{ scale: 0.88 }}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "#dba1a2", color: "white" }}
            >
              <X size={15} />
            </motion.button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 min-h-0">
          {/* Canvas container */}
          <div
            ref={containerRef}
            className="relative w-full overflow-hidden"
            style={{ background: "#F7F0E8", lineHeight: 0 }}
          >
            <canvas
              ref={canvasRef}
              style={{
                display: "block",
                touchAction: "none",
                cursor: tool === "eraser" ? "cell" : "crosshair",
              }}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerLeave={handleCanvasPointerUp}
            />

            {/* Objects overlay */}
            <div
              className="absolute inset-0"
              style={{ pointerEvents: overlayInteractive ? "auto" : "none" }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedId(null);
              }}
            >
              {objects.map((obj) => (
                <ObjectItem
                  key={obj.id}
                  obj={obj}
                  containerRef={containerRef}
                  isSelected={selectedId === obj.id}
                  onSelect={() => setSelectedId(obj.id)}
                  onUpdate={(u) => updateObject(obj.id, u)}
                  onDelete={() => deleteObject(obj.id)}
                />
              ))}
            </div>
          </div>

          {/* ── Toolbar ── */}
          <div
            className="px-3 py-2.5 flex items-center gap-2 flex-wrap shrink-0"
            style={{ borderBottom: "1.5px solid #F0E8DC" }}
          >
            {/* Brush type group */}
            <div
              className="flex rounded-xl overflow-hidden"
              style={{ border: "1.5px solid #8A7060" }}
            >
              <button
                onClick={() => {
                  setTool("brush");
                  setShowStickerPicker(false);
                  setShowColorPicker(false);
                }}
                className="p-2.5"
                style={{
                  background: tool === "brush" ? "#F0E8DC" : "transparent",
                  color: "#8A7060",
                  transition: "background 0.15s",
                }}
                title="Brush"
              >
                <Pencil size={14} />
              </button>
              
              {/* Eraser */}
              <button
                onClick={() => {
                  setTool("eraser");
                  setShowStickerPicker(false);
                  setShowColorPicker(false);
                }}
                className="p-2.5"
                style={{
                  background: tool === "eraser" ? "#F0E8DC" : "transparent",
                  color: tool === "eraser" ? "8A7060" : "#8A7060",
                  transition: "background 0.15s",
                }}
                title="Eraser"
              >
                <Eraser size={14} />
              </button>
              
              {/* Sticker */}
              <button
                onClick={() => {
                  setTool("sticker");
                  setShowStickerPicker((v) => !v);
                  setShowColorPicker(false);
                }}
                className="p-2.5"
                style={{
                  background: tool === "sticker" ? "#F0E8DC" : "transparent",
                  color: tool === "sticker" ? "8A7060" : "#8A7060",
                  transition: "background 0.15s",
                }}
                title="Sticker"
              >
                <Smile size={14} />
              </button>
            </div>

            {/* Color swatch */}
            <motion.button
              onClick={() => {
                setShowColorPicker((v) => !v);
                setShowStickerPicker(false);
              }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-full shrink-0"
              style={{
                background: penColor,
                boxShadow: showColorPicker
                  ? `0 0 0 2.5px #FFFBF5, 0 0 0 4px ${penColor}`
                  : `0 0 0 1.5px rgba(0,0,0,0.1)`,
                transition: "box-shadow 0.2s",
              }}
              title="Pick color"
            />

            {/* Undo / Redo */}
            <div className="ml-auto flex gap-1">
              <motion.button
                onClick={handleUndo}
                disabled={!canUndo}
                whileTap={canUndo ? { scale: 0.88 } : {}}
                className="p-2 rounded-xl"
                style={{
                  background: canUndo ? "#F0E8DC" : "transparent",
                  color: canUndo ? "#2D2A32" : "#D8C8B8",
                }}
                title="Undo"
              >
                <RotateCcw size={15} />
              </motion.button>
              <motion.button
                onClick={handleRedo}
                disabled={!canRedo}
                whileTap={canRedo ? { scale: 0.88 } : {}}
                className="p-2 rounded-xl"
                style={{
                  background: canRedo ? "#F0E8DC" : "transparent",
                  color: canRedo ? "#2D2A32" : "#D8C8B8",
                }}
                title="Redo"
              >
                <RotateCw size={15} />
              </motion.button>
            </div>
          </div>

          {/* ── Brush size slider (for drawing tools) ── */}
          {tool === "brush" && (
            <div
              className="px-4 py-3 shrink-0"
              style={{ borderBottom: "1.5px solid #F0E8DC" }}
            >
              <div className="flex items-center gap-3">
                <span
                  style={{
                    fontFamily: "Nunito, sans-serif",
                    fontSize: "0.7rem",
                    color: "#8A7060",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    minWidth: "32px",
                  }}
                >
                  Size
                </span>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  style={{
                    flex: 1,
                    accentColor: "#B8AB9C",
                  }}
                />
                <span
                  style={{
                    fontFamily: "Nunito, sans-serif",
                    fontSize: "0.75rem",
                    color: "#2D2A32",
                    fontWeight: 600,
                    minWidth: "24px",
                    textAlign: "right",
                  }}
                >
                  {brushSize}
                </span>
              </div>
            </div>
          )}

          {/* ── Eraser size slider ── */}
          {tool === "eraser" && (
            <div
              className="px-4 py-3 shrink-0"
              style={{ borderBottom: "1.5px solid #F0E8DC" }}
            >
              <div className="flex items-center gap-3">
                <span
                  style={{
                    fontFamily: "Nunito, sans-serif",
                    fontSize: "0.7rem",
                    color: "#8A7060",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    minWidth: "32px",
                  }}
                >
                  Size
                </span>
                <input
                  type="range"
                  min="4"
                  max="60"
                  value={eraserSize}
                  onChange={(e) => setEraserSize(Number(e.target.value))}
                  style={{
                    flex: 1,
                    accentColor: "#B8AB9C",
                  }}
                />
                <span
                  style={{
                    fontFamily: "Nunito, sans-serif",
                    fontSize: "0.75rem",
                    color: "#2D2A32",
                    fontWeight: 600,
                    minWidth: "24px",
                    textAlign: "right",
                  }}
                >
                  {eraserSize}
                </span>
              </div>
            </div>
          )}

          {/* ── Color picker panel ── */}
          <AnimatePresence>
            {showColorPicker && (
              <motion.div
                key="colorpicker"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden shrink-0"
                style={{ borderBottom: "1.5px solid #F0E8DC" }}
              >
                <div className="flex flex-col items-center gap-3 px-4 py-4">
                  <HexColorPicker
                    color={penColor}
                    onChange={setPenColor}
                    style={{ width: "100%", maxWidth: 260 }}
                  />
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full shrink-0"
                      style={{ background: penColor, border: "1.5px solid #E8D5C4" }}
                    />
                    <input
                      value={penColor}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setPenColor(v);
                      }}
                      className="rounded-lg px-2 py-1 text-sm"
                      style={{
                        border: "1.5px solid #E8D5C4",
                        background: "#F7F0E8",
                        fontFamily: "Nunito, sans-serif",
                        color: "#2D2A32",
                        width: 90,
                        outline: "none",
                      }}
                    />
                  </div>
                  {/* Preset swatches */}
                  <div className="flex gap-2 flex-wrap justify-center">
                    {[
                      "#2D2A32","#FF6B6B","#4ECDC4","#FFD166",
                      "#06D6A0","#6A0572","#FF9F1C","#2EC4B6",
                      "#E71D36","#011627",
                    ].map((c) => (
                      <button
                        key={c}
                        onClick={() => setPenColor(c)}
                        className="rounded-full"
                        style={{
                          width: penColor === c ? 24 : 20,
                          height: penColor === c ? 24 : 20,
                          background: c,
                          boxShadow:
                            penColor === c
                              ? `0 0 0 2.5px #FFFBF5, 0 0 0 4.5px ${c}`
                              : "none",
                          transition: "all 0.15s",
                        }}
                      />
                    ))}\n                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Sticker picker panel ── */}
          <AnimatePresence>
            {showStickerPicker && (
              <motion.div
                key="stickerpicker"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden shrink-0"
                style={{ borderBottom: "1.5px solid #F0E8DC" }}
              >
                <div className="p-3 grid grid-cols-8 gap-1.5">
                  {STICKERS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      onClick={() => addStickerObject(emoji)}
                      whileTap={{ scale: 0.82 }}
                      className="flex items-center justify-center rounded-xl aspect-square"
                      style={{ fontSize: "1.5rem", background: "#F7F0E8" }}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Save button ── */}
        <div
          className="px-4 pb-6 pt-3 shrink-0"
          style={{ borderTop: "1.5px solid #F0E8DC" }}
        >
          <motion.button
            onClick={handleSave}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl"
            style={{
              background: "#8A7060",
              color: "white",
              fontFamily: "Nunito, sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
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
            Save Square ✓
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}