import { motion } from "motion/react";
import { HexColorPicker } from "react-colorful";

interface ColorPickerModalProps {
  isOpen: boolean;
  color: string;
  onColorChange: (color: string) => void;
  onClose: () => void;
}

export function ColorPickerModal({
  isOpen,
  color,
  onColorChange,
  onClose,
}: ColorPickerModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        background: "rgba(45,42,50,0.6)",
        backdropFilter: "blur(5px)",
      }}
    >
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
              color: "#664E44",
              fontWeight: 700,
            }}
          >
            Color Picker
          </h3>
          <p
            style={{
              fontFamily: "Nunito, sans-serif",
              fontSize: "0.8rem",
              color: "#A89888",
              marginTop: "2px",
            }}
          >
            Choose your color
          </p>

          {/* X button */}
          <motion.button
            onClick={onClose}
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

        {/* Color Picker */}
        <div className="p-6">
          <div className="flex flex-col items-center gap-4">
            <HexColorPicker
              color={color}
              onChange={onColorChange}
              style={{ width: "100%", maxWidth: 260 }}
            />
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full shrink-0"
                style={{
                  background: color,
                  border: "1.5px solid #E8D5C4",
                }}
              />
              <input
                value={color}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onColorChange(v);
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
                "#2D2A32",
                "#FF6B6B",
                "#4ECDC4",
                "#FFD166",
                "#06D6A0",
                "#6A0572",
                "#FF9F1C",
                "#2EC4B6",
                "#E71D36",
                "#011627",
              ].map((c) => (
                <button
                  key={c}
                  onClick={() => onColorChange(c)}
                  className="rounded-full"
                  style={{
                    width: color === c ? 24 : 20,
                    height: color === c ? 24 : 20,
                    background: c,
                    boxShadow:
                      color === c
                        ? `0 0 0 2.5px #FFFBF5, 0 0 0 4.5px ${c}`
                        : "none",
                    transition: "all 0.15s",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
