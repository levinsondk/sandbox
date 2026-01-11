"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Mulberry32 PRNG for seeded randomness
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hook to safely check if we're on the client
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

interface SplashConfig {
  numPoints: number;
  outerRadius: number;
  innerRadius: number;
  radiusVariance: number;
  angleVariance: number;
  seed: number;
  color: string;
  useStraightLines: boolean;
  innerCornerRadius: number;
  outerCornerRadius: number;
}

function generateSplashPath(
  cx: number,
  cy: number,
  config: SplashConfig
): string {
  const {
    numPoints,
    outerRadius,
    innerRadius,
    radiusVariance,
    angleVariance,
    seed,
    useStraightLines,
    innerCornerRadius,
    outerCornerRadius
  } = config;
  const random = mulberry32(seed);

  const points: { outer: { x: number; y: number }; inner: { x: number; y: number } }[] = [];

  for (let i = 0; i < numPoints; i++) {
    const baseAngle = (i / numPoints) * Math.PI * 2;
    const midAngle = ((i + 0.5) / numPoints) * Math.PI * 2;

    // Add angular jitter
    const outerAngle =
      baseAngle + (random() - 0.5) * angleVariance * (Math.PI / numPoints);
    const innerAngle =
      midAngle + (random() - 0.5) * angleVariance * (Math.PI / numPoints);

    // Add radius jitter
    const outerR = outerRadius * (1 + (random() - 0.5) * radiusVariance);
    const innerR = innerRadius * (1 + (random() - 0.5) * radiusVariance);

    points.push({
      outer: {
        x: cx + Math.cos(outerAngle) * outerR,
        y: cy + Math.sin(outerAngle) * outerR,
      },
      inner: {
        x: cx + Math.cos(innerAngle) * innerR,
        y: cy + Math.sin(innerAngle) * innerR,
      },
    });
  }

  if (useStraightLines) {
    // Straight lines mode: alternate between outer and inner points
    // Create path with corner rounding
    const allPoints: Array<{ x: number; y: number; radius: number }> = [];
    for (let i = 0; i < numPoints; i++) {
      allPoints.push({ ...points[i].outer, radius: outerCornerRadius });
      allPoints.push({ ...points[i].inner, radius: innerCornerRadius });
    }

    if (innerCornerRadius === 0 && outerCornerRadius === 0) {
      // No corner rounding - simple straight lines
      let d = `M ${allPoints[0].x.toFixed(2)} ${allPoints[0].y.toFixed(2)}`;
      for (let i = 1; i < allPoints.length; i++) {
        d += ` L ${allPoints[i].x.toFixed(2)} ${allPoints[i].y.toFixed(2)}`;
      }
      d += " Z";
      return d;
    } else {
      // With corner rounding
      return buildRoundedPath(allPoints);
    }
  } else {
    // Curved mode using quadratic Bézier curves
    if (outerCornerRadius === 0) {
      // Original behavior
      let d = `M ${points[0].outer.x.toFixed(2)} ${points[0].outer.y.toFixed(2)}`;
      for (let i = 0; i < numPoints; i++) {
        const next = (i + 1) % numPoints;
        d += ` Q ${points[i].inner.x.toFixed(2)} ${points[i].inner.y.toFixed(2)} ${points[next].outer.x.toFixed(2)} ${points[next].outer.y.toFixed(2)}`;
      }
      d += " Z";
      return d;
    } else {
      // With corner rounding at outer points
      const outerPoints = points.map(p => ({ ...p.outer, radius: outerCornerRadius }));
      let d = "";

      for (let i = 0; i < numPoints; i++) {
        const next = (i + 1) % numPoints;
        const curr = points[i];
        const nextPt = points[next];

        if (i === 0) {
          // Start at first outer point
          d = `M ${curr.outer.x.toFixed(2)} ${curr.outer.y.toFixed(2)}`;
        }

        // Curve through inner point to next outer point
        d += ` Q ${curr.inner.x.toFixed(2)} ${curr.inner.y.toFixed(2)} ${nextPt.outer.x.toFixed(2)} ${nextPt.outer.y.toFixed(2)}`;
      }
      d += " Z";
      return d;
    }
  }
}

