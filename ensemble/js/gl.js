/**
 * Resonance of Light - v4 Shader
 * Additive blending of multiple sine waves to create interference patterns.
 * "Ensemble" = Distinct wavelengths (Architecture & Implementation) merging into white light.
 */

const VS = `attribute vec2 a_pos;void main(){gl_Position=vec4(a_pos,0,1);}`;
const FS = `
precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_mouse;
uniform float u_scroll;

#define PI 3.14159265359

// Hash function for noise
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

// 2D Noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Sine Wave Function
float wave(vec2 uv, float frequency, float amplitude, float speed, float offset) {
    float x = uv.x * frequency + u_time * speed + offset;
    float y = sin(x) * amplitude;
    return 0.01 / abs(uv.y - y); // Glowing line effect
}

// FBM for subtle background texture
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y; // Center origin, correct aspect
    
    // Mouse interaction
    vec2 mouse = (u_mouse - 0.5 * u_res) / u_res.y;
    mouse.y *= -1.0; // Correct mouse Y direction
    float dist = length(uv - mouse);
    
    // Base colors
    vec3 col = vec3(0.0);
    
    // Scroll influence
    float s = u_scroll * 5.0; // Amplify scroll effect
    
    // Wave 1: Architecture (Cyan/Blue)
    float w1 = wave(uv, 3.0 + s * 0.5, 0.3 + sin(u_time * 0.5) * 0.1, 0.5, 0.0);
    vec3 col1 = vec3(0.1, 0.6, 1.0) * w1 * (1.0 + smoothstep(0.5, 0.0, dist)); // Brighten near mouse
    
    // Wave 2: Implementation (Magenta/Purple)
    float w2 = wave(uv, 4.5 + s * 0.7, 0.25 + cos(u_time * 0.7) * 0.1, -0.4, 2.0);
    vec3 col2 = vec3(0.9, 0.1, 1.0) * w2 * (1.0 + smoothstep(0.5, 0.0, dist));
    
    // Wave 3: Chaos/Noise (Green/Yellow - subtle)
    float n = fbm(uv * 3.0 + u_time * 0.1);
    float w3 = 0.005 / abs(uv.y - (n - 0.5) * 0.5 - sin(uv.x * 10.0 + u_time) * 0.05);
    vec3 col3 = vec3(0.2, 0.8, 0.5) * w3 * (0.2 + s * 0.1); // Becomes more visible with scroll
    
    // Resonance: Additive Blending
    col = col1 + col2 + col3;
    
    // Central Glow (Ensemble)
    float glow = 0.0;
    // When waves cross center or scroll is high, add white glow
    float center = 1.0 - smoothstep(0.0, 0.5, length(uv));
    glow = center * (0.1 + sin(u_time) * 0.05 + s * 0.2);
    col += vec3(glow);

    // Vignette
    col *= 1.0 - dot(uv, uv) * 1.5;

    gl_FragColor = vec4(col, 1.0);
}
`;

class ShaderHarness {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!this.gl) return;

    this.uniforms = {};
    this.mouse = { x: 0, y: 0 };
    this.scroll = 0;

    this.init();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    this.loop();
  }

  init() {
    const gl = this.gl;
    const vs = this.createShader(gl.VERTEX_SHADER, VS);
    const fs = this.createShader(gl.FRAGMENT_SHADER, FS);
    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);
    gl.useProgram(this.program);

    // Buffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(this.program, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    ['u_time', 'u_res', 'u_mouse', 'u_scroll'].forEach(name => {
      this.uniforms[name] = gl.getUniformLocation(this.program, name);
    });
  }

  createShader(type, source) {
    const s = this.gl.createShader(type);
    this.gl.shaderSource(s, source);
    this.gl.compileShader(s);
    if (!this.gl.getShaderParameter(s, this.gl.COMPILE_STATUS)) {
      console.error(this.gl.getShaderInfoLog(s));
    }
    return s;
  }

  resize() {
    // High DPI support
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  setScroll(s) {
    this.scroll = s;
  }

  loop() {
    const gl = this.gl;
    const time = performance.now() * 0.001;

    gl.uniform1f(this.uniforms.u_time, time);
    gl.uniform2f(this.uniforms.u_res, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.uniforms.u_mouse, this.mouse.x, this.mouse.y);
    gl.uniform1f(this.uniforms.u_scroll, this.scroll);

    // Additive Blend Mode for Light Effects (handled in shader logic mostly, but helpful here too if needed)
    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(() => this.loop());
  }
}

window.ShaderHarness = ShaderHarness;
