import JSZip from 'jszip';
import { ShaderEffect } from './shaders';
import {
  PixelationUniforms,
  DitheringUniforms,
  ChromaticUniforms,
  GridUniforms,
  ShaderUniforms,
} from './use-webgl';

export interface ExportConfig {
  effect: ShaderEffect;
  uniforms: ShaderUniforms;
}

export interface ExportResult {
  componentCode: string;
  agentsMd: string;
  componentName: string;
}

// Shader descriptions for documentation
const shaderDescriptions: Record<ShaderEffect, { name: string; description: string; technical: string }> = {
  pixelation: {
    name: 'Pixelation',
    description: 'Creates a retro pixel art effect by reducing image resolution and color palette. Perfect for creating nostalgic game-style graphics or stylized low-fi aesthetics.',
    technical: 'Works by downsampling UV coordinates into blocks and quantizing RGB channels to a limited number of discrete levels. The smoothing parameter allows blending between the pixelated result and the original image.',
  },
  dithering: {
    name: 'Dithering',
    description: 'Classic dithering effect that simulates more colors using patterns of dots. Creates a retro halftone or newspaper print aesthetic.',
    technical: 'Uses Bayer matrix patterns (4x4 or 8x8) or ordered noise to create threshold patterns. Each pixel is compared against the pattern to determine if it should be light or dark, creating the illusion of gradients with limited colors.',
  },
  chromatic: {
    name: 'ChromaticAberration',
    description: 'RGB channel separation effect that mimics lens distortion, with optional CRT scanlines and film grain. Creates a glitchy, analog tech aesthetic.',
    technical: 'Separates the image into R, G, B channels and offsets them in a configurable direction. Scanlines use a sine wave pattern to darken alternating rows. Film grain adds animated random noise.',
  },
  grid: {
    name: 'Grid',
    description: 'Breaks down the image into a grid of colored shapes (dots or squares) for a stylized halftone or mosaic effect.',
    technical: 'Divides the image into cells, samples the color at each cell center, and renders shapes (circles or squares) with that color. Supports rotation and offset transformations.',
  },
};

// Vertex shader (shared by all effects)
const vertexShader = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

