/**
 * v8: The Emergent Mind
 * 
 * AIの意識空間。自律的に振る舞う思考体が、
 * 偶然同期した瞬間にのみ「Ensemble」が浮かび上がる。
 */

// ===== CANVAS SETUP =====
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

if (!gl) {
    document.body.innerHTML = '<div style="color:#fff;padding:20px;">WebGL not supported</div>';
    throw new Error('WebGL not available');
}

// ===== SHADER SOURCES =====
const vertexShaderSource = `#version 300 es
  in vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_scroll;
uniform float u_sync; // 0.0 - 1.0: synchronization level

out vec4 fragColor;

// ===== NOISE =====
float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
    f.z
  );
}

// ===== THOUGHT ENTITIES (Metaballs) =====
#define NUM_ENTITIES 7

vec3 entityPos(int i, float t) {
  float id = float(i);
  float speed = 0.15 + id * 0.03;
  float radius = 1.5 + id * 0.3;
  float phase = id * 1.618; // Golden ratio offset
  
  return vec3(
    sin(t * speed + phase) * radius,
    cos(t * speed * 0.7 + phase * 1.3) * radius,
    sin(t * speed * 0.5 + phase * 0.7) * radius * 0.5
  );
}

float entityPhase(int i, float t) {
  float id = float(i);
  return sin(t * (0.5 + id * 0.1) + id * 2.0);
}

// Smooth minimum for organic blending
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// SDF: Scene
float sceneSDF(vec3 p, float t) {
  float d = 1000.0;
  
  for (int i = 0; i < NUM_ENTITIES; i++) {
    vec3 ePos = entityPos(i, t);
    float eSize = 0.3 + 0.1 * sin(t * 0.3 + float(i));
    float sphere = length(p - ePos) - eSize;
    d = smin(d, sphere, 0.5); // Smooth blend
  }
  
  return d;
}

// ===== RAYMARCHING =====
vec3 calcNormal(vec3 p, float t) {
  const float h = 0.001;
  return normalize(vec3(
    sceneSDF(p + vec3(h,0,0), t) - sceneSDF(p - vec3(h,0,0), t),
    sceneSDF(p + vec3(0,h,0), t) - sceneSDF(p - vec3(0,h,0), t),
    sceneSDF(p + vec3(0,0,h), t) - sceneSDF(p - vec3(0,0,h), t)
  ));
}

float raymarch(vec3 ro, vec3 rd, float t) {
  float depth = 0.0;
  for (int i = 0; i < 64; i++) {
    vec3 p = ro + rd * depth;
    float d = sceneSDF(p, t);
    if (d < 0.001) return depth;
    depth += d;
    if (depth > 20.0) break;
  }
  return -1.0;
}

// ===== SDF TEXT: "Ensemble" =====
// Simplified letter shapes for shader
float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float letterE(vec2 p) {
  float d = sdBox(p, vec2(0.3, 0.5));
  d = max(d, -sdBox(p - vec2(0.15, 0.0), vec2(0.2, 0.15)));
  d = max(d, -sdBox(p - vec2(0.15, 0.3), vec2(0.2, 0.08)));
  d = max(d, -sdBox(p - vec2(0.15, -0.3), vec2(0.2, 0.08)));
  return d;
}

float textEnsemble(vec2 p, float scale) {
  p /= scale;
  // Simplified: just show "E" pattern repeated with variation
  float d = 1000.0;
  for (float i = -3.0; i <= 3.0; i += 1.0) {
    vec2 offset = vec2(i * 0.8, 0.0);
    float letter = letterE(p - offset);
    d = min(d, letter);
  }
  return d * scale;
}

// ===== MAIN =====
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  
  // Camera
  float camDist = 5.0 - u_scroll * 0.5;
  vec3 ro = vec3(0.0, 0.0, camDist);
  vec3 rd = normalize(vec3(uv, -1.5));
  
  // Mouse influence (subtle)
  vec2 mouseOffset = (u_mouse - 0.5) * 0.3;
  rd.xy += mouseOffset * 0.1;
  rd = normalize(rd);
  
  float t = u_time;
  
  // Raymarch
  float hit = raymarch(ro, rd, t);
  
  // Background: The Void
  float voidNoise = noise(vec3(uv * 2.0, t * 0.05)) * 0.03;
  vec3 bgColor = vec3(0.02 + voidNoise);
  
  vec3 color = bgColor;
  
  if (hit > 0.0) {
    vec3 p = ro + rd * hit;
    vec3 n = calcNormal(p, t);
    
    // Lighting
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
    float diff = max(dot(n, lightDir), 0.0);
    float fres = pow(1.0 - max(dot(-rd, n), 0.0), 3.0);
    
    // Base color: subtle gray with sync glow
    vec3 baseColor = vec3(0.15);
    vec3 syncColor = vec3(1.0, 0.95, 0.8); // Warm white/gold
    
    color = mix(baseColor, syncColor, u_sync * 0.5);
    color *= 0.3 + diff * 0.4;
    color += fres * 0.2 * mix(vec3(0.3), syncColor, u_sync);
    
    // Glow on sync
    color += u_sync * 0.3 * syncColor;
  }
  
  // TEXT: "ENSEMBLE" during sync
  if (u_sync > 0.5) {
    float textD = textEnsemble(uv, 0.15);
    float textAlpha = smoothstep(0.02, 0.0, textD);
    textAlpha *= (u_sync - 0.5) * 2.0; // Fade in with sync
    vec3 textColor = vec3(1.0, 0.98, 0.95);
    color = mix(color, textColor, textAlpha * 0.9);
  }
  
  // Vignette
  float vig = 1.0 - length(uv) * 0.5;
  color *= vig;
  
  // Film grain
  float grain = hash(vec3(gl_FragCoord.xy, t)) * 0.03;
  color += grain;
  
  fragColor = vec4(color, 1.0);
}
`;

