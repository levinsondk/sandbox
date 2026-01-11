import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SVG Arc Visualizer | lvnsn sndbx",
  description: "Interactive tool for understanding and experimenting with SVG arc paths",
};

"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";

function getExtendedLine({
  x1,
  y1,
  x2,
  y2,
  extent,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  extent: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;

  return `M ${x1 - dx * extent} ${y1 - dy * extent} L ${x2 + dx * extent} ${
    y2 + dy * extent
  }`;
}

export default function SplashPage() {
  const [largeArcFlag, setLargeArcFlag] = useState(false);
  const [sweepFlag, setSweepFlag] = useState(false);
  const [startX, setStartX] = useState(150);
  const [startY, setStartY] = useState(200);
  const [endX, setEndX] = useState(350);
  const [endY, setEndY] = useState(300);
  const [radX, setRadX] = useState(120);
  const [radY, setRadY] = useState(170);
  const [rotation, setRotation] = useState(45);
  const [boxSize, setBoxSize] = useState(500);

  return (
    <div className="flex gap-4 min-h-screen min-w-screen justify-center items-center">
      <div className="flex flex-col gap-4 w-56">
        <div className="flex flex-col gap-2">
          <Label htmlFor="startX">
            Start X<div className="ml-auto">{startX}</div>
          </Label>
          <Slider
            id="startX"
            defaultValue={[startX]}
            max={boxSize}
            step={1}
            onValueChange={(value) => setStartX(value[0])}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="startY">
            Start Y<div className="ml-auto">{startY}</div>
          </Label>
          <Slider
            id="startY"
            defaultValue={[startY]}
            max={boxSize}
            step={1}
            onValueChange={(value) => setStartY(value[0])}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="endX">
            End X<div className="ml-auto">{endX}</div>
          </Label>
          <Slider
            id="endX"
            defaultValue={[endX]}
            max={boxSize}
            step={1}
            onValueChange={(value) => setEndX(value[0])}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="endY">
            End Y<div className="ml-auto">{endY}</div>
          </Label>
          <Slider
            id="endY"
            defaultValue={[endY]}
            max={boxSize}
            step={1}
            onValueChange={(value) => setEndY(value[0])}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="radX">
            Radius X<div className="ml-auto">{radX}</div>
          </Label>
          <Slider
            id="radX"
            defaultValue={[radX]}
            max={boxSize / 2}
            step={1}
            onValueChange={(value) => setRadX(value[0])}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="radY">
            Radius Y<div className="ml-auto">{radY}</div>
          </Label>
          <Slider
            id="radY"
            defaultValue={[radY]}
            max={boxSize / 2}
            step={1}
            onValueChange={(value) => setRadY(value[0])}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="rotation">
            Rotation<div className="ml-auto">{rotation}°</div>
          </Label>
          <Slider
            id="rotation"
            defaultValue={[rotation]}
            min={-360}
            max={360}
            step={1}
            onValueChange={(value) => setRotation(value[0])}
          />
        </div>
        <div className="flex gap-2 mt-2">
          <Toggle
            variant={"outline"}
            pressed={largeArcFlag}
            onPressedChange={setLargeArcFlag}
            className="flex-1"
          >
            Large Arc
          </Toggle>
          <Toggle
            variant={"outline"}
            pressed={sweepFlag}
            onPressedChange={setSweepFlag}
            className="flex-1"
          >
            Sweep
          </Toggle>
        </div>
      </div>
      <div className="relative border-2 border-black">
        <svg
          width={boxSize}
          height={boxSize}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={`M ${startX} ${startY}
         A ${radX} ${radY} ${rotation} 0 0 ${endX} ${endY} M ${startX} ${startY}
         A ${radX} ${radY} ${rotation} 1 0 ${endX} ${endY} M ${startX} ${startY}
         A ${radX} ${radY} ${rotation} 1 1 ${endX} ${endY} M ${startX} ${startY}
         A ${radX} ${radY} ${rotation} 0 1 ${endX} ${endY}`}
            stroke="red"
            strokeWidth="1"
            fill="transparent"
          />

          <path
            d={`M ${startX} ${startY}
         A ${radX} ${radY} ${rotation} ${largeArcFlag ? 1 : 0} ${
              sweepFlag ? 1 : 0
            } ${endX} ${endY}`}
            stroke="black"
            fill="green"
            strokeWidth="2"
            fillOpacity="0.2"
          />
          <path
            d={getExtendedLine({
              x1: startX,
              y1: startY,
              x2: endX,
              y2: endY,
              extent: 200,
            })}
            stroke="red"
            strokeWidth="1"
          />
        </svg>
      </div>
    </div>
  );
}