// Fragment shaders for each effect
const fragmentShaders: Record<ShaderEffect, string> = {
  pixelation: `
  precision mediump float;
  
  uniform sampler2D u_image;
  uniform vec2 u_resolution;
  uniform float u_pixelSize;
  uniform float u_colorDepth;
  uniform float u_smoothing;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec2 uv = v_texCoord;
    vec2 pixelatedUV = floor(uv * u_resolution / u_pixelSize) * u_pixelSize / u_resolution;
    vec4 originalColor = texture2D(u_image, uv);
    vec4 pixelatedColor = texture2D(u_image, pixelatedUV);
    float levels = u_colorDepth;
    pixelatedColor.rgb = floor(pixelatedColor.rgb * levels + 0.5) / levels;
    vec4 finalColor = mix(pixelatedColor, originalColor, u_smoothing);
    gl_FragColor = finalColor;
  }
`,
  dithering: `
  precision mediump float;
  
  uniform sampler2D u_image;
  uniform vec2 u_resolution;
  uniform float u_threshold;
  uniform float u_scale;
  uniform int u_ditherType;
  uniform int u_colorMode;
  
  varying vec2 v_texCoord;
  
  float bayer4x4(vec2 pos) {
    int x = int(mod(pos.x, 4.0));
    int y = int(mod(pos.y, 4.0));
    int index = x + y * 4;
    if (index == 0) return 0.0 / 16.0;
    if (index == 1) return 8.0 / 16.0;
    if (index == 2) return 2.0 / 16.0;
    if (index == 3) return 10.0 / 16.0;
    if (index == 4) return 12.0 / 16.0;
    if (index == 5) return 4.0 / 16.0;
    if (index == 6) return 14.0 / 16.0;
    if (index == 7) return 6.0 / 16.0;
    if (index == 8) return 3.0 / 16.0;
    if (index == 9) return 11.0 / 16.0;
    if (index == 10) return 1.0 / 16.0;
    if (index == 11) return 9.0 / 16.0;
    if (index == 12) return 15.0 / 16.0;
    if (index == 13) return 7.0 / 16.0;
    if (index == 14) return 13.0 / 16.0;
    return 5.0 / 16.0;
  }
  
  float bayer8x8(vec2 pos) {
    vec2 p = mod(pos, 8.0);
    float a = bayer4x4(p);
    float b = bayer4x4(p / 2.0);
    return (a + b / 4.0) / 1.25;
  }
  
  float ordered(vec2 pos) {
    return fract(sin(dot(floor(pos), vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  void main() {
    vec2 uv = v_texCoord;
    vec4 color = texture2D(u_image, uv);
    vec2 pixelPos = uv * u_resolution / u_scale;
    float ditherValue;
    if (u_ditherType == 0) {
      ditherValue = bayer4x4(pixelPos);
    } else if (u_ditherType == 1) {
      ditherValue = bayer8x8(pixelPos);
    } else {
      ditherValue = ordered(pixelPos);
    }
    ditherValue = (ditherValue - 0.5) * u_threshold + 0.5;
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    vec3 outputColor;
    if (u_colorMode == 0) {
      float dithered = step(ditherValue, gray);
      outputColor = vec3(dithered);
    } else if (u_colorMode == 1) {
      outputColor.r = step(ditherValue, color.r);
      outputColor.g = step(ditherValue, color.g);
      outputColor.b = step(ditherValue, color.b);
    } else {
      outputColor.r = step(ditherValue, color.r);
      outputColor.g = step(ditherValue, color.g);
      outputColor.b = step(ditherValue, color.b);
      outputColor = mix(color.rgb, outputColor, 0.7);
    }
    gl_FragColor = vec4(outputColor, color.a);
  }
`,
  chromatic: `
  precision mediump float;
  
  uniform sampler2D u_image;
  uniform vec2 u_resolution;
  uniform float u_offsetAmount;
  uniform float u_angle;
  uniform float u_scanlineIntensity;
  uniform float u_noiseAmount;
  uniform float u_time;
  uniform bool u_scanlines;
  
  varying vec2 v_texCoord;
  
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  void main() {
    vec2 uv = v_texCoord;
    float rad = u_angle * 3.14159265 / 180.0;
    vec2 direction = vec2(cos(rad), sin(rad));
    vec2 offset = direction * u_offsetAmount / u_resolution;
    float r = texture2D(u_image, uv + offset).r;
    float g = texture2D(u_image, uv).g;
    float b = texture2D(u_image, uv - offset).b;
    vec3 color = vec3(r, g, b);
    if (u_scanlines) {
      float scanline = sin(uv.y * u_resolution.y * 3.14159265) * 0.5 + 0.5;
      scanline = pow(scanline, 1.5);
      color *= 1.0 - (1.0 - scanline) * u_scanlineIntensity;
    }
    if (u_noiseAmount > 0.0) {
      float noise = random(uv + u_time) * 2.0 - 1.0;
      color += noise * u_noiseAmount;
    }
    gl_FragColor = vec4(color, 1.0);
  }
`,
  grid: `
  precision mediump float;
  
  uniform sampler2D u_image;
  uniform vec2 u_resolution;
  uniform float u_cellSize;
  uniform float u_xSpread;
  uniform float u_ySpread;
  uniform float u_rotation;
  uniform float u_xOffset;
  uniform float u_yOffset;
  uniform int u_shapeType;
  
  varying vec2 v_texCoord;
  
  vec2 rotate(vec2 point, vec2 center, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    vec2 p = point - center;
    return vec2(p.x * c - p.y * s, p.x * s + p.y * c) + center;
  }
  
  void main() {
    vec2 uv = v_texCoord;
    vec2 pixelCoord = uv * u_resolution;
    float rad = u_rotation * 3.14159265 / 180.0;
    vec2 center = u_resolution * 0.5;
    vec2 rotatedCoord = rotate(pixelCoord, center, rad);
    rotatedCoord += vec2(u_xOffset, u_yOffset) * u_cellSize;
    vec2 cellIndex = floor(rotatedCoord / u_cellSize);
    vec2 cellCenter = (cellIndex + 0.5) * u_cellSize;
    vec2 posInCell = (rotatedCoord - cellCenter) / u_cellSize;
    vec2 sampleCoord = rotate(cellCenter - vec2(u_xOffset, u_yOffset) * u_cellSize, center, -rad);
    vec2 sampleUV = sampleCoord / u_resolution;
    sampleUV = clamp(sampleUV, 0.0, 1.0);
    vec4 cellColor = texture2D(u_image, sampleUV);
    float xRadius = 0.5 * (1.0 - u_xSpread * 0.9);
    float yRadius = 0.5 * (1.0 - u_ySpread * 0.9);
    float inside;
    if (u_shapeType == 0) {
      vec2 normalizedPos = posInCell / vec2(xRadius, yRadius);
      float dist = length(normalizedPos);
      inside = 1.0 - smoothstep(0.9, 1.0, dist);
    } else {
      vec2 absPos = abs(posInCell);
      float xInside = 1.0 - smoothstep(xRadius - 0.02, xRadius, absPos.x);
      float yInside = 1.0 - smoothstep(yRadius - 0.02, yRadius, absPos.y);
      inside = xInside * yInside;
    }
    vec3 bgColor = vec3(0.0);
    vec3 finalColor = mix(bgColor, cellColor.rgb, inside);
    float finalAlpha = inside;
    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`,
};

