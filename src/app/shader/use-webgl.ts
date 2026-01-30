import { useCallback, useEffect, useRef, useState } from 'react';
import { vertexShaderSource, shaderPrograms, ShaderEffect } from './shaders';

export interface PixelationUniforms {
  pixelSize: number;
  colorDepth: number;
  smoothing: number;
  binaryMode: boolean;
  blackThreshold: number;
  whiteThreshold: number;
  fillColor: [number, number, number]; // RGB 0-1
  dualColorMode: boolean;
  color1: [number, number, number]; // Dark pixels color (RGB 0-1)
  color2: [number, number, number]; // Bright pixels color (RGB 0-1)
  luminanceThreshold: number; // Threshold for color split (0-1)
}

export interface DitheringUniforms {
  threshold: number;
  scale: number;
  ditherType: number;
  colorMode: number;
}

export interface ChromaticUniforms {
  offsetAmount: number;
  angle: number;
  scanlines: boolean;
  scanlineIntensity: number;
  noiseAmount: number;
}

export interface GridUniforms {
  cellSize: number;
  xSpread: number;
  ySpread: number;
  rotation: number;
  xOffset: number;
  yOffset: number;
  shapeType: number; // 0 = circle, 1 = square
  dualColorMode: boolean;
  color1: [number, number, number]; // Dark pixels color (RGB 0-1)
  color2: [number, number, number]; // Bright pixels color (RGB 0-1)
  luminanceThreshold: number; // Threshold for color split (0-1)
}

export type ShaderUniforms = PixelationUniforms | DitheringUniforms | ChromaticUniforms | GridUniforms;

interface WebGLState {
  gl: WebGLRenderingContext | null;
  program: WebGLProgram | null;
  texture: WebGLTexture | null;
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

function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  
  return program;
}

