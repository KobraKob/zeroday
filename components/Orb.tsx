"use client";

import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle, Vec2, Vec3 } from "ogl";

const DEFAULT_COLORS = ["#3b82f6", "#3b82f6", "#4146dd"];

export interface OrbProps {
  colors?: string[];
  hoverIntensity?: number;
  trail?: number;
  rotateOnHover?: boolean;
  followCursor?: boolean;
}

const vertexShader = [
  "precision highp float;",
  "attribute vec2 position;",
  "attribute vec2 uv;",
  "varying vec2 vUv;",
  "void main() {",
  "  vUv = uv;",
  "  gl_Position = vec4(position, 0.0, 1.0);",
  "}",
].join("\n");

const fragmentShader = [
  "precision highp float;",
  "varying vec2 vUv;",
  "uniform vec3 iResolution;",
  "uniform float iTime;",
  "uniform vec2 uPointer;",
  "uniform float uHover;",
  "uniform float uRotation;",
  "uniform float uHoverIntensity;",
  "uniform float uTrail;",
  "uniform vec3 uColorA;",
  "uniform vec3 uColorB;",
  "uniform vec3 uColorC;",
  "",
  "float hash21(vec2 p) {",
  "  p = fract(p * vec2(123.34, 456.21));",
  "  p += dot(p, p + 45.32);",
  "  return fract(p.x * p.y);",
  "}",
  "",
  "float noise(vec2 p) {",
  "  vec2 i = floor(p);",
  "  vec2 f = fract(p);",
  "  f = f * f * (3.0 - 2.0 * f);",
  "  float a = hash21(i);",
  "  float b = hash21(i + vec2(1.0, 0.0));",
  "  float c = hash21(i + vec2(0.0, 1.0));",
  "  float d = hash21(i + vec2(1.0, 1.0));",
  "  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);",
  "}",
  "",
  "float fbm(vec2 p) {",
  "  float value = 0.0;",
  "  float amplitude = 0.5;",
  "  for (int i = 0; i < 4; i++) {",
  "    value += amplitude * noise(p);",
  "    p = p * 2.02 + vec2(17.1, 9.2);",
  "    amplitude *= 0.5;",
  "  }",
  "  return value;",
  "}",
  "",
  "void main() {",
  "  vec2 p = (gl_FragCoord.xy - iResolution.xy * 0.5) / min(iResolution.x, iResolution.y) * 2.0;",
  "  float radius = length(p);",
  "  float angle = atan(p.y, p.x) + uRotation;",
  "  float time = iTime * 0.72;",
  "  p += uPointer * uHover * uHoverIntensity * 0.12 * (1.0 - smoothstep(0.15, 0.9, radius));",
  "  float turbulence = fbm(p * 4.0 + vec2(time * 0.18, -time * 0.13));",
  "  float wave = sin(angle * 3.0 - radius * 20.0 + time * 1.65 + turbulence * 4.2);",
  "  float ribbon = pow(max(0.0, sin(angle * 2.0 + radius * 16.0 - time * 1.3 + turbulence * 5.0)), 6.0);",
  "  float field = 0.5 + 0.5 * sin(angle * 1.8 + turbulence * 4.4 + time * 0.82 - radius * 11.0);",
  "  vec3 color = mix(uColorA, uColorB, clamp(field + wave * 0.14, 0.0, 1.0));",
  "  color = mix(color, uColorC, smoothstep(0.05, 0.95, 0.5 + 0.5 * sin(angle * 2.2 - time * 0.7 + turbulence * 3.0)));",
  "  color *= 0.72 + wave * 0.20 + ribbon * uTrail * 0.75;",
  "  float core = exp(-radius * radius * 6.0);",
  "  float rim = exp(-pow((radius - 0.71) * 11.0, 2.0));",
  "  color += uColorA * core * 0.45 + uColorB * rim * 0.32;",
  "  float inside = 1.0 - smoothstep(0.74, 0.94, radius);",
  "  float alpha = inside * clamp(0.72 + wave * 0.10 + ribbon * uTrail * 0.46 + rim * 0.16, 0.0, 1.0);",
  "  gl_FragColor = vec4(clamp(color, 0.0, 1.0), alpha);",
  "}",
].join("\n");

function hexToVec3(value: string): Vec3 {
  const match = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return new Vec3(0.23, 0.51, 0.96);
  const hex = match[1];
  return new Vec3(
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255
  );
}

export default function Orb({
  colors = DEFAULT_COLORS,
  hoverIntensity = 0.2,
  trail = 0.65,
  rotateOnHover = true,
  followCursor = true,
}: OrbProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({ alpha: true, premultipliedAlpha: false, antialias: true });
    } catch {
      return;
    }

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.canvas.style.display = "block";
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.pointerEvents = "none";
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    const palette = [
      colors[0] || DEFAULT_COLORS[0],
      colors[1] || colors[0] || DEFAULT_COLORS[1],
      colors[2] || colors[1] || DEFAULT_COLORS[2],
    ];
    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new Vec3(1, 1, 1) },
      uPointer: { value: new Vec2(0, 0) },
      uHover: { value: 0 },
      uRotation: { value: 0 },
      uHoverIntensity: { value: hoverIntensity },
      uTrail: { value: Math.max(0, Math.min(trail, 2)) },
      uColorA: { value: hexToVec3(palette[0]) },
      uColorB: { value: hexToVec3(palette[1]) },
      uColorC: { value: hexToVec3(palette[2]) },
    };
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new Mesh(gl, { geometry, program });

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let rafId = 0;
    let lastFrame = 0;
    let rotation = 0;
    let targetHover = 0;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
      renderer.setSize(Math.round(width * pixelRatio), Math.round(height * pixelRatio));
      gl.canvas.style.width = width + "px";
      gl.canvas.style.height = height + "px";
      uniforms.iResolution.value.set(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height);
    };

    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const dx = event.clientX - (rect.left + width / 2);
      const dy = event.clientY - (rect.top + height / 2);
      const normalizedDistance = Math.hypot(dx / (width / 2), dy / (height / 2));
      targetHover = normalizedDistance < 1.22 ? 1 : 0;
      pointer.targetX = followCursor ? clamp(dx / (width * 0.72), -1, 1) : 0;
      pointer.targetY = followCursor ? clamp(-dy / (height * 0.72), -1, 1) : 0;
    };

    const handleWindowBlur = () => {
      targetHover = 0;
      pointer.targetX = 0;
      pointer.targetY = 0;
    };

    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(container);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", handleWindowBlur);
    resize();

    const render = (now: number) => {
      const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0;
      lastFrame = now;
      uniforms.iTime.value = reducedMotion ? 0 : now * 0.001;
      uniforms.uHover.value += (targetHover - uniforms.uHover.value) * 0.12;
      pointer.x += (pointer.targetX - pointer.x) * 0.08;
      pointer.y += (pointer.targetY - pointer.y) * 0.08;
      uniforms.uPointer.value.set(pointer.x, pointer.y);
      if (!reducedMotion && rotateOnHover && targetHover > 0.1) rotation += delta * 0.9;
      uniforms.uRotation.value = rotation;
      renderer.render({ scene: mesh });
      if (!reducedMotion) rafId = window.requestAnimationFrame(render);
    };

    if (reducedMotion) {
      render(0);
    } else {
      rafId = window.requestAnimationFrame(render);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", handleWindowBlur);
      if (gl.canvas.parentElement === container) container.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [colors, hoverIntensity, trail, rotateOnHover, followCursor]);

  return <div ref={containerRef} className="ask-orb-canvas" aria-hidden="true" />;
}
