"use client";

import { AnimatePresence, motion } from "motion/react";
import useMeasure from "react-use-measure";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Trash } from "lucide-react";

const LABELS = ["Selbstständigkeit", "Genau"];

export default function ResizePage() {
  const [currentLabel, setCurrentLabel] = useState(0);
  const [currentIcon, setCurrentIcon] = useState(0);
  const [ref, bounds] = useMeasure();

  function changeLabel() {
    setCurrentLabel((prev) => (prev < LABELS.length - 1 ? prev + 1 : 0));
  }

  function changeIcon() {
    setCurrentIcon((prev) => (prev === 0 ? 1 : 0));
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <div
        className="flex w-fit gap-2 items-center select-none py-4 px-6 rounded-full shadow-sm bg-white"
        onClick={changeLabel}>
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <motion.div
          animate={{ width: bounds.width > 0 ? bounds.width : "auto" }}
          transition={{
            type: "spring",
            stiffness: 700,
            damping: 55,
          }}
          className="font-600 inline-block overflow-hidden"
        >
          <span ref={ref} className="inline-block whitespace-nowrap">
            {LABELS[currentLabel]}
          </span>
        </motion.div>
        <p>Okay</p>
      </div>
      <Button size="icon-lg" onClick={changeIcon}>
        <AnimatePresence mode="sync" initial={false}>
          <motion.span
            key={currentIcon}
            initial={{ opacity: 0, scale: 0.8, filter: "blur(5px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.8, filter: "blur(5px)" }}
            transition={{ type: "tween" }}
          >
            {currentIcon === 0 ? <Check /> : <Trash />}
          </motion.span>
        </AnimatePresence>
      </Button>
    </div>
  );
}