export function useWebGL(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  image: HTMLImageElement | null,
  effect: ShaderEffect,
  uniforms: ShaderUniforms
) {
  const stateRef = useRef<WebGLState>({ gl: null, program: null, texture: null });
  const [isReady, setIsReady] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const timeRef = useRef(0);

  // Initialize WebGL context
  const initGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
    if (!gl) {
      console.error('WebGL not supported');
      return null;
    }

    return gl;
  }, [canvasRef]);

  // Create shader program for current effect
  const createShaderProgram = useCallback((gl: WebGLRenderingContext, effectType: ShaderEffect) => {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, shaderPrograms[effectType]);
    
    if (!vertexShader || !fragmentShader) return null;
    
    return createProgram(gl, vertexShader, fragmentShader);
  }, []);

  // Upload image as texture
  const uploadTexture = useCallback((gl: WebGLRenderingContext, img: HTMLImageElement) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Set texture parameters - use NEAREST to prevent color bleeding at transparent edges
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    // Upload image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    
    return texture;
  }, []);

  // Set up vertex buffers
  const setupBuffers = useCallback((gl: WebGLRenderingContext, program: WebGLProgram) => {
    // Position buffer (full screen quad)
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Texture coordinate buffer
    const texCoords = new Float32Array([
      0, 1,
      1, 1,
      0, 0,
      1, 0,
    ]);
    
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
  }, []);

  // Set uniforms based on effect type
  const setUniforms = useCallback((
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    effectType: ShaderEffect,
    uniforms: ShaderUniforms,
    width: number,
    height: number
  ) => {
    // Common uniforms
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    gl.uniform2f(resolutionLocation, width, height);
    
    const imageLocation = gl.getUniformLocation(program, 'u_image');
    gl.uniform1i(imageLocation, 0);
    
    // Effect-specific uniforms
    if (effectType === 'pixelation') {
      const u = uniforms as PixelationUniforms;
      gl.uniform1f(gl.getUniformLocation(program, 'u_pixelSize'), u.pixelSize);
      gl.uniform1f(gl.getUniformLocation(program, 'u_colorDepth'), u.colorDepth);
      gl.uniform1f(gl.getUniformLocation(program, 'u_smoothing'), u.smoothing);
      gl.uniform1i(gl.getUniformLocation(program, 'u_binaryMode'), u.binaryMode ? 1 : 0);
      gl.uniform1f(gl.getUniformLocation(program, 'u_blackThreshold'), u.blackThreshold);
      gl.uniform1f(gl.getUniformLocation(program, 'u_whiteThreshold'), u.whiteThreshold);
      gl.uniform3f(gl.getUniformLocation(program, 'u_fillColor'), u.fillColor[0], u.fillColor[1], u.fillColor[2]);
      gl.uniform1i(gl.getUniformLocation(program, 'u_dualColorMode'), u.dualColorMode ? 1 : 0);
      gl.uniform3f(gl.getUniformLocation(program, 'u_color1'), u.color1[0], u.color1[1], u.color1[2]);
      gl.uniform3f(gl.getUniformLocation(program, 'u_color2'), u.color2[0], u.color2[1], u.color2[2]);
      gl.uniform1f(gl.getUniformLocation(program, 'u_luminanceThreshold'), u.luminanceThreshold);
    } else if (effectType === 'dithering') {
      const u = uniforms as DitheringUniforms;
      gl.uniform1f(gl.getUniformLocation(program, 'u_threshold'), u.threshold);
      gl.uniform1f(gl.getUniformLocation(program, 'u_scale'), u.scale);
      gl.uniform1i(gl.getUniformLocation(program, 'u_ditherType'), u.ditherType);
      gl.uniform1i(gl.getUniformLocation(program, 'u_colorMode'), u.colorMode);
    } else if (effectType === 'chromatic') {
      const u = uniforms as ChromaticUniforms;
      gl.uniform1f(gl.getUniformLocation(program, 'u_offsetAmount'), u.offsetAmount);
      gl.uniform1f(gl.getUniformLocation(program, 'u_angle'), u.angle);
      gl.uniform1i(gl.getUniformLocation(program, 'u_scanlines'), u.scanlines ? 1 : 0);
      gl.uniform1f(gl.getUniformLocation(program, 'u_scanlineIntensity'), u.scanlineIntensity);
      gl.uniform1f(gl.getUniformLocation(program, 'u_noiseAmount'), u.noiseAmount);
      gl.uniform1f(gl.getUniformLocation(program, 'u_time'), timeRef.current);
    } else if (effectType === 'grid') {
      const u = uniforms as GridUniforms;
      gl.uniform1f(gl.getUniformLocation(program, 'u_cellSize'), u.cellSize);
      gl.uniform1f(gl.getUniformLocation(program, 'u_xSpread'), u.xSpread);
      gl.uniform1f(gl.getUniformLocation(program, 'u_ySpread'), u.ySpread);
      gl.uniform1f(gl.getUniformLocation(program, 'u_rotation'), u.rotation);
      gl.uniform1f(gl.getUniformLocation(program, 'u_xOffset'), u.xOffset);
      gl.uniform1f(gl.getUniformLocation(program, 'u_yOffset'), u.yOffset);
      gl.uniform1i(gl.getUniformLocation(program, 'u_shapeType'), u.shapeType);
      gl.uniform1i(gl.getUniformLocation(program, 'u_dualColorMode'), u.dualColorMode ? 1 : 0);
      gl.uniform3f(gl.getUniformLocation(program, 'u_color1'), u.color1[0], u.color1[1], u.color1[2]);
      gl.uniform3f(gl.getUniformLocation(program, 'u_color2'), u.color2[0], u.color2[1], u.color2[2]);
      gl.uniform1f(gl.getUniformLocation(program, 'u_luminanceThreshold'), u.luminanceThreshold);
    }
  }, []);

  // Render the scene
  const render = useCallback(() => {
    const { gl, program, texture } = stateRef.current;
    const canvas = canvasRef.current;
    
    if (!gl || !program || !texture || !canvas || !image) return;
    
    // Update time for animated effects
    timeRef.current = performance.now() / 1000;
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Disable blending - the shader handles alpha properly
    gl.disable(gl.BLEND);
    
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    setUniforms(gl, program, effect, uniforms, canvas.width, canvas.height);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // Continue animation for effects that need it (chromatic with noise)
    if (effect === 'chromatic' && (uniforms as ChromaticUniforms).noiseAmount > 0) {
      animationFrameRef.current = requestAnimationFrame(render);
    }
  }, [canvasRef, image, effect, uniforms, setUniforms]);

  // Initialize and setup
  useEffect(() => {
    if (!image) {
      setIsReady(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to match image
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const gl = initGL();
    if (!gl) return;

    const program = createShaderProgram(gl, effect);
    if (!program) return;

    const texture = uploadTexture(gl, image);
    if (!texture) return;

    setupBuffers(gl, program);

    stateRef.current = { gl, program, texture };
    setIsReady(true);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Clean up WebGL resources
      if (stateRef.current.gl) {
        const { gl, program, texture } = stateRef.current;
        if (texture) gl.deleteTexture(texture);
        if (program) gl.deleteProgram(program);
      }
    };
  }, [image, effect, initGL, createShaderProgram, uploadTexture, setupBuffers, canvasRef]);

  // Render when uniforms change
  useEffect(() => {
    if (isReady) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      render();
    }
  }, [isReady, uniforms, render]);

  // Download current canvas as image
  const downloadImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `shader-${effect}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [canvasRef, effect]);

  return { isReady, downloadImage };
}