// Helper function to build a path with rounded corners
function buildRoundedPath(points: Array<{ x: number; y: number; radius: number }>): string {
  if (points.length < 3) return "";

  let d = "";
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    const radius = Math.min(curr.radius,
      distance(curr, prev) / 2,
      distance(curr, next) / 2
    );

    if (radius > 0) {
      // Calculate the points where the corner rounding starts and ends
      const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
      const v2 = { x: next.x - curr.x, y: next.y - curr.y };
      const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

      const p1 = {
        x: curr.x + (v1.x / len1) * radius,
        y: curr.y + (v1.y / len1) * radius,
      };
      const p2 = {
        x: curr.x + (v2.x / len2) * radius,
        y: curr.y + (v2.y / len2) * radius,
      };

      if (i === 0) {
        d = `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
      } else {
        d += ` L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
      }

      // Quadratic curve through the corner point
      d += ` Q ${curr.x.toFixed(2)} ${curr.y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    } else {
      if (i === 0) {
        d = `M ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
      } else {
        d += ` L ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
      }
    }
  }

  d += " Z";
  return d;
}

function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

const SVG_SIZE = 400;
const CENTER = SVG_SIZE / 2;

interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

function SliderControl({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit = "",
}: SliderControlProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-sm text-muted-foreground font-mono">
          {value.toFixed(step < 1 ? 2 : 0)}{unit}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  );
}

// Generate initial seed - this will be consistent per session
const getInitialSeed = () => Math.floor(Math.random() * 1000000);

export default function SplashPage() {
  const isClient = useIsClient();

  const [config, setConfig] = useState<SplashConfig>(() => ({
    numPoints: 8,
    outerRadius: 150,
    innerRadius: 70,
    radiusVariance: 0.3,
    angleVariance: 0.4,
    seed: 12345, // Default seed for SSR
    color: "#FF6B6B",
    useStraightLines: false,
    innerCornerRadius: 0,
    outerCornerRadius: 0,
  }));

  const [initialSeedSet, setInitialSeedSet] = useState(false);

  // Set random seed on first client render only
  if (isClient && !initialSeedSet) {
    setConfig((prev) => ({ ...prev, seed: getInitialSeed() }));
    setInitialSeedSet(true);
  }

  const regenerate = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      seed: Math.floor(Math.random() * 1000000),
    }));
  }, []);

  const updateConfig = useCallback((key: keyof SplashConfig, value: number | string | boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const path = generateSplashPath(CENTER, CENTER, config);

  const svgCode = `<svg width="${SVG_SIZE}" height="${SVG_SIZE}" viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="${path}" fill="${config.color}"/>
</svg>`;

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(svgCode);
  }, [svgCode]);

  const copyPathOnly = useCallback(() => {
    navigator.clipboard.writeText(path);
  }, [path]);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      {/* Top Third - Fixed Preview */}
      <div className="h-1/3 flex items-center justify-center bg-muted/20 border-b">
        <svg
          width={SVG_SIZE}
          height={SVG_SIZE}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="w-full h-full max-w-[300px] max-h-[300px] p-4"
        >
          <path
            d={path}
            fill={config.color}
            className="transition-all duration-150"
          />
        </svg>
      </div>

      {/* Middle - Scrollable Settings */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Color Picker */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Splash Color</Label>
              <span className="text-sm text-muted-foreground font-mono">
                {config.color}
              </span>
            </div>
            <input
              type="color"
              value={config.color}
              onChange={(e) => updateConfig("color", e.target.value)}
              className="w-full h-12 rounded-md cursor-pointer border"
            />
          </div>

          <SliderControl
            label="Number of Points"
            value={config.numPoints}
            onChange={(v) => updateConfig("numPoints", v)}
            min={3}
            max={20}
            step={1}
          />

          <SliderControl
            label="Outer Radius"
            value={config.outerRadius}
            onChange={(v) => updateConfig("outerRadius", v)}
            min={50}
            max={190}
            step={1}
            unit="px"
          />

          <SliderControl
            label="Inner Radius"
            value={config.innerRadius}
            onChange={(v) => updateConfig("innerRadius", v)}
            min={20}
            max={150}
            step={1}
            unit="px"
          />

          <div className="pt-2 border-t">
            <h3 className="font-medium text-sm mb-3 text-muted-foreground">Shape Mode</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Line Style</Label>
                <ToggleGroup
                  type="single"
                  value={config.useStraightLines ? "straight" : "curved"}
                  onValueChange={(value) => {
                    if (value) updateConfig("useStraightLines", value === "straight");
                  }}
                  className="w-full justify-start"
                  variant="outline"
                  spacing={0}
                >
                  <ToggleGroupItem value="curved" className="flex-1">
                    Curved
                  </ToggleGroupItem>
                  <ToggleGroupItem value="straight" className="flex-1">
                    Straight
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {config.useStraightLines && (
                <>
                  <SliderControl
                    label="Outer Corner Radius"
                    value={config.outerCornerRadius}
                    onChange={(v) => updateConfig("outerCornerRadius", v)}
                    min={0}
                    max={30}
                    step={1}
                    unit="px"
                  />

                  <SliderControl
                    label="Inner Corner Radius"
                    value={config.innerCornerRadius}
                    onChange={(v) => updateConfig("innerCornerRadius", v)}
                    min={0}
                    max={30}
                    step={1}
                    unit="px"
                  />
                </>
              )}

              {!config.useStraightLines && config.outerCornerRadius === 0 && (
                <p className="text-xs text-muted-foreground">
                  Curved mode uses smooth Bézier curves between points
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t">
            <h3 className="font-medium text-sm mb-4 text-muted-foreground">Randomness</h3>

            <div className="space-y-6">
              <SliderControl
                label="Radius Variance"
                value={config.radiusVariance}
                onChange={(v) => updateConfig("radiusVariance", v)}
                min={0}
                max={1}
                step={0.01}
              />

              <SliderControl
                label="Angle Variance"
                value={config.angleVariance}
                onChange={(v) => updateConfig("angleVariance", v)}
                min={0}
                max={1}
                step={0.01}
              />
            </div>
          </div>

          <div className="pt-2 border-t">
            <h3 className="font-medium text-sm mb-4 text-muted-foreground">Seed</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={config.seed}
                onChange={(e) => updateConfig("seed", parseInt(e.target.value) || 0)}
                className="flex-1 h-9 px-3 rounded-md border bg-background text-sm font-mono"
              />
              <Button variant="outline" size="sm" onClick={regenerate}>
                Random
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Same seed + same parameters = same shape
            </p>
          </div>

          {/* Ratio Info */}
          <div className="bg-muted/50 rounded-xl p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Outer/Inner Ratio</span>
              <span className="font-mono font-medium">
                {(config.outerRadius / config.innerRadius).toFixed(2)}:1
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Higher ratio = sharper points. Try 2:1 to 3:1 for classic splash look.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom - Fixed Action Buttons */}
      <div className="border-t bg-background p-4">
        <div className="max-w-md mx-auto flex gap-2">
          <Button onClick={regenerate} className="flex-1">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Regenerate
          </Button>
          <Button onClick={copyToClipboard} variant="outline" className="flex-1">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy SVG
          </Button>
          <Button onClick={copyPathOnly} variant="outline" className="flex-1">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            Copy Path
          </Button>
        </div>
      </div>
    </div>
  );
}