// Generate props interface and defaults for each shader
function generatePropsSection(effect: ShaderEffect, uniforms: ShaderUniforms): { propsInterface: string; propsDefaults: string; propsUsage: string } {
  switch (effect) {
    case 'pixelation': {
      const u = uniforms as PixelationUniforms;
      return {
        propsInterface: `  /** Size of each pixel block in pixels. Higher = more chunky. */
  pixelSize?: number;
  /** Number of color levels per channel. Lower = more limited palette. */
  colorDepth?: number;
  /** Blend with original image. 0 = full effect, 1 = original. */
  smoothing?: number;`,
        propsDefaults: `  pixelSize = ${u.pixelSize},
  colorDepth = ${u.colorDepth},
  smoothing = ${u.smoothing},`,
        propsUsage: `gl.uniform1f(gl.getUniformLocation(program, 'u_pixelSize'), pixelSize);
    gl.uniform1f(gl.getUniformLocation(program, 'u_colorDepth'), colorDepth);
    gl.uniform1f(gl.getUniformLocation(program, 'u_smoothing'), smoothing);`,
      };
    }
    case 'dithering': {
      const u = uniforms as DitheringUniforms;
      return {
        propsInterface: `  /** Dither threshold intensity. Higher = more contrast. */
  threshold?: number;
  /** Scale of the dither pattern. Higher = larger pattern. */
  scale?: number;
  /** Dither pattern type: 0 = Bayer 4x4, 1 = Bayer 8x8, 2 = Ordered noise */
  ditherType?: 0 | 1 | 2;
  /** Color mode: 0 = Grayscale, 1 = 1-bit RGB, 2 = Limited palette */
  colorMode?: 0 | 1 | 2;`,
        propsDefaults: `  threshold = ${u.threshold},
  scale = ${u.scale},
  ditherType = ${u.ditherType},
  colorMode = ${u.colorMode},`,
        propsUsage: `gl.uniform1f(gl.getUniformLocation(program, 'u_threshold'), threshold);
    gl.uniform1f(gl.getUniformLocation(program, 'u_scale'), scale);
    gl.uniform1i(gl.getUniformLocation(program, 'u_ditherType'), ditherType);
    gl.uniform1i(gl.getUniformLocation(program, 'u_colorMode'), colorMode);`,
      };
    }
    case 'chromatic': {
      const u = uniforms as ChromaticUniforms;
      return {
        propsInterface: `  /** RGB channel separation amount in pixels. */
  offsetAmount?: number;
  /** Direction angle of the chromatic split in degrees. */
  angle?: number;
  /** Enable CRT-style scanlines. */
  scanlines?: boolean;
  /** Intensity of scanlines (0-1). */
  scanlineIntensity?: number;
  /** Amount of film grain noise (0-0.3 recommended). */
  noiseAmount?: number;`,
        propsDefaults: `  offsetAmount = ${u.offsetAmount},
  angle = ${u.angle},
  scanlines = ${u.scanlines},
  scanlineIntensity = ${u.scanlineIntensity},
  noiseAmount = ${u.noiseAmount},`,
        propsUsage: `gl.uniform1f(gl.getUniformLocation(program, 'u_offsetAmount'), offsetAmount);
    gl.uniform1f(gl.getUniformLocation(program, 'u_angle'), angle);
    gl.uniform1i(gl.getUniformLocation(program, 'u_scanlines'), scanlines ? 1 : 0);
    gl.uniform1f(gl.getUniformLocation(program, 'u_scanlineIntensity'), scanlineIntensity);
    gl.uniform1f(gl.getUniformLocation(program, 'u_noiseAmount'), noiseAmount);
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), performance.now() / 1000);`,
      };
    }
    case 'grid': {
      const u = uniforms as GridUniforms;
      return {
        propsInterface: `  /** Size of each grid cell in pixels. */
  cellSize?: number;
  /** Horizontal spacing between shapes (0-1). */
  xSpread?: number;
  /** Vertical spacing between shapes (0-1). */
  ySpread?: number;
  /** Grid rotation in degrees. */
  rotation?: number;
  /** Horizontal grid offset (-1 to 1). */
  xOffset?: number;
  /** Vertical grid offset (-1 to 1). */
  yOffset?: number;
  /** Shape type: 0 = Circle/Dot, 1 = Square */
  shapeType?: 0 | 1;`,
        propsDefaults: `  cellSize = ${u.cellSize},
  xSpread = ${u.xSpread},
  ySpread = ${u.ySpread},
  rotation = ${u.rotation},
  xOffset = ${u.xOffset},
  yOffset = ${u.yOffset},
  shapeType = ${u.shapeType},`,
        propsUsage: `gl.uniform1f(gl.getUniformLocation(program, 'u_cellSize'), cellSize);
    gl.uniform1f(gl.getUniformLocation(program, 'u_xSpread'), xSpread);
    gl.uniform1f(gl.getUniformLocation(program, 'u_ySpread'), ySpread);
    gl.uniform1f(gl.getUniformLocation(program, 'u_rotation'), rotation);
    gl.uniform1f(gl.getUniformLocation(program, 'u_xOffset'), xOffset);
    gl.uniform1f(gl.getUniformLocation(program, 'u_yOffset'), yOffset);
    gl.uniform1i(gl.getUniformLocation(program, 'u_shapeType'), shapeType);`,
      };
    }
  }
}