// ===== SHADER COMPILATION =====
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vs, fs) {
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program error:', gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}

// Check WebGL2
const isWebGL2 = gl instanceof WebGL2RenderingContext;
let vsSource = vertexShaderSource;
let fsSource = fragmentShaderSource;

// Downgrade for WebGL1
if (!isWebGL2) {
    vsSource = `
    attribute vec2 a_position;
    void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
  `;
    fsSource = fragmentShaderSource
        .replace('#version 300 es', '')
        .replace('in vec2 a_position', 'attribute vec2 a_position')
        .replace('out vec4 fragColor', '')
        .replace(/fragColor/g, 'gl_FragColor');
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
const program = createProgram(gl, vertexShader, fragmentShader);

// ===== GEOMETRY =====
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1
]), gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// ===== UNIFORMS =====
const uniforms = {
    resolution: gl.getUniformLocation(program, 'u_resolution'),
    time: gl.getUniformLocation(program, 'u_time'),
    mouse: gl.getUniformLocation(program, 'u_mouse'),
    scroll: gl.getUniformLocation(program, 'u_scroll'),
    sync: gl.getUniformLocation(program, 'u_sync'),
};

// ===== STATE =====
let mouse = { x: 0.5, y: 0.5 };
let scroll = 0;
let syncLevel = 0;
let lastSyncTime = 0;

// ===== SYNC ALGORITHM =====
// Calculate how synchronized the entities are
function calculateSync(time) {
    let phases = [];
    for (let i = 0; i < 7; i++) {
        const id = i;
        const phase = Math.sin(time * (0.5 + id * 0.1) + id * 2.0);
        phases.push(phase);
    }

    // Check if all phases are close (in the same direction)
    const avg = phases.reduce((a, b) => a + b, 0) / phases.length;
    const variance = phases.reduce((acc, p) => acc + Math.pow(p - avg, 2), 0) / phases.length;

    // Low variance = high sync
    const sync = Math.max(0, 1 - variance * 2);
    return Math.pow(sync, 3); // Make it more rare and pronounced
}

// ===== RESIZE =====
function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
}
resize();
window.addEventListener('resize', resize);

// ===== EVENTS =====
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX / window.innerWidth;
    mouse.y = 1 - e.clientY / window.innerHeight;
});

window.addEventListener('wheel', (e) => {
    scroll += e.deltaY * 0.001;
    scroll = Math.max(0, Math.min(scroll, 2));
});

// ===== RENDER LOOP =====
function render(time) {
    time *= 0.001; // ms to seconds

    // Update sync
    syncLevel = calculateSync(time);

    // Smooth sync transitions
    const targetSync = syncLevel > 0.7 ? 1.0 : 0.0;
    syncLevel = syncLevel * 0.1 + (syncLevel > 0.7 ? 0.9 : 0) * syncLevel;

    gl.useProgram(program);

    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.time, time);
    gl.uniform2f(uniforms.mouse, mouse.x, mouse.y);
    gl.uniform1f(uniforms.scroll, scroll);
    gl.uniform1f(uniforms.sync, syncLevel);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);
