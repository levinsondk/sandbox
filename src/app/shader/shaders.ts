// Vertex shader - shared by all effects
export const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

// Pixelation fragment shader
export const pixelationFragmentShader = `
  precision mediump float;
  
  uniform sampler2D u_image;
  uniform vec2 u_resolution;
  uniform float u_pixelSize;
  uniform float u_colorDepth;
  uniform float u_smoothing;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec2 uv = v_texCoord;
    
    // Calculate pixelated coordinates
    vec2 pixelatedUV = floor(uv * u_resolution / u_pixelSize) * u_pixelSize / u_resolution;
    
    // Sample both original and pixelated
    vec4 originalColor = texture2D(u_image, uv);
    vec4 pixelatedColor = texture2D(u_image, pixelatedUV);
    
    // Reduce color depth
    float levels = u_colorDepth;
    pixelatedColor.rgb = floor(pixelatedColor.rgb * levels + 0.5) / levels;
    
    // Mix between pixelated and original based on smoothing
    vec4 finalColor = mix(pixelatedColor, originalColor, u_smoothing);
    
    gl_FragColor = finalColor;
  }
`;

// Dithering fragment shader with Bayer matrix
export const ditheringFragmentShader = `
  precision mediump float;
  
  uniform sampler2D u_image;
  uniform vec2 u_resolution;
  uniform float u_threshold;
  uniform float u_scale;
  uniform int u_ditherType; // 0 = 4x4, 1 = 8x8, 2 = ordered
  uniform int u_colorMode; // 0 = grayscale, 1 = 1-bit, 2 = limited palette
  
  varying vec2 v_texCoord;
  
  // Bayer 4x4 matrix
  float bayer4x4(vec2 pos) {
    int x = int(mod(pos.x, 4.0));
    int y = int(mod(pos.y, 4.0));
    int index = x + y * 4;
    
    // Bayer 4x4 pattern values (0-15 normalized to 0-1)
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
  
  // Bayer 8x8 approximation
  float bayer8x8(vec2 pos) {
    vec2 p = mod(pos, 8.0);
    float a = bayer4x4(p);
    float b = bayer4x4(p / 2.0);
    return (a + b / 4.0) / 1.25;
  }
  
  // Ordered dithering pattern
  float ordered(vec2 pos) {
    return fract(sin(dot(floor(pos), vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  void main() {
    vec2 uv = v_texCoord;
    vec4 color = texture2D(u_image, uv);
    
    // Get pixel position scaled
    vec2 pixelPos = uv * u_resolution / u_scale;
    
    // Get dither value based on type
    float ditherValue;
    if (u_ditherType == 0) {
      ditherValue = bayer4x4(pixelPos);
    } else if (u_ditherType == 1) {
      ditherValue = bayer8x8(pixelPos);
    } else {
      ditherValue = ordered(pixelPos);
    }
    
    // Apply threshold
    ditherValue = (ditherValue - 0.5) * u_threshold + 0.5;
    
    // Convert to grayscale for processing
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    
    vec3 outputColor;
    
    if (u_colorMode == 0) {
      // Grayscale dithering
      float dithered = step(ditherValue, gray);
      outputColor = vec3(dithered);
    } else if (u_colorMode == 1) {
      // 1-bit color per channel
      outputColor.r = step(ditherValue, color.r);
      outputColor.g = step(ditherValue, color.g);
      outputColor.b = step(ditherValue, color.b);
    } else {
      // Limited palette (8 colors)
      outputColor.r = step(ditherValue, color.r);
      outputColor.g = step(ditherValue, color.g);
      outputColor.b = step(ditherValue, color.b);
      // Add some mid-tones
      outputColor = mix(color.rgb, outputColor, 0.7);
    }
    
    gl_FragColor = vec4(outputColor, color.a);
  }
`;