// Generate the component code
function generateComponentCode(effect: ShaderEffect, uniforms: ShaderUniforms): string {
  const { name } = shaderDescriptions[effect];
  const { propsInterface, propsDefaults, propsUsage } = generatePropsSection(effect, uniforms);
  const fragmentShader = fragmentShaders[effect];
  
  const needsAnimation = effect === 'chromatic';

  return `"use client";

import { useRef, useEffect, useState, useCallback } from "react";

const VERTEX_SHADER = \`${vertexShader}\`;

const FRAGMENT_SHADER = \`${fragmentShader}\`;

export interface ${name}ShaderProps {
  /** Image source URL or base64 data */
  src: string;
${propsInterface}
  /** Optional className for the canvas element */
  className?: string;
  /** Optional inline styles for the canvas */
  style?: React.CSSProperties;
  /** Width of the rendered output (defaults to image natural width) */
  width?: number;
  /** Height of the rendered output (defaults to image natural height) */
  height?: number;
}

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export function ${name}Shader({
  src,
${propsDefaults}
  className,
  style,
  width,
  height,
}: ${name}ShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const glRef = useRef<{
    gl: WebGLRenderingContext;
    program: WebGLProgram;
    texture: WebGLTexture;
  } | null>(null);
  const animationRef = useRef<number>();

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.onerror = () => console.error("Failed to load image:", src);
    img.src = src;
  }, [src]);

  // Render function - defined first so it can be called from setup effect
  const render = useCallback(() => {
    if (!glRef.current || !canvasRef.current) return;
    const { gl, program, texture } = glRef.current;
    const canvas = canvasRef.current;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), canvas.width, canvas.height);
    gl.uniform1i(gl.getUniformLocation(program, "u_image"), 0);
    ${propsUsage}

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
${needsAnimation ? `
    // Continue animation for noise effect
    if (noiseAmount > 0) {
      animationRef.current = requestAnimationFrame(render);
    }` : ''}
  }, [${getPropsListForDeps(effect)}]);

  // Setup WebGL and render immediately when ready
  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = width ?? image.naturalWidth;
    canvas.height = height ?? image.naturalHeight;

    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = createProgram(gl, vs, fs);
    if (!program) return;

    // Create texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // Setup buffers
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    const texLoc = gl.getAttribLocation(program, "a_texCoord");
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

    glRef.current = { gl, program, texture: texture! };

    // Render immediately after setup - don't rely on separate effect
    // (setting a ref doesn't trigger re-render, so we must render inline)
    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
    };
  }, [image, width, height, render]);

  // Re-render when uniforms change (props update after initial mount)
  useEffect(() => {
    if (glRef.current) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      render();
    }
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        maxWidth: "100%",
        height: "auto",
        ...style,
      }}
    />
  );
}

export default ${name}Shader;
`;
}

