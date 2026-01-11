import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Splash Generator | lvnsn sndbx",
  description: "Create parametric splash-like star shapes with sharp outer points and curved inner valleys",
};

"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

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
}

function generateSplashPath(
  cx: number,
  cy: number,
  config: SplashConfig
): string {
  const { numPoints, outerRadius, innerRadius, radiusVariance, angleVariance, seed } = config;
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

  // Build SVG path using quadratic Bézier curves
  let d = `M ${points[0].outer.x.toFixed(2)} ${points[0].outer.y.toFixed(2)}`;
  for (let i = 0; i < numPoints; i++) {
    const next = (i + 1) % numPoints;
    d += ` Q ${points[i].inner.x.toFixed(2)} ${points[i].inner.y.toFixed(2)} ${points[next].outer.x.toFixed(2)} ${points[next].outer.y.toFixed(2)}`;
  }
  d += " Z";

  return d;
}

const PRESET_COLORS = [
  { fill: "#FF6B6B", bg: "#FFF0F0", name: "Coral" },
  { fill: "#4ECDC4", bg: "#E8FAF8", name: "Teal" },
  { fill: "#FFE66D", bg: "#FFFCE8", name: "Yellow" },
  { fill: "#95E1D3", bg: "#F0FBF9", name: "Mint" },
  { fill: "#DDA0DD", bg: "#FAF0FA", name: "Plum" },
  { fill: "#FF8C42", bg: "#FFF4EC", name: "Orange" },
  { fill: "#6C5CE7", bg: "#F0EFFC", name: "Purple" },
  { fill: "#00B894", bg: "#E6F9F4", name: "Emerald" },
  { fill: "#262626", bg: "#F5F5F5", name: "Charcoal" },
  { fill: "#E17055", bg: "#FCF0ED", name: "Terracotta" },
];

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
  }));

  const [colorIndex, setColorIndex] = useState(0);
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

  const updateConfig = useCallback((key: keyof SplashConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const path = generateSplashPath(CENTER, CENTER, config);
  const currentColor = PRESET_COLORS[colorIndex];

  const svgCode = `<svg width="${SVG_SIZE}" height="${SVG_SIZE}" viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="${path}" fill="${currentColor.fill}"/>
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
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Splash Generator</h1>
          <p className="text-muted-foreground">
            Create parametric splash-like star shapes with sharp outer points and curved inner valleys.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview */}
          <div className="order-1 lg:order-2">
            <div
              className="rounded-2xl p-8 flex items-center justify-center transition-colors duration-300"
              style={{ backgroundColor: currentColor.bg }}
            >
              <svg
                width={SVG_SIZE}
                height={SVG_SIZE}
                viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
                className="w-full h-auto max-w-[400px]"
              >
                <path
                  d={path}
                  fill={currentColor.fill}
                  className="transition-all duration-150"
                />
              </svg>
            </div>

            {/* Color Palette */}
            <div className="mt-4">
              <Label className="text-sm font-medium mb-2 block">Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color, index) => (
                  <button
                    key={color.name}
                    onClick={() => setColorIndex(index)}
                    className={`w-8 h-8 rounded-full transition-all duration-200 ${
                      index === colorIndex
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.fill }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={regenerate} className="flex-1 min-w-[120px]">
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
              <Button onClick={copyToClipboard} variant="outline" className="flex-1 min-w-[120px]">
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
              <Button onClick={copyPathOnly} variant="outline" className="flex-1 min-w-[120px]">
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

          {/* Controls */}
          <div className="order-2 lg:order-1 space-y-6">
            <div className="bg-card rounded-xl p-6 border shadow-sm space-y-6">
              <h2 className="font-semibold text-lg">Shape Parameters</h2>
              
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

            {/* Presets */}
            <div className="bg-card rounded-xl p-6 border shadow-sm">
              <h2 className="font-semibold text-lg mb-4">Quick Presets</h2>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfig((prev) => ({
                    ...prev,
                    numPoints: 6,
                    outerRadius: 160,
                    innerRadius: 60,
                    radiusVariance: 0.2,
                    angleVariance: 0.3,
                  }))}
                >
                  Star Burst
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfig((prev) => ({
                    ...prev,
                    numPoints: 12,
                    outerRadius: 140,
                    innerRadius: 100,
                    radiusVariance: 0.4,
                    angleVariance: 0.5,
                  }))}
                >
                  Soft Splash
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfig((prev) => ({
                    ...prev,
                    numPoints: 8,
                    outerRadius: 170,
                    innerRadius: 50,
                    radiusVariance: 0.1,
                    angleVariance: 0.1,
                  }))}
                >
                  Clean Star
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfig((prev) => ({
                    ...prev,
                    numPoints: 10,
                    outerRadius: 150,
                    innerRadius: 70,
                    radiusVariance: 0.5,
                    angleVariance: 0.6,
                  }))}
                >
                  Wild Splash
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery - show multiple variations */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Variations</h2>
          <p className="text-muted-foreground mb-6">
            Same parameters, different seeds
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }, (_, i) => {
              const variationSeed = config.seed + i + 1;
              const variationPath = generateSplashPath(CENTER, CENTER, {
                ...config,
                seed: variationSeed,
              });
              return (
                <button
                  key={i}
                  onClick={() => setConfig((prev) => ({ ...prev, seed: variationSeed }))}
                  className="aspect-square rounded-xl p-4 transition-all hover:scale-105 hover:shadow-lg border bg-card"
                  style={{ backgroundColor: currentColor.bg }}
                >
                  <svg
                    viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
                    className="w-full h-full"
                  >
                    <path d={variationPath} fill={currentColor.fill} />
                  </svg>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
