"use client";

import { useState, useRef, useCallback, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useWebGL,
  PixelationUniforms,
  DitheringUniforms,
  ChromaticUniforms,
  GridUniforms,
} from "./use-webgl";
import { ShaderEffect } from "./shaders";
import { downloadShaderZip } from "./export-shader";

interface TooltipInfo {
  description: string;
  technical: string;
}

function InfoTooltip({ description, technical }: TooltipInfo) {
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 space-y-1.5">
        <p className="text-xs font-medium">{description}</p>
        <p className="text-xs opacity-70">{technical}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Hook to safely check if we're on the client
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
  tooltip?: TooltipInfo;
}

function SliderControl({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit = "",
  tooltip,
}: SliderControlProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <Label className="text-sm font-medium">{label}</Label>
          {tooltip && (
            <InfoTooltip
              description={tooltip.description}
              technical={tooltip.technical}
            />
          )}
        </div>
        <span className="text-sm text-muted-foreground font-mono">
          {value.toFixed(step < 1 ? 2 : 0)}
          {unit}
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

// Helper functions for color conversion
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
    ];
  }
  return [0, 0, 0];
}

const defaultPixelationUniforms: PixelationUniforms = {
  pixelSize: 8,
  colorDepth: 32,
  smoothing: 0,
  binaryMode: false,
  blackThreshold: 0.0,
  whiteThreshold: 0.5,
  fillColor: [0, 0, 0],
  dualColorMode: false,
  color1: [0, 0, 0],
  color2: [1, 1, 1],
  luminanceThreshold: 0.5,
};

const defaultDitheringUniforms: DitheringUniforms = {
  threshold: 1,
  scale: 1,
  ditherType: 0,
  colorMode: 1,
};

const defaultChromaticUniforms: ChromaticUniforms = {
  offsetAmount: 5,
  angle: 0,
  scanlines: false,
  scanlineIntensity: 0.3,
  noiseAmount: 0,
};

const defaultGridUniforms: GridUniforms = {
  cellSize: 16,
  xSpread: 0.2,
  ySpread: 0.2,
  rotation: 0,
  xOffset: 0,
  yOffset: 0,
  shapeType: 0,
  dualColorMode: false,
  color1: [0, 0, 0],
  color2: [1, 1, 1],
  luminanceThreshold: 0.5,
};