function getPropsListForDeps(effect: ShaderEffect): string {
  switch (effect) {
    case 'pixelation':
      return 'pixelSize, colorDepth, smoothing';
    case 'dithering':
      return 'threshold, scale, ditherType, colorMode';
    case 'chromatic':
      return 'offsetAmount, angle, scanlines, scanlineIntensity, noiseAmount';
    case 'grid':
      return 'cellSize, xSpread, ySpread, rotation, xOffset, yOffset, shapeType';
  }
}

// Generate AGENTS.md content
function generateAgentsMd(effect: ShaderEffect, uniforms: ShaderUniforms): string {
  const { name, description, technical } = shaderDescriptions[effect];
  const propsTable = generatePropsTable(effect, uniforms);
  
  return `# ${name} Shader Component

## Overview

${description}

## Installation

This is a self-contained React component. Simply copy \`${name}Shader.tsx\` into your project.

### Dependencies

- **React 18+** (uses hooks: useRef, useEffect, useState, useCallback)
- **TypeScript** (optional but recommended)

No additional npm packages are required. The component uses the browser's native WebGL API.

### For Next.js Projects

The component includes the \`"use client"\` directive and is ready to use in Next.js App Router projects.

## Usage

\`\`\`tsx
import { ${name}Shader } from './${name}Shader';

function MyComponent() {
  return (
    <${name}Shader
      src="/path/to/image.jpg"
      // All props below are optional and show the exported default values
${generateUsageProps(effect, uniforms)}
    />
  );
}
\`\`\`

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| \`src\` | \`string\` | **required** | Image URL or base64 data |
${propsTable}
| \`className\` | \`string\` | - | CSS class for the canvas |
| \`style\` | \`CSSProperties\` | - | Inline styles for the canvas |
| \`width\` | \`number\` | image width | Output width in pixels |
| \`height\` | \`number\` | image height | Output height in pixels |

## How It Works

${technical}

### WebGL Pipeline

1. **Image Loading**: The \`src\` prop triggers image loading with CORS support
2. **Texture Upload**: The image is uploaded to the GPU as a WebGL texture
3. **Shader Execution**: A full-screen quad renders with the fragment shader applied
4. **Real-time Updates**: Changing any prop triggers an immediate re-render

## Common Customizations

${generateCustomizationTips(effect)}

## Troubleshooting

### Image not loading
- Ensure the image URL is accessible (check CORS if loading from external domains)
- For local images in Next.js, place them in the \`public\` folder

### WebGL not supported
- The component will log an error if WebGL is unavailable
- Consider adding a fallback: \`<img>\` element for browsers without WebGL support

### Performance
- The shader runs on the GPU and is very performant
- For animated effects (like noise), the component uses \`requestAnimationFrame\`
- Resize the output with \`width\`/\`height\` props to reduce GPU load on large images
`;
}

