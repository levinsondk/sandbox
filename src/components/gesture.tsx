"use client";

import { motion } from "motion/react";

interface DragProps {
  play?: boolean;
  y?: "up" | "down";
  top?: number;
}

function Drag({ play = true, y = "up", top = 0 }: DragProps) {
  const direction = y === "up" ? -1 : 1;

  if (!play) return null;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ top }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [0, direction * 20, direction * 20, direction * 40],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatDelay: 0.5,
        ease: "easeInOut",
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="8" fill="rgba(0,0,0,0.2)" />
        <circle cx="12" cy="12" r="6" fill="rgba(255,255,255,0.8)" />
      </svg>
    </motion.div>
  );
}

export const Gesture = {
  Drag,
};