export default function ShaderPage() {
  const isClient = useIsClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [effect, setEffect] = useState<ShaderEffect>("pixelation");
  const [blackBackground, setBlackBackground] = useState(false);

  const [pixelationUniforms, setPixelationUniforms] = useState(
    defaultPixelationUniforms
  );
  const [ditheringUniforms, setDitheringUniforms] = useState(
    defaultDitheringUniforms
  );
  const [chromaticUniforms, setChromaticUniforms] = useState(
    defaultChromaticUniforms
  );
  const [gridUniforms, setGridUniforms] = useState(defaultGridUniforms);

  const currentUniforms =
    effect === "pixelation"
      ? pixelationUniforms
      : effect === "dithering"
      ? ditheringUniforms
      : effect === "chromatic"
      ? chromaticUniforms
      : gridUniforms;

  const { isReady, downloadImage } = useWebGL(
    canvasRef,
    image,
    effect,
    currentUniforms
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const img = new Image();
      img.onload = () => {
        setImage(img);
      };
      img.src = URL.createObjectURL(file);
    },
    []
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;

    const img = new Image();
    img.onload = () => {
      setImage(img);
    };
    img.src = URL.createObjectURL(file);
  }, []);

  const resetEffect = useCallback(() => {
    if (effect === "pixelation") {
      setPixelationUniforms(defaultPixelationUniforms);
    } else if (effect === "dithering") {
      setDitheringUniforms(defaultDitheringUniforms);
    } else if (effect === "chromatic") {
      setChromaticUniforms(defaultChromaticUniforms);
    } else {
      setGridUniforms(defaultGridUniforms);
    }
  }, [effect]);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      {/* Top - Preview Area */}
      <div
        className={`h-2/5 flex items-center justify-center border-b relative ${
          blackBackground ? "bg-black" : "bg-muted/20"
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {!image ? (
          <div
            className="flex flex-col items-center justify-center gap-4 p-8 text-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-foreground">Drop an image here</p>
              <p className="text-sm text-muted-foreground">
                or click to browse
              </p>
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain"
            style={{
              width: image ? Math.min(image.naturalWidth, 600) : undefined,
              height: image ? Math.min(image.naturalHeight, 300) : undefined,
            }}
          />
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        {image && (
          <button
            onClick={() => setBlackBackground(!blackBackground)}
            className={`absolute bottom-3 left-1/2 -translate-x-1/2 p-2 rounded-lg border transition-colors ${
              blackBackground
                ? "bg-neutral-800/80 hover:bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200"
                : "bg-background/80 hover:bg-background border-border text-muted-foreground hover:text-foreground"
            }`}
            title={blackBackground ? "Light background" : "Dark background"}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M12 2a10 10 0 0 1 0 20V2z" fill="currentColor" />
            </svg>
          </button>
        )}
      </div>

      {/* Tab Bar */}
      <div className="border-b bg-background px-4 py-3">
        <ToggleGroup
          type="single"
          value={effect}
          onValueChange={(value) => {
            if (value) setEffect(value as ShaderEffect);
          }}
          className="w-full max-w-md mx-auto justify-center"
          variant="outline"
          spacing={0}
        >
          <ToggleGroupItem value="pixelation" className="flex-1">
            Pixelation
          </ToggleGroupItem>
          <ToggleGroupItem value="dithering" className="flex-1">
            Dithering
          </ToggleGroupItem>
          <ToggleGroupItem value="chromatic" className="flex-1">
            Chromatic
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" className="flex-1">
            Grid
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Middle - Scrollable Controls */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-md mx-auto space-y-6">
          {!image && (
            <div className="text-center text-muted-foreground py-8">
              <p>Upload an image to start applying effects</p>
            </div>
          )}

          {image && effect === "pixelation" && (
            <>
              <SliderControl
                label="Pixel Size"
                value={pixelationUniforms.pixelSize}
                onChange={(v) =>
                  setPixelationUniforms((prev) => ({ ...prev, pixelSize: v }))
                }
                min={1}
                max={50}
                step={1}
                unit="px"
                tooltip={{
                  description:
                    "Makes pixels bigger — higher values create a more chunky, retro look.",
                  technical:
                    "Downsamples UV coordinates by dividing into blocks of this size.",
                }}
              />

              {/* Color Mode Toggle */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Color Mode</Label>
                  <InfoTooltip
                    description="Normal keeps original colors, Binary outputs one color or transparent, Dual Color maps pixels to two colors based on brightness."
                    technical="Binary uses luminance thresholds for alpha. Dual Color maps luminance to one of two colors."
                  />
                </div>
                <ToggleGroup
                  type="single"
                  value={
                    pixelationUniforms.dualColorMode
                      ? "dual"
                      : pixelationUniforms.binaryMode
                      ? "binary"
                      : "normal"
                  }
                  onValueChange={(value) => {
                    if (value)
                      setPixelationUniforms((prev) => ({
                        ...prev,
                        binaryMode: value === "binary",
                        dualColorMode: value === "dual",
                      }));
                  }}
                  className="w-full justify-start"
                  variant="outline"
                  spacing={0}
                >
                  <ToggleGroupItem value="normal" className="flex-1">
                    Normal
                  </ToggleGroupItem>
                  <ToggleGroupItem value="binary" className="flex-1">
                    Binary
                  </ToggleGroupItem>
                  <ToggleGroupItem value="dual" className="flex-1">
                    Dual Color
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Binary Mode Controls */}
              {pixelationUniforms.binaryMode && (
                <div className="pt-2 border-t space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Threshold Controls
                  </h3>
                  <SliderControl
                    label="Black Point"
                    value={pixelationUniforms.blackThreshold}
                    onChange={(v) =>
                      setPixelationUniforms((prev) => ({
                        ...prev,
                        blackThreshold: v,
                      }))
                    }
                    min={0}
                    max={1}
                    step={0.01}
                    tooltip={{
                      description:
                        "Pixels darker than this become transparent — increase to remove dark areas.",
                      technical:
                        "Luminance below this threshold results in alpha = 0.",
                    }}
                  />
                  <SliderControl
                    label="White Point"
                    value={pixelationUniforms.whiteThreshold}
                    onChange={(v) =>
                      setPixelationUniforms((prev) => ({
                        ...prev,
                        whiteThreshold: v,
                      }))
                    }
                    min={0}
                    max={1}
                    step={0.01}
                    tooltip={{
                      description:
                        "Pixels lighter than this become transparent — decrease to remove bright areas.",
                      technical:
                        "Luminance above this threshold results in alpha = 0.",
                    }}
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-sm font-medium">Fill Color</Label>
                      <InfoTooltip
                        description="The color used for filled pixels — choose any color from the picker."
                        technical="Replaces RGB channels for all visible pixels; alpha is determined by thresholds."
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={rgbToHex(...pixelationUniforms.fillColor)}
                        onChange={(e) =>
                          setPixelationUniforms((prev) => ({
                            ...prev,
                            fillColor: hexToRgb(e.target.value),
                          }))
                        }
                        className="w-10 h-10 rounded-lg border border-input cursor-pointer"
                      />
                      <input
                        type="text"
                        value={rgbToHex(
                          ...pixelationUniforms.fillColor
                        ).toUpperCase()}
                        onChange={(e) => {
                          const hex = e.target.value;
                          if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                            setPixelationUniforms((prev) => ({
                              ...prev,
                              fillColor: hexToRgb(hex),
                            }));
                          }
                        }}
                        className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm font-mono"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Dual Color Mode Controls */}
              {pixelationUniforms.dualColorMode && (
                <div className="pt-2 border-t space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Dual Color Controls
                  </h3>
                  <SliderControl
                    label="Luminance Threshold"
                    value={pixelationUniforms.luminanceThreshold}
                    onChange={(v) =>
                      setPixelationUniforms((prev) => ({
                        ...prev,
                        luminanceThreshold: v,
                      }))
                    }
                    min={0}
                    max={1}
                    step={0.01}
                    tooltip={{
                      description:
                        "Controls the ratio between the two colors — lower values mean more pixels become the bright color.",
                      technical:
                        "Pixels with luminance below this threshold get color 1, above get color 2.",
                    }}
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-sm font-medium">Dark Color</Label>
                      <InfoTooltip
                        description="Color for pixels below the luminance threshold — typically the darker areas of the image."
                        technical="Applied to pixels where luminance < threshold."
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={rgbToHex(...pixelationUniforms.color1)}
                        onChange={(e) =>
                          setPixelationUniforms((prev) => ({
                            ...prev,
                            color1: hexToRgb(e.target.value),
                          }))
                        }
                        className="w-10 h-10 rounded-lg border border-input cursor-pointer"
                      />
                      <input
                        type="text"
                        value={rgbToHex(...pixelationUniforms.color1).toUpperCase()}
                        onChange={(e) => {
                          const hex = e.target.value;
                          if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                            setPixelationUniforms((prev) => ({
                              ...prev,
                              color1: hexToRgb(hex),
                            }));
                          }
                        }}
                        className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm font-mono"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-sm font-medium">Bright Color</Label>
                      <InfoTooltip
                        description="Color for pixels above the luminance threshold — typically the brighter areas of the image."
                        technical="Applied to pixels where luminance >= threshold."
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={rgbToHex(...pixelationUniforms.color2)}
                        onChange={(e) =>
                          setPixelationUniforms((prev) => ({
                            ...prev,
                            color2: hexToRgb(e.target.value),
                          }))
                        }
                        className="w-10 h-10 rounded-lg border border-input cursor-pointer"
                      />
                      <input
                        type="text"
                        value={rgbToHex(...pixelationUniforms.color2).toUpperCase()}
                        onChange={(e) => {
                          const hex = e.target.value;
                          if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                            setPixelationUniforms((prev) => ({
                              ...prev,
                              color2: hexToRgb(hex),
                            }));
                          }
                        }}
                        className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm font-mono"
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Normal mode controls */}
              {!pixelationUniforms.binaryMode && !pixelationUniforms.dualColorMode && (
                <>
                  <SliderControl
                    label="Color Depth"
                    value={pixelationUniforms.colorDepth}
                    onChange={(v) =>
                      setPixelationUniforms((prev) => ({
                        ...prev,
                        colorDepth: v,
                      }))
                    }
                    min={2}
                    max={256}
                    step={1}
                    unit=" levels"
                    tooltip={{
                      description:
                        "Reduces the number of colors — lower values give a limited palette like old game consoles.",
                      technical:
                        "Quantizes each RGB channel to N discrete levels using floor(color × N + 0.5) / N.",
                    }}
                  />
                  <SliderControl
                    label="Smoothing"
                    value={pixelationUniforms.smoothing}
                    onChange={(v) =>
                      setPixelationUniforms((prev) => ({
                        ...prev,
                        smoothing: v,
                      }))
                    }
                    min={0}
                    max={1}
                    step={0.01}
                    tooltip={{
                      description:
                        "Blends the effect with the original — 0 is full pixel art, 1 shows the original image.",
                      technical:
                        "Linearly interpolates (mix) between the pixelated result and original image.",
                    }}
                  />
                </>
              )}

              <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
                {pixelationUniforms.dualColorMode ? (
                  <p>
                    Dual color mode maps pixels to two colors based on
                    brightness — great for stylized two-tone artwork.
                  </p>
                ) : pixelationUniforms.binaryMode ? (
                  <p>
                    Binary mode outputs colored pixels or fully transparent
                    based on brightness thresholds.
                  </p>
                ) : (
                  <p>
                    Reduce image resolution and color palette for a retro pixel
                    art look.
                  </p>
                )}
              </div>
            </>
          )}

          {image && effect === "dithering" && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Dither Pattern</Label>
                  <InfoTooltip
                    description="Different patterns for simulating more colors with fewer — Bayer gives a grid pattern, Ordered is more random."
                    technical="Bayer uses ordered threshold matrices (4×4 or 8×8), Ordered uses a pseudo-random noise function."
                  />
                </div>
                <ToggleGroup
                  type="single"
                  value={ditheringUniforms.ditherType.toString()}
                  onValueChange={(value) => {
                    if (value)
                      setDitheringUniforms((prev) => ({
                        ...prev,
                        ditherType: parseInt(value),
                      }));
                  }}
                  className="w-full justify-start"
                  variant="outline"
                  spacing={0}
                >
                  <ToggleGroupItem value="0" className="flex-1">
                    Bayer 4x4
                  </ToggleGroupItem>
                  <ToggleGroupItem value="1" className="flex-1">
                    Bayer 8x8
                  </ToggleGroupItem>
                  <ToggleGroupItem value="2" className="flex-1">
                    Ordered
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Color Mode</Label>
                  <InfoTooltip
                    description="Grayscale is black/white only, 1-bit gives 8 colors, Limited keeps some original color blending."
                    technical="Grayscale converts to luminance, 1-bit applies step() per RGB channel, Limited mixes dithered result with original."
                  />
                </div>
                <ToggleGroup
                  type="single"
                  value={ditheringUniforms.colorMode.toString()}
                  onValueChange={(value) => {
                    if (value)
                      setDitheringUniforms((prev) => ({
                        ...prev,
                        colorMode: parseInt(value),
                      }));
                  }}
                  className="w-full justify-start"
                  variant="outline"
                  spacing={0}
                >
                  <ToggleGroupItem value="0" className="flex-1">
                    Grayscale
                  </ToggleGroupItem>
                  <ToggleGroupItem value="1" className="flex-1">
                    1-bit
                  </ToggleGroupItem>
                  <ToggleGroupItem value="2" className="flex-1">
                    Limited
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <SliderControl
                label="Threshold"
                value={ditheringUniforms.threshold}
                onChange={(v) =>
                  setDitheringUniforms((prev) => ({ ...prev, threshold: v }))
                }
                min={0}
                max={2}
                step={0.01}
                tooltip={{
                  description:
                    "Controls contrast — higher values make the dithering more aggressive with harder transitions.",
                  technical:
                    "Scales the dither matrix values around 0.5: (value - 0.5) × threshold + 0.5.",
                }}
              />
              <SliderControl
                label="Scale"
                value={ditheringUniforms.scale}
                onChange={(v) =>
                  setDitheringUniforms((prev) => ({ ...prev, scale: v }))
                }
                min={1}
                max={8}
                step={1}
                unit="x"
                tooltip={{
                  description:
                    "Makes the dither pattern bigger — useful for making the effect more visible.",
                  technical:
                    "Divides pixel coordinates before looking up the dither pattern.",
                }}
              />
              <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
                <p>
                  Classic dithering effect for a retro halftone or newspaper
                  print look.
                </p>
              </div>
            </>
          )}

          {image && effect === "chromatic" && (
            <>
              <SliderControl
                label="Offset Amount"
                value={chromaticUniforms.offsetAmount}
                onChange={(v) =>
                  setChromaticUniforms((prev) => ({ ...prev, offsetAmount: v }))
                }
                min={0}
                max={50}
                step={1}
                unit="px"
                tooltip={{
                  description:
                    "Separates color channels — higher values create more dramatic RGB splitting like a broken lens.",
                  technical:
                    "Shifts Red channel by +offset and Blue by -offset in UV space (Green stays centered).",
                }}
              />
              <SliderControl
                label="Angle"
                value={chromaticUniforms.angle}
                onChange={(v) =>
                  setChromaticUniforms((prev) => ({ ...prev, angle: v }))
                }
                min={0}
                max={360}
                step={1}
                unit="°"
                tooltip={{
                  description:
                    "Changes the direction of the color split — 0° is horizontal, 90° is vertical.",
                  technical:
                    "Converts to radians and creates direction vector (cos, sin) for the channel offset.",
                }}
              />

              <div className="pt-2 border-t">
                <h3 className="font-medium text-sm mb-4 text-muted-foreground">
                  CRT Effects
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-sm font-medium">Scanlines</Label>
                      <InfoTooltip
                        description="Adds horizontal lines like old CRT monitors for a retro TV effect."
                        technical="Applies sin(y × resolution × PI) with power curve to darken alternating rows."
                      />
                    </div>
                    <ToggleGroup
                      type="single"
                      value={chromaticUniforms.scanlines ? "on" : "off"}
                      onValueChange={(value) => {
                        if (value)
                          setChromaticUniforms((prev) => ({
                            ...prev,
                            scanlines: value === "on",
                          }));
                      }}
                      variant="outline"
                      spacing={0}
                    >
                      <ToggleGroupItem value="off">Off</ToggleGroupItem>
                      <ToggleGroupItem value="on">On</ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  {chromaticUniforms.scanlines && (
                    <SliderControl
                      label="Scanline Intensity"
                      value={chromaticUniforms.scanlineIntensity}
                      onChange={(v) =>
                        setChromaticUniforms((prev) => ({
                          ...prev,
                          scanlineIntensity: v,
                        }))
                      }
                      min={0}
                      max={1}
                      step={0.01}
                      tooltip={{
                        description:
                          "How dark the scanlines appear — higher values make them more prominent.",
                        technical:
                          "Controls the darkening amount via: color *= 1 - (1 - scanline) × intensity.",
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="pt-2 border-t">
                <h3 className="font-medium text-sm mb-4 text-muted-foreground">
                  Film Grain
                </h3>
                <SliderControl
                  label="Noise Amount"
                  value={chromaticUniforms.noiseAmount}
                  onChange={(v) =>
                    setChromaticUniforms((prev) => ({
                      ...prev,
                      noiseAmount: v,
                    }))
                  }
                  min={0}
                  max={0.3}
                  step={0.01}
                  tooltip={{
                    description:
                      "Adds film grain/static — simulates analog video noise or old film stock.",
                    technical:
                      "Adds random() × 2 - 1 multiplied by this value to each pixel (animated with time).",
                  }}
                />
              </div>

              <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
                <p>
                  RGB channel separation with optional CRT scanlines and film
                  grain for a glitchy tech aesthetic.
                </p>
              </div>
            </>
          )}

          {image && effect === "grid" && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Shape</Label>
                  <InfoTooltip
                    description="Choose the shape used for each grid cell — dots give a halftone feel, squares give a mosaic look."
                    technical="Circles use length() for distance, squares use max(abs()) for Chebyshev distance."
                  />
                </div>
                <ToggleGroup
                  type="single"
                  value={gridUniforms.shapeType.toString()}
                  onValueChange={(value) => {
                    if (value)
                      setGridUniforms((prev) => ({
                        ...prev,
                        shapeType: parseInt(value),
                      }));
                  }}
                  className="w-full justify-start"
                  variant="outline"
                  spacing={0}
                >
                  <ToggleGroupItem value="0" className="flex-1">
                    Dot
                  </ToggleGroupItem>
                  <ToggleGroupItem value="1" className="flex-1">
                    Square
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <SliderControl
                label="Cell Size"
                value={gridUniforms.cellSize}
                onChange={(v) =>
                  setGridUniforms((prev) => ({ ...prev, cellSize: v }))
                }
                min={4}
                max={64}
                step={1}
                unit="px"
                tooltip={{
                  description:
                    "Size of each grid cell — larger values create a coarser, more abstract look.",
                  technical:
                    "Determines the pixel dimensions of each grid cell for UV subdivision.",
                }}
              />

              {/* Color Mode Toggle */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Color Mode</Label>
                  <InfoTooltip
                    description="Normal uses original image colors, Dual Color maps shapes to two colors based on brightness."
                    technical="Dual Color calculates luminance and applies threshold to choose between two colors."
                  />
                </div>
                <ToggleGroup
                  type="single"
                  value={gridUniforms.dualColorMode ? "dual" : "normal"}
                  onValueChange={(value) => {
                    if (value)
                      setGridUniforms((prev) => ({
                        ...prev,
                        dualColorMode: value === "dual",
                      }));
                  }}
                  className="w-full justify-start"
                  variant="outline"
                  spacing={0}
                >
                  <ToggleGroupItem value="normal" className="flex-1">
                    Normal
                  </ToggleGroupItem>
                  <ToggleGroupItem value="dual" className="flex-1">
                    Dual Color
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Dual Color Mode Controls */}
              {gridUniforms.dualColorMode && (
                <div className="pt-2 border-t space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Dual Color Controls
                  </h3>
                  <SliderControl
                    label="Luminance Threshold"
                    value={gridUniforms.luminanceThreshold}
                    onChange={(v) =>
                      setGridUniforms((prev) => ({
                        ...prev,
                        luminanceThreshold: v,
                      }))
                    }
                    min={0}
                    max={1}
                    step={0.01}
                    tooltip={{
                      description:
                        "Controls the ratio between the two colors — lower values mean more shapes become the bright color.",
                      technical:
                        "Shapes with luminance below this threshold get color 1, above get color 2.",
                    }}
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-sm font-medium">Dark Color</Label>
                      <InfoTooltip
                        description="Color for shapes in darker areas of the image."
                        technical="Applied to shapes where sampled luminance < threshold."
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={rgbToHex(...gridUniforms.color1)}
                        onChange={(e) =>
                          setGridUniforms((prev) => ({
                            ...prev,
                            color1: hexToRgb(e.target.value),
                          }))
                        }
                        className="w-10 h-10 rounded-lg border border-input cursor-pointer"
                      />
                      <input
                        type="text"
                        value={rgbToHex(...gridUniforms.color1).toUpperCase()}
                        onChange={(e) => {
                          const hex = e.target.value;
                          if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                            setGridUniforms((prev) => ({
                              ...prev,
                              color1: hexToRgb(hex),
                            }));
                          }
                        }}
                        className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm font-mono"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-sm font-medium">Bright Color</Label>
                      <InfoTooltip
                        description="Color for shapes in brighter areas of the image."
                        technical="Applied to shapes where sampled luminance >= threshold."
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={rgbToHex(...gridUniforms.color2)}
                        onChange={(e) =>
                          setGridUniforms((prev) => ({
                            ...prev,
                            color2: hexToRgb(e.target.value),
                          }))
                        }
                        className="w-10 h-10 rounded-lg border border-input cursor-pointer"
                      />
                      <input
                        type="text"
                        value={rgbToHex(...gridUniforms.color2).toUpperCase()}
                        onChange={(e) => {
                          const hex = e.target.value;
                          if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                            setGridUniforms((prev) => ({
                              ...prev,
                              color2: hexToRgb(hex),
                            }));
                          }
                        }}
                        className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm font-mono"
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t">
                <h3 className="font-medium text-sm mb-4 text-muted-foreground">
                  Spacing
                </h3>
                <div className="space-y-4">
                  <SliderControl
                    label="X Spread"
                    value={gridUniforms.xSpread}
                    onChange={(v) =>
                      setGridUniforms((prev) => ({ ...prev, xSpread: v }))
                    }
                    min={0}
                    max={1}
                    step={0.01}
                    tooltip={{
                      description:
                        "Horizontal spacing between shapes — 0 means shapes touch, 1 creates maximum gaps.",
                      technical:
                        "Controls the horizontal radius of shapes as a fraction of cell size.",
                    }}
                  />
                  <SliderControl
                    label="Y Spread"
                    value={gridUniforms.ySpread}
                    onChange={(v) =>
                      setGridUniforms((prev) => ({ ...prev, ySpread: v }))
                    }
                    min={0}
                    max={1}
                    step={0.01}
                    tooltip={{
                      description:
                        "Vertical spacing between shapes — 0 means shapes touch, 1 creates maximum gaps.",
                      technical:
                        "Controls the vertical radius of shapes as a fraction of cell size.",
                    }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t">
                <h3 className="font-medium text-sm mb-4 text-muted-foreground">
                  Transform
                </h3>
                <div className="space-y-4">
                  <SliderControl
                    label="Rotation"
                    value={gridUniforms.rotation}
                    onChange={(v) =>
                      setGridUniforms((prev) => ({ ...prev, rotation: v }))
                    }
                    min={0}
                    max={360}
                    step={1}
                    unit="°"
                    tooltip={{
                      description:
                        "Rotate the entire grid — useful for diagonal or angled patterns.",
                      technical:
                        "Applies a rotation matrix to pixel coordinates around the image center.",
                    }}
                  />
                  <SliderControl
                    label="X Offset"
                    value={gridUniforms.xOffset}
                    onChange={(v) =>
                      setGridUniforms((prev) => ({ ...prev, xOffset: v }))
                    }
                    min={-1}
                    max={1}
                    step={0.01}
                    tooltip={{
                      description:
                        "Shift the grid horizontally — fine-tune alignment with image features.",
                      technical:
                        "Offsets grid coordinates by a fraction of cell size in X direction.",
                    }}
                  />
                  <SliderControl
                    label="Y Offset"
                    value={gridUniforms.yOffset}
                    onChange={(v) =>
                      setGridUniforms((prev) => ({ ...prev, yOffset: v }))
                    }
                    min={-1}
                    max={1}
                    step={0.01}
                    tooltip={{
                      description:
                        "Shift the grid vertically — fine-tune alignment with image features.",
                      technical:
                        "Offsets grid coordinates by a fraction of cell size in Y direction.",
                    }}
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
                {gridUniforms.dualColorMode ? (
                  <p>
                    Dual color mode maps grid shapes to two colors based on
                    brightness — perfect for stylized two-tone halftone effects.
                  </p>
                ) : (
                  <p>
                    Break down the image into a grid of colored shapes for a
                    stylized halftone or mosaic effect.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom - Action Buttons */}
      <div className="border-t bg-background p-4">
        <div className="max-w-md mx-auto flex gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex-1"
          >
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            {image ? "Change" : "Upload"}
          </Button>
          <Button
            onClick={resetEffect}
            variant="outline"
            className="flex-1"
            disabled={!image}
          >
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
            Reset
          </Button>
          <Button
            onClick={downloadImage}
            className="flex-1"
            disabled={!image || !isReady}
          >
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download
          </Button>
          <Button
            onClick={() =>
              downloadShaderZip({ effect, uniforms: currentUniforms })
            }
            variant="outline"
            className="flex-1"
          >
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
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}
