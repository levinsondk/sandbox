"use client";

import { animate, motion, useMotionValue, useSpring } from "motion/react";
import React from "react";
import { Gesture } from "components/gesture";

const RECTANGLE_HEIGHT = 200;
const DEVICE_HEIGHT = 480;
const max = (DEVICE_HEIGHT - RECTANGLE_HEIGHT) / 2;

export function RubberBanding() {
  const [grabbing, setGrabbing] = React.useState(false);
  const [highlight, setHighlight] = React.useState(false);
  const y = useSpring(0, { stiffness: 300, damping: 25 });

  return (
    <div
      className="w-full max-w-[320px] mx-auto flex-center max-h-[640px] relative bg-gray4 rounded-32 transition-[box-shadow] duration-200 ease-in-out data-[highlight=true]:ring-2 data-[highlight=true]:ring-gray7 touch-none"
      style={{
        height: DEVICE_HEIGHT,
      }}
      data-highlight={highlight}
    >
      <motion.div
        className="w-[130px] flex-center rounded-24 cursor-grab relative bg-gradient-to-b from-yellow to-orange active:cursor-grabbing"
        style={{ y, height: RECTANGLE_HEIGHT }}
        onPanStart={() => {
          setGrabbing(true);
          grab.start();
        }}
        onPan={(_, { offset }) => {
          let newY = offset.y;

          if (newY > max || newY < -max) {
            setHighlight(true);
          } else {
            setHighlight(false);
          }

          newY = dampen(newY, [-max, max]);
          y.jump(newY);
        }}
        onPanEnd={() => {
          grab.end();
          setHighlight(false);
          y.set(0);
        }}
      >
        <Gesture.Drag play={!grabbing} y="up" top={-16} />
      </motion.div>
    </div>
  );
}

function dampen(val: number, [min, max]: [number, number]): number {
  if (val > max) {
    const extra = val - max;
    const dampenedExtra = extra > 0 ? Math.sqrt(extra) : -Math.sqrt(-extra);
    return max + dampenedExtra * 2;
  } else if (val < min) {
    const extra = val - min;
    const dampenedExtra = extra > 0 ? Math.sqrt(extra) : -Math.sqrt(-extra);
    return min + dampenedExtra * 2;
  } else {
    return val;
  }
}

const grab = {
  start: () => document.body.classList.add("gesture-grabbing"),
  end: () => document.body.classList.remove("gesture-grabbing"),
};