// Chromatic aberration fragment shader
export const chromaticAberrationFragmentShader = `
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
  
  // Pseudo-random noise
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  void main() {
    vec2 uv = v_texCoord;
    
    // Calculate offset direction from angle
    float rad = u_angle * 3.14159265 / 180.0;
    vec2 direction = vec2(cos(rad), sin(rad));
    
    // Offset in pixels, converted to UV space
    vec2 offset = direction * u_offsetAmount / u_resolution;
    
    // Sample each color channel with different offsets
    float r = texture2D(u_image, uv + offset).r;
    float g = texture2D(u_image, uv).g;
    float b = texture2D(u_image, uv - offset).b;
    
    vec3 color = vec3(r, g, b);
    
    // Apply scanlines
    if (u_scanlines) {
      float scanline = sin(uv.y * u_resolution.y * 3.14159265) * 0.5 + 0.5;
      scanline = pow(scanline, 1.5);
      color *= 1.0 - (1.0 - scanline) * u_scanlineIntensity;
    }
    
    // Apply noise/grain
    if (u_noiseAmount > 0.0) {
      float noise = random(uv + u_time) * 2.0 - 1.0;
      color += noise * u_noiseAmount;
    }
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Grid fragment shader
export const gridFragmentShader = `
  precision mediump float;
  
  uniform sampler2D u_image;
  uniform vec2 u_resolution;
  uniform float u_cellSize;
  uniform float u_xSpread;
  uniform float u_ySpread;
  uniform float u_rotation;
  uniform float u_xOffset;
  uniform float u_yOffset;
  uniform int u_shapeType; // 0 = circle, 1 = square
  
  varying vec2 v_texCoord;
  
  // Rotate a point around a center
  vec2 rotate(vec2 point, vec2 center, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    vec2 p = point - center;
    return vec2(p.x * c - p.y * s, p.x * s + p.y * c) + center;
  }
  
  void main() {
    vec2 uv = v_texCoord;
    
    // Convert to pixel coordinates
    vec2 pixelCoord = uv * u_resolution;
    
    // Apply rotation around center
    float rad = u_rotation * 3.14159265 / 180.0;
    vec2 center = u_resolution * 0.5;
    vec2 rotatedCoord = rotate(pixelCoord, center, rad);
    
    // Apply offset
    rotatedCoord += vec2(u_xOffset, u_yOffset) * u_cellSize;
    
    // Calculate grid cell
    vec2 cellIndex = floor(rotatedCoord / u_cellSize);
    vec2 cellCenter = (cellIndex + 0.5) * u_cellSize;
    
    // Position within cell (normalized -0.5 to 0.5)
    vec2 posInCell = (rotatedCoord - cellCenter) / u_cellSize;
    
    // Calculate the sample UV by inverting the rotation for the cell center
    vec2 sampleCoord = rotate(cellCenter - vec2(u_xOffset, u_yOffset) * u_cellSize, center, -rad);
    vec2 sampleUV = sampleCoord / u_resolution;
    
    // Clamp sample UV to valid range
    sampleUV = clamp(sampleUV, 0.0, 1.0);
    
    // Sample image color at cell center
    vec4 cellColor = texture2D(u_image, sampleUV);
    
    // Calculate shape radius based on spread
    // spread of 0 = shapes fill the cell, spread of 1 = tiny shapes
    float xRadius = 0.5 * (1.0 - u_xSpread * 0.9);
    float yRadius = 0.5 * (1.0 - u_ySpread * 0.9);
    
    // Determine if pixel is inside shape
    float inside;
    if (u_shapeType == 0) {
      // Circle (ellipse with spread)
      vec2 normalizedPos = posInCell / vec2(xRadius, yRadius);
      float dist = length(normalizedPos);
      inside = 1.0 - smoothstep(0.9, 1.0, dist);
    } else {
      // Square (rectangle with spread)
      vec2 absPos = abs(posInCell);
      float xInside = 1.0 - smoothstep(xRadius - 0.02, xRadius, absPos.x);
      float yInside = 1.0 - smoothstep(yRadius - 0.02, yRadius, absPos.y);
      inside = xInside * yInside;
    }
    
    // Output: shape color or transparent background
    vec3 bgColor = vec3(0.0);
    vec3 finalColor = mix(bgColor, cellColor.rgb, inside);
    float finalAlpha = inside;
    
    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

// Shader effect types
export type ShaderEffect = 'pixelation' | 'dithering' | 'chromatic' | 'grid';

export const shaderPrograms: Record<ShaderEffect, string> = {
  pixelation: pixelationFragmentShader,
  dithering: ditheringFragmentShader,
  chromatic: chromaticAberrationFragmentShader,
  grid: gridFragmentShader,
};
