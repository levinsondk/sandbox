"use client";

import { useState } from "react";

export default function SplashPage() {
  const boxSize = 500;
  const centerX = boxSize / 2;
  const centerY = boxSize / 2;
  const radius = 250;
  const pointCount = 5;
  const angleStep = (Math.PI * 2) / pointCount;

  const angleForPoint = (pointIndex: number) => {
    return pointIndex * angleStep;
  };

  const pointCoordinates = (pointIndex: number) => {
    const angle = angleForPoint(pointIndex);
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { x, y };
  };

  const pointsHtml = Array.from({ length: pointCount }, (_, i) => {
    const coords = pointCoordinates(i);
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: coords.x,
          top: coords.y,
          backgroundColor: "red",
          width: 8,
          height: 8,
          borderRadius: "50%",
          transform: "translate(-50%, -50%)", // Center the dot on the point
        }}
      />
    );
  });

  function getPathString() {
    let coords: ReturnType<typeof pointCoordinates>[] = [];
    for (let i = 0; i < pointCount; i++) {
      coords.push(pointCoordinates(i));
    }
    const pathString = "M x y A 20 20 0 0 0 x y A...";
  }

  //   ============

  const g = document.querySelector("#reference");
  const svg = document.querySelector("svg");
  const button = document.querySelector("button");

  // prettier-ignore
  const points = [
  [[10, 10], [20, 20], [40, 20], [50, 10]],
  [[70, 10], [70, 20], [110, 20], [110, 10]],
  [[130, 10], [120, 20], [180, 20], [170, 10]],
  [[10, 60], [20, 80], [40, 80], [50, 60]],
  [[70, 60], [70, 80], [110, 80], [110, 60]],
  [[130, 60], [120, 80], [180, 80], [170, 60]],
  [[10, 110], [20, 140], [40, 140], [50, 110]],
  [[70, 110], [70, 140], [110, 140], [110, 110]],
  [[130, 110], [120, 140], [180, 140], [170, 110]],
];

  for (const curvePoints of points) {
    for (const p of curvePoints) {
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      circle.setAttribute("cx", p[0].toString());
      circle.setAttribute("cy", p[1].toString());
      circle.setAttribute("r", (1.5).toString());
      circle.setAttribute("fill", "red");
      g?.appendChild(circle);
    }
    const line1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    line1.setAttribute("x1", curvePoints[0][0].toString());
    line1.setAttribute("y1", curvePoints[0][1].toString());
    line1.setAttribute("x2", curvePoints[1][0].toString());
    line1.setAttribute("y2", curvePoints[1][1].toString());
    line1.setAttribute("stroke", "red");
    g?.appendChild(line1);
    const line2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    line2.setAttribute("x1", curvePoints[2][0].toString());
    line2.setAttribute("y1", curvePoints[2][1].toString());
    line2.setAttribute("x2", curvePoints[3][0].toString());
    line2.setAttribute("y2", curvePoints[3][1].toString());
    line2.setAttribute("stroke", "red");
    g?.appendChild(line2);
  }

  const [isHidden, setIsHidden] = useState(true);
  button?.addEventListener("click", () => {
    isHidden = !isHidden;
    if (isHidden) {
      svg?.querySelector("#reference")?.remove();
    } else {
      const clonedNode = g?.cloneNode(true);
      if (clonedNode) {
        svg?.appendChild(clonedNode);
      }
    }
  });

  return (
    <div className="flex gap-4 min-h-screen min-w-screen justify-center items-center">
      <svg width="190" height="160" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M 10 10 C 20 20, 40 20, 50 10"
          stroke="black"
          fill="transparent"
        />
        <path
          d="M 70 10 C 70 20, 110 20, 110 10"
          stroke="black"
          fill="transparent"
        />
        <path
          d="M 130 10 C 120 20, 180 20, 170 10"
          stroke="black"
          fill="transparent"
        />
        <path
          d="M 10 60 C 20 80, 40 80, 50 60"
          stroke="black"
          fill="transparent"
        />
        <path
          d="M 70 60 C 70 80, 110 80, 110 60"
          stroke="black"
          fill="transparent"
        />
        <path
          d="M 130 60 C 120 80, 180 80, 170 60"
          stroke="black"
          fill="transparent"
        />
        <path
          d="M 10 110 C 20 140, 40 140, 50 110"
          stroke="black"
          fill="transparent"
        />
        <path
          d="M 70 110 C 70 140, 110 140, 110 110"
          stroke="black"
          fill="transparent"
        />
        <path
          d="M 130 110 C 120 140, 180 140, 170 110"
          stroke="black"
          fill="transparent"
        />
      </svg>
      <svg style={{ display: "none" }} xmlns="http://www.w3.org/2000/svg">
        <g id="reference"></g>
      </svg>
      <button onClick={() => }>Show/hide reference points and lines</button>
    </div>
  );
}