function generatePropsTable(effect: ShaderEffect, uniforms: ShaderUniforms): string {
  switch (effect) {
    case 'pixelation': {
      const u = uniforms as PixelationUniforms;
      return `| \`pixelSize\` | \`number\` | \`${u.pixelSize}\` | Size of pixel blocks |
| \`colorDepth\` | \`number\` | \`${u.colorDepth}\` | Color levels per channel (2-256) |
| \`smoothing\` | \`number\` | \`${u.smoothing}\` | Blend with original (0-1) |`;
    }
    case 'dithering': {
      const u = uniforms as DitheringUniforms;
      return `| \`threshold\` | \`number\` | \`${u.threshold}\` | Dither intensity (0-2) |
| \`scale\` | \`number\` | \`${u.scale}\` | Pattern scale multiplier |
| \`ditherType\` | \`0\\|1\\|2\` | \`${u.ditherType}\` | 0=Bayer4x4, 1=Bayer8x8, 2=Ordered |
| \`colorMode\` | \`0\\|1\\|2\` | \`${u.colorMode}\` | 0=Grayscale, 1=1-bit, 2=Limited |`;
    }
    case 'chromatic': {
      const u = uniforms as ChromaticUniforms;
      return `| \`offsetAmount\` | \`number\` | \`${u.offsetAmount}\` | RGB separation in pixels |
| \`angle\` | \`number\` | \`${u.angle}\` | Split direction (0-360 degrees) |
| \`scanlines\` | \`boolean\` | \`${u.scanlines}\` | Enable CRT scanlines |
| \`scanlineIntensity\` | \`number\` | \`${u.scanlineIntensity}\` | Scanline darkness (0-1) |
| \`noiseAmount\` | \`number\` | \`${u.noiseAmount}\` | Film grain amount (0-0.3) |`;
    }
    case 'grid': {
      const u = uniforms as GridUniforms;
      return `| \`cellSize\` | \`number\` | \`${u.cellSize}\` | Grid cell size in pixels |
| \`xSpread\` | \`number\` | \`${u.xSpread}\` | Horizontal spacing (0-1) |
| \`ySpread\` | \`number\` | \`${u.ySpread}\` | Vertical spacing (0-1) |
| \`rotation\` | \`number\` | \`${u.rotation}\` | Grid rotation in degrees |
| \`xOffset\` | \`number\` | \`${u.xOffset}\` | Horizontal offset (-1 to 1) |
| \`yOffset\` | \`number\` | \`${u.yOffset}\` | Vertical offset (-1 to 1) |
| \`shapeType\` | \`0\\|1\` | \`${u.shapeType}\` | 0=Circle/Dot, 1=Square |`;
    }
  }
}

