// src/features/home/components/MoltenMetal.jsx
//
// Fondo de "metal fundido" en WebGL. Misma API de props que el componente
// MoltenMetal de React Bits, pero escrito sin dependencias (WebGL puro) para
// no sumar librerías al proyecto.
//
// - Renderiza a media resolución: es un fondo difuso, no necesita más.
// - Se detiene fuera de pantalla, con la pestaña oculta o con `paused`.
// - Con prefers-reduced-motion dibuja un solo cuadro estático.
// - El mouse se escucha en `window`, así funciona aunque el canvas esté
//   detrás del contenido (pointer-events: none).

import { useEffect, useRef } from "react";

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;
uniform float uTime;
uniform vec3  uC1;
uniform vec3  uC2;
uniform vec3  uCore;
uniform float uScale, uDetail, uGlow, uThick, uHaze, uSwirl, uTurb;
uniform float uBright, uGrain, uOpacity, uIntro, uLight, uMolten, uDrift;
uniform vec2  uOffset, uMouse;
uniform float uMouseStr, uMouseAct, uRot;
uniform vec3  uFlare; // x, y, edad en segundos (negativa = sin destello)

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = rot(0.5) * 2.02;
  for (int i = 0; i < 6; i++) {
    if (float(i) >= uDetail) break;
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

void main() {
  float minSide = min(uRes.x, uRes.y);
  vec2 base = (gl_FragCoord.xy - 0.5 * uRes) / minSide;
  float t = uTime;

  // Mouse: empuja suavemente el metal alrededor del cursor
  vec2 d = base - uMouse;
  float push = exp(-dot(d, d) * 5.0) * uMouseStr * uMouseAct;
  vec2 p = base + normalize(d + 1e-4) * push * 0.22;

  p = rot(uRot) * p + uOffset;
  p += uDrift * t * vec2(0.12, 0.05);

  // Remolino que se desvanece hacia los bordes
  float r = length(p);
  p = rot(uSwirl * 0.9 * sin(t * 0.25) * (1.0 - smoothstep(0.0, 1.6, r))) * p;
  p *= uScale * 0.5;

  // Deformación de dominio: da el aspecto de líquido viscoso
  vec2 q = vec2(fbm(p + t * 0.20), fbm(p + vec2(5.2, 1.3) - t * 0.15));
  vec2 w = vec2(fbm(p + 3.5 * q + vec2(1.7, 9.2) + t * 0.10),
                fbm(p + 3.5 * q + vec2(8.3, 2.8) - t * 0.12));
  float f = fbm(p + (2.0 + 4.0 * uTurb) * w);

  float heat = smoothstep(0.18, 0.95, f * (0.55 + 0.45 * uThick) + 0.35 * length(q));

  // Destello al hacer clic: anillo que se expande y se apaga
  float flare = 0.0;
  if (uFlare.z >= 0.0) {
    float fd = length(base - uFlare.xy);
    float ring = (fd - uFlare.z * 0.9) * 7.0;
    flare = exp(-ring * ring) * exp(-uFlare.z * 1.6);
  }
  heat = clamp(heat + flare * 0.6, 0.0, 1.0);

  vec3 col = mix(uC1, uC2, smoothstep(0.15, 0.85, f));
  if (uMolten > 0.5) {
    col = mix(col, uCore, pow(heat, 3.0) * 0.85);
  }
  col += uC2 * pow(heat, 2.0) * uGlow * 0.35;
  col += uCore * flare * 0.5;
  col *= uBright;

  // Neblina base (haze) + cuerpo del metal
  float alpha = uHaze * 0.35 * (0.4 + f) + heat * 0.75;
  alpha = clamp(alpha, 0.0, 1.0);
  if (uLight > 0.5) alpha *= 0.8; // sobre fondo claro, más transparente

  alpha *= uOpacity * uIntro;

  float g = (hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5) * uGrain;
  vec3 outCol = clamp(col + g, 0.0, 1.0);

  gl_FragColor = vec4(outCol * alpha, alpha); // alfa premultiplicado
}
`;

function hexToRgb(hex) {
  const clean = String(hex).replace("#", "");
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean.padEnd(6, "0");
  const n = parseInt(full.slice(0, 6), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("MoltenMetal shader:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const RENDER_SCALE = 0.5; // fracción de la resolución CSS con la que se dibuja

export default function MoltenMetal({
  colors = ["#5227FF", "#FF9FFC"],
  coreColor = "#FFFFFF",
  speed = 0.35,
  scale = 4,
  detail = 3,
  glow = 1.6,
  thickness = 1,
  haze = 0.75,
  mouseInteraction = true,
  flareOnClick = true,
  lightMode = false,
  swirl = 1,
  turbulence = 0.2,
  brightness = 1.3,
  colorMode = "molten", // "molten" | "gradient"
  rotation = 0,
  offsetX = 0,
  offsetY = 0,
  grain = 0.05,
  opacity = 1,
  drift = 0.3,
  intro = true,
  mouseStrength = 0.5,
  paused = false,
  className = "",
  style,
}) {
  const canvasRef = useRef(null);
  const propsRef = useRef({});
  const redrawRef = useRef(() => {});

  // Siempre las props más recientes, sin reiniciar el contexto WebGL
  useEffect(() => {
    propsRef.current = {
      colors: [hexToRgb(colors[0]), hexToRgb(colors[1] ?? colors[0])],
      core: hexToRgb(coreColor),
      speed, scale, detail, glow, thickness, haze, mouseInteraction, flareOnClick,
      lightMode, swirl, turbulence, brightness, molten: colorMode === "molten",
      rotation, offsetX, offsetY, grain, opacity, drift, intro, mouseStrength, paused,
    };
    redrawRef.current();
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let gl = null;
    let program = null;
    let uniforms = {};
    let rafId = 0;
    let visible = true;
    let lastFrame = performance.now();
    let clock = 0; // tiempo propio: respeta pausas y `speed`
    let introClock = 0;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0, act: 0, tact: 0 };
    const flare = { x: 0, y: 0, age: -1 };

    const init = () => {
      gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
      if (!gl) return false;

      const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
      const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
      if (!vs || !fs) return false;

      program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(program, "aPos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      uniforms = {};
      [
        "uRes", "uTime", "uC1", "uC2", "uCore", "uScale", "uDetail", "uGlow", "uThick",
        "uHaze", "uSwirl", "uTurb", "uBright", "uGrain", "uOpacity", "uIntro", "uLight",
        "uMolten", "uDrift", "uOffset", "uMouse", "uMouseStr", "uMouseAct", "uRot", "uFlare",
      ].forEach((name) => {
        uniforms[name] = gl.getUniformLocation(program, name);
      });
      return true;
    };

    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * RENDER_SCALE));
      const h = Math.max(1, Math.round(canvas.clientHeight * RENDER_SCALE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    const draw = () => {
      if (!gl || !program || gl.isContextLost()) return;
      const p = propsRef.current;
      if (!p.colors) return;

      resize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      introClock = Math.min(introClock, 3);
      const introT = p.intro ? Math.min(introClock / 2.5, 1) : 1;

      gl.uniform2f(uniforms.uRes, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, clock);
      gl.uniform3fv(uniforms.uC1, p.colors[0]);
      gl.uniform3fv(uniforms.uC2, p.colors[1]);
      gl.uniform3fv(uniforms.uCore, p.core);
      gl.uniform1f(uniforms.uScale, p.scale);
      gl.uniform1f(uniforms.uDetail, p.detail);
      gl.uniform1f(uniforms.uGlow, p.glow);
      gl.uniform1f(uniforms.uThick, p.thickness);
      gl.uniform1f(uniforms.uHaze, p.haze);
      gl.uniform1f(uniforms.uSwirl, p.swirl);
      gl.uniform1f(uniforms.uTurb, p.turbulence);
      gl.uniform1f(uniforms.uBright, p.brightness);
      gl.uniform1f(uniforms.uGrain, p.grain);
      gl.uniform1f(uniforms.uOpacity, p.opacity);
      gl.uniform1f(uniforms.uIntro, introT * introT * (3 - 2 * introT));
      gl.uniform1f(uniforms.uLight, p.lightMode ? 1 : 0);
      gl.uniform1f(uniforms.uMolten, p.molten ? 1 : 0);
      gl.uniform1f(uniforms.uDrift, p.drift);
      gl.uniform2f(uniforms.uOffset, p.offsetX, p.offsetY);
      gl.uniform2f(uniforms.uMouse, mouse.x, mouse.y);
      gl.uniform1f(uniforms.uMouseStr, p.mouseStrength);
      gl.uniform1f(uniforms.uMouseAct, p.mouseInteraction ? mouse.act : 0);
      gl.uniform1f(uniforms.uRot, (p.rotation * Math.PI) / 180);
      gl.uniform3f(uniforms.uFlare, flare.x, flare.y, flare.age);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const animating = () => !propsRef.current.paused && !reduceMotion && visible && !document.hidden;

    const frame = (now) => {
      rafId = 0;
      const dt = Math.min((now - lastFrame) / 1000, 0.1);
      lastFrame = now;

      const p = propsRef.current;
      clock += dt * p.speed;
      introClock += dt;

      const ease = 1 - Math.exp(-dt * 6);
      mouse.x += (mouse.tx - mouse.x) * ease;
      mouse.y += (mouse.ty - mouse.y) * ease;
      mouse.act += (mouse.tact - mouse.act) * ease;
      if (flare.age >= 0) {
        flare.age += dt;
        if (flare.age > 3) flare.age = -1;
      }

      draw();
      if (animating()) rafId = requestAnimationFrame(frame);
    };

    const start = () => {
      if (rafId || !animating()) return;
      lastFrame = performance.now();
      rafId = requestAnimationFrame(frame);
    };

    // Cuando no hay animación (pausa / movimiento reducido) se redibuja a pedido
    redrawRef.current = () => {
      if (reduceMotion) introClock = 3;
      if (animating()) start();
      else draw();
    };

    // Posición del puntero en el mismo espacio que usa el shader
    const toShaderSpace = (event) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      const side = Math.min(rect.width, rect.height);
      const inside =
        event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom;
      return {
        inside,
        x: (event.clientX - rect.left - rect.width / 2) / side,
        y: (rect.height / 2 - (event.clientY - rect.top)) / side,
      };
    };

    const onMove = (event) => {
      if (!propsRef.current.mouseInteraction) return;
      const pos = toShaderSpace(event);
      if (!pos) return;
      mouse.tx = pos.x;
      mouse.ty = pos.y;
      mouse.tact = pos.inside ? 1 : 0;
    };

    const onDown = (event) => {
      if (!propsRef.current.flareOnClick) return;
      const pos = toShaderSpace(event);
      if (!pos || !pos.inside) return;
      flare.x = pos.x;
      flare.y = pos.y;
      flare.age = 0;
      start();
    };

    const onLeave = () => {
      mouse.tact = 0;
    };

    const onVisibility = () => (animating() ? start() : undefined);

    const onLost = (event) => {
      event.preventDefault();
      cancelAnimationFrame(rafId);
      rafId = 0;
    };
    const onRestored = () => {
      if (init()) redrawRef.current();
    };

    if (!init()) return undefined; // sin WebGL: se ve el fondo normal de la página

    const resizeObserver = new ResizeObserver(() => redrawRef.current());
    resizeObserver.observe(canvas);

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    intersection.observe(canvas);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    redrawRef.current();

    return () => {
      cancelAnimationFrame(rafId);
      redrawRef.current = () => {};
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      // No se pierde el contexto a propósito: en StrictMode (dev) el efecto se monta dos veces
      // sobre el mismo canvas y un contexto perdido dejaría el fondo en blanco.
      if (gl && program) gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ display: "block", width: "100%", height: "100%", pointerEvents: "none", ...style }}
    />
  );
}
