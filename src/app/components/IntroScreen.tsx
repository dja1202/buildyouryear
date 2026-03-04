import { useEffect, useState } from "react";
import { motion } from "motion/react";

const YEAR = new Date().getFullYear();
const TAGLINE = "Draw your goals. Fill the board. Make this year count.";

interface IntroScreenProps {
  onComplete: () => void;
}

export function IntroScreen({ onComplete }: IntroScreenProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // Typing effect
  useEffect(() => {
    let currentIndex = 0;
    const typingSpeed = 35; // milliseconds per character
    const startDelay = 800; // delay before typing starts

    const startTyping = setTimeout(() => {
      const typingInterval = setInterval(() => {
        if (currentIndex < TAGLINE.length) {
          setDisplayedText(TAGLINE.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          setIsTypingComplete(true);
        }
      }, typingSpeed);

      return () => clearInterval(typingInterval);
    }, startDelay);

    return () => clearTimeout(startTyping);
  }, []);

  // Auto-transition after typing completes
  useEffect(() => {
    if (isTypingComplete) {
      const timer = setTimeout(onComplete, 1200); // Longer delay after typing for smoother transition
      return () => clearTimeout(timer);
    }
  }, [isTypingComplete, onComplete]);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #FFF8F0 0%, #FFF0E8 100%)" }}
    >
      {/* Subtle background dots */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.06 }}>
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 6 + 2,
              height: Math.random() * 6 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: "#dba1a2",
            }}
          />
        ))}
      </div>

      <div className="text-center px-8 relative z-10">
        <div
          style={{
            fontFamily: "'Coming Soon', cursive",
            color: "#664E44",
            letterSpacing: "0.01em",
            lineHeight: 1.3,
          }}
        >
          {/* Main title - larger */}
          <motion.div
            style={{ fontSize: "clamp(2.5rem, 9vw, 5rem)", marginBottom: "0.5rem" }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: [0, 1, 1, 1], y: [30, 0, 0, 0] }}
            transition={{
              duration: 4.5,
              times: [0, 0.15, 0.65, 1],
              ease: "easeInOut",
            }}
          >
            {YEAR} Bingo
          </motion.div>
          
          {/* Subtitle - typing effect with slide right and fade */}
          <motion.div
            style={{ 
              fontSize: "clamp(1.2rem, 4vw, 2rem)", 
              color: "#5A5560",
              minHeight: "clamp(2.4rem, 8vw, 4rem)", // Prevent layout shift during typing
            }}
            initial={{ opacity: 0, x: 0 }}
            animate={{ 
              opacity: isTypingComplete ? [1, 1, 0] : 1, 
              x: isTypingComplete ? [0, 0, 100] : 0 
            }}
            transition={{
              duration: isTypingComplete ? 1.5 : 0.3,
              times: isTypingComplete ? [0, 0.5, 1] : undefined,
              ease: "easeInOut",
            }}
          >
            {displayedText}
            {!isTypingComplete && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 2.0, repeat: Infinity, repeatType: "reverse" }}
                style={{ display: "inline-block", marginLeft: "2px" }}
              >
                |
              </motion.span>
            )}
          </motion.div>
        </div>

        <motion.div
          className="mt-6 flex justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1, 1, 0] }}
          transition={{ duration: 4.5, times: [0, 0.3, 0.5, 0.75, 1] }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              className="rounded-sm"
              style={{
                width: 18,
                height: 18,
                background: i === 2 ? "#FF6B6B" : "#E8D5C4",
                opacity: 0.7,
              }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{
                duration: 1.2,
                delay: i * 0.12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}