function generateUsageProps(effect: ShaderEffect, uniforms: ShaderUniforms): string {
  switch (effect) {
    case 'pixelation': {
      const u = uniforms as PixelationUniforms;
      return `      pixelSize={${u.pixelSize}}
      colorDepth={${u.colorDepth}}
      smoothing={${u.smoothing}}`;
    }
    case 'dithering': {
      const u = uniforms as DitheringUniforms;
      return `      threshold={${u.threshold}}
      scale={${u.scale}}
      ditherType={${u.ditherType}}
      colorMode={${u.colorMode}}`;
    }
    case 'chromatic': {
      const u = uniforms as ChromaticUniforms;
      return `      offsetAmount={${u.offsetAmount}}
      angle={${u.angle}}
      scanlines={${u.scanlines}}
      scanlineIntensity={${u.scanlineIntensity}}
      noiseAmount={${u.noiseAmount}}`;
    }
    case 'grid': {
      const u = uniforms as GridUniforms;
      return `      cellSize={${u.cellSize}}
      xSpread={${u.xSpread}}
      ySpread={${u.ySpread}}
      rotation={${u.rotation}}
      xOffset={${u.xOffset}}
      yOffset={${u.yOffset}}
      shapeType={${u.shapeType}}`;
    }
  }
}

function generateCustomizationTips(effect: ShaderEffect): string {
  switch (effect) {
    case 'pixelation':
      return `### Retro Game Look
- Set \`pixelSize\` to 8-16 and \`colorDepth\` to 8-16 for NES/SNES style
- Use \`smoothing: 0\` for sharp pixel edges

### Subtle Effect
- Keep \`pixelSize\` low (2-4) with high \`colorDepth\` (128+)
- Add slight \`smoothing\` (0.2-0.4) for a softer look`;
    case 'dithering':
      return `### Newspaper Print
- Use \`ditherType: 0\` (Bayer 4x4) with \`colorMode: 0\` (Grayscale)
- Increase \`scale\` to 2-4 for visible dot pattern

### Retro Computer
- Use \`colorMode: 1\` (1-bit) for CGA-style limited colors
- \`threshold: 1.2-1.5\` increases contrast`;
    case 'chromatic':
      return `### VHS/Analog TV
- Set \`offsetAmount\` to 3-8 pixels
- Enable \`scanlines\` with \`scanlineIntensity: 0.3-0.5\`
- Add subtle \`noiseAmount: 0.05-0.1\`

### Glitch Art
- High \`offsetAmount\` (15-30) for dramatic separation
- Angle at 0° (horizontal) or 90° (vertical) for clean splits`;
    case 'grid':
      return `### Halftone Print
- Use \`shapeType: 0\` (dots) with \`cellSize: 8-16\`
- Set \`xSpread\` and \`ySpread\` to 0.3-0.5
- Add slight \`rotation\` (15-30°) for authentic print angle

### LED Display
- Use \`shapeType: 0\` (dots) with high spread (0.5-0.7)
- Keep \`cellSize\` small (4-8) for dense dot matrix`;
  }
}

// Main export function
export function generateShaderExport(config: ExportConfig): ExportResult {
  const { effect, uniforms } = config;
  const { name } = shaderDescriptions[effect];
  
  return {
    componentCode: generateComponentCode(effect, uniforms),
    agentsMd: generateAgentsMd(effect, uniforms),
    componentName: `${name}Shader`,
  };
}

// Download shader as ZIP file
export async function downloadShaderZip(config: ExportConfig): Promise<void> {
  const { componentCode, agentsMd, componentName } = generateShaderExport(config);
  
  const zip = new JSZip();
  const folder = zip.folder(componentName);
  
  if (!folder) {
    throw new Error('Failed to create ZIP folder');
  }
  
  // Add files to the ZIP
  folder.file(`${componentName}.tsx`, componentCode);
  folder.file('AGENTS.md', agentsMd);
  
  // Generate the ZIP blob
  const blob = await zip.generateAsync({ type: 'blob' });
  
  // Trigger download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${componentName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
