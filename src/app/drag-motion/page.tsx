"use client";

import { motion } from "motion/react";
import { useRef } from "react";

export default function DragMotionPage() {
  const constraintsRef = useRef(null);
  return (
    <div className="flex h-screen w-screen">
      <div
        ref={constraintsRef}
        className="flex m-auto w-100 h-100 bg-violet-50 rounded-4xl"
      >
        <motion.div
          drag
          dragMomentum={false}
          dragTransition={{
            bounceStiffness: 500,
            bounceDamping: 30,
          }}
          dragConstraints={constraintsRef}
          className="m-auto bg-violet-500 rounded-2xl w-25 h-25"
        />
      </div>
    </div>
  );
}
