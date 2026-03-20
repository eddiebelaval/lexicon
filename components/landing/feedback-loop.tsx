'use client';

import { useEffect, useRef } from 'react';

interface FeedbackLoopProps {
  className?: string;
}

// ── Shared vertex shader ──
const VERT_SRC = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// ── Feedback shader: read previous frame, zoom + rotate + color shift, draw seeds ──
const FEEDBACK_FRAG_SRC = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_prev;
uniform float u_time;
uniform vec2 u_res;
uniform float u_zoomSpeed;
uniform float u_rotSpeed;
uniform vec2 u_mouse;

#define PI 3.14159265359
#define TAU 6.28318530718

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float sdHexagon(vec2 p, float r) {
  vec2 q = abs(p);
  return max(q.x - r * 0.866, max(q.x * 0.5 + q.y * 0.866 - r * 0.866, q.y - r * 0.5));
}

float sdTriangle(vec2 p, float r) {
  float k = sqrt(3.0);
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdStar(vec2 p, float r, int n, float m) {
  float an = PI / float(n);
  float en = PI / m;
  vec2 acs = vec2(cos(an), sin(an));
  vec2 ecs = vec2(cos(en), sin(en));
  float bn = mod(atan(p.x, p.y), 2.0 * an) - an;
  p = length(p) * vec2(cos(bn), abs(sin(bn)));
  p -= r * acs;
  p += ecs * clamp(-dot(p, ecs), 0.0, r * acs.y / ecs.y);
  return length(p) * sign(p.x);
}

vec2 rot2(vec2 p, float a) {
  float c = cos(a), s = sin(a);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_res.x / u_res.y;
  float t = u_time;

  vec2 mouseOffset = (u_mouse - 0.5) * 0.15;

  vec2 center = vec2(0.5) + mouseOffset;
  vec2 fromCenter = uv - center;

  fromCenter.x *= aspect;

  float zoomAmt = 0.02 + 0.008 * sin(t * 0.3);
  zoomAmt *= u_zoomSpeed;
  float zoom = 1.0 - zoomAmt;
  fromCenter *= zoom;

  float rotAmt = 0.008 + 0.004 * sin(t * 0.5);
  rotAmt *= u_rotSpeed;
  rotAmt *= sin(t * 0.07);
  fromCenter = rot2(fromCenter, rotAmt);

  fromCenter.x /= aspect;

  vec2 feedbackUV = fromCenter + center;

  float chromShift = 0.002;
  vec2 rUV = feedbackUV + vec2(chromShift, 0.0);
  vec2 gUV = feedbackUV;
  vec2 bUV = feedbackUV - vec2(chromShift, 0.0);

  vec3 feedback = vec3(
    texture2D(u_prev, rUV).r,
    texture2D(u_prev, gUV).g,
    texture2D(u_prev, bUV).b
  );

  float hueShift = 0.012;
  float cs = cos(hueShift), sn = sin(hueShift);
  float oneThird = 1.0 / 3.0;
  float sqrtThird = 0.57735;
  mat3 hueMatrix = mat3(
    cs + oneThird * (1.0 - cs),             oneThird * (1.0 - cs) - sqrtThird * sn, oneThird * (1.0 - cs) + sqrtThird * sn,
    oneThird * (1.0 - cs) + sqrtThird * sn, cs + oneThird * (1.0 - cs),             oneThird * (1.0 - cs) - sqrtThird * sn,
    oneThird * (1.0 - cs) - sqrtThird * sn, oneThird * (1.0 - cs) + sqrtThird * sn, cs + oneThird * (1.0 - cs)
  );
  feedback = hueMatrix * feedback;

  feedback *= 0.96;

  float inBounds = step(0.0, feedbackUV.x) * step(feedbackUV.x, 1.0) *
                   step(0.0, feedbackUV.y) * step(feedbackUV.y, 1.0);
  feedback *= inBounds;

  vec2 seedCenter = vec2(0.5) + mouseOffset * 0.5;
  vec2 sp = uv - seedCenter;
  sp.x *= aspect;

  float mouseDist = length(u_mouse - 0.5);
  float seedScale = 0.06 + mouseDist * 0.04;

  float shapeCycle = mod(t * 0.15, 4.0);
  float shapeBlend = fract(shapeCycle);
  float shapeSmooth = shapeBlend * shapeBlend * (3.0 - 2.0 * shapeBlend);
  int shapeA = int(mod(floor(shapeCycle), 4.0));

  float seedRot = t * 0.3 * u_rotSpeed;
  vec2 rsp = rot2(sp, seedRot);

  float pulse = seedScale * (0.85 + 0.15 * sin(t * 2.0));

  float dHex = sdHexagon(rsp, pulse);
  float dTri = sdTriangle(rsp, pulse * 1.3);
  float dCirc = sdCircle(rsp, pulse * 0.7);
  float dStar = sdStar(rsp, pulse * 0.9, 5, 2.5);

  float d1, d2;
  if (shapeA == 0) { d1 = dHex; d2 = dTri; }
  else if (shapeA == 1) { d1 = dTri; d2 = dCirc; }
  else if (shapeA == 2) { d1 = dCirc; d2 = dStar; }
  else { d1 = dStar; d2 = dHex; }
  float d = mix(d1, d2, shapeSmooth);

  float shape = 1.0 - smoothstep(-0.003, 0.003, d);
  float shapeGlow = 1.0 - smoothstep(0.0, 0.025, d);

  float ringRadius = pulse * 2.8 + 0.02 * sin(t * 1.5);
  float ringThickness = 0.004 + 0.002 * sin(t * 3.0);
  float ringDist = abs(length(rsp) - ringRadius);
  float ring = 1.0 - smoothstep(0.0, ringThickness, ringDist);

  float ring2Radius = pulse * 4.5;
  float ring2Dist = abs(length(rsp) - ring2Radius);
  float ring2 = 1.0 - smoothstep(0.0, ringThickness * 0.5, ring2Dist);

  float dotAngle = atan(sp.y, sp.x) + t * 0.5;
  float dotRadius = length(sp);
  float numDots = 6.0;
  float dotPattern = step(0.95, cos(dotAngle * numDots) * 0.5 + 0.5) *
                     step(0.03, dotRadius) * step(dotRadius, 0.05);

  vec3 seedColor = vec3(0.95, 0.65, 0.25) * shape;
  seedColor += vec3(0.7, 0.45, 0.15) * shapeGlow * 0.5;
  seedColor += vec3(0.15, 0.75, 0.85) * ring * 0.8;
  seedColor += vec3(0.5, 0.35, 0.65) * ring2 * 0.4;
  seedColor += vec3(1.0, 0.85, 0.5) * dotPattern * 0.6;

  float burstPhase = mod(t * 0.4, 1.0);
  float burst = smoothstep(0.0, 0.05, burstPhase) * smoothstep(0.15, 0.05, burstPhase);
  float burstShape = 1.0 - smoothstep(0.0, pulse * 1.5, length(sp));
  seedColor += vec3(1.0, 0.9, 0.6) * burst * burstShape * 0.5;

  vec3 color = feedback + seedColor;

  gl_FragColor = vec4(color, 1.0);
}
`;

// ── Display shader: final output with scanlines, vignette, bloom ──
const DISPLAY_FRAG_SRC = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_scene;
uniform float u_time;
uniform vec2 u_res;

#define PI 3.14159265359

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = v_uv;
  float t = u_time;

  vec3 col = texture2D(u_scene, uv).rgb;

  vec2 texel = 1.0 / u_res;
  vec3 bloom = col * 0.2;
  bloom += texture2D(u_scene, uv + vec2(texel.x * 2.0, 0.0)).rgb * 0.15;
  bloom += texture2D(u_scene, uv - vec2(texel.x * 2.0, 0.0)).rgb * 0.15;
  bloom += texture2D(u_scene, uv + vec2(texel.x * 5.0, 0.0)).rgb * 0.1;
  bloom += texture2D(u_scene, uv - vec2(texel.x * 5.0, 0.0)).rgb * 0.1;
  bloom += texture2D(u_scene, uv + vec2(0.0, texel.y * 2.0)).rgb * 0.15;
  bloom += texture2D(u_scene, uv - vec2(0.0, texel.y * 2.0)).rgb * 0.15;
  bloom += texture2D(u_scene, uv + vec2(0.0, texel.y * 5.0)).rgb * 0.1;
  bloom += texture2D(u_scene, uv - vec2(0.0, texel.y * 5.0)).rgb * 0.1;
  bloom += texture2D(u_scene, uv + texel * 3.5).rgb * 0.08;
  bloom += texture2D(u_scene, uv - texel * 3.5).rgb * 0.08;
  bloom += texture2D(u_scene, uv + vec2(texel.x, -texel.y) * 3.5).rgb * 0.08;
  bloom += texture2D(u_scene, uv + vec2(-texel.x, texel.y) * 3.5).rgb * 0.08;
  bloom /= 1.52;

  vec3 bloomExcess = max(bloom - 0.25, 0.0);
  col += bloomExcess * 0.5;

  float scanY = gl_FragCoord.y;

  float fineScan = sin(scanY * PI * 0.5) * 0.5 + 0.5;
  fineScan = pow(fineScan, 2.0);
  float scanDarken = mix(0.75, 1.0, fineScan);

  float scrollScan = sin((scanY * 0.02 + t * 15.0) * 0.5) * 0.5 + 0.5;
  scrollScan = smoothstep(0.3, 0.7, scrollScan);
  scanDarken *= mix(0.85, 1.0, scrollScan);

  float sweepPos = mod(t * 50.0, u_res.y * 1.5) - u_res.y * 0.25;
  float sweep = exp(-abs(scanY - sweepPos) * 0.06) * 0.25;

  col *= scanDarken;
  col += vec3(0.4, 0.65, 0.75) * sweep;

  vec2 vigUV = uv * 2.0 - 1.0;
  float vig = 1.0 - dot(vigUV * 0.55, vigUV * 0.55);
  vig = clamp(vig, 0.0, 1.0);
  vig = vig * vig;
  col *= 0.2 + vig * 0.8;

  float centerDist = length(vigUV);
  float centerGlow = exp(-centerDist * centerDist * 2.0) * 0.08;
  col += vec3(0.8, 0.55, 0.25) * centerGlow;

  float grain = (hash(gl_FragCoord.xy + fract(t * 43.0) * 1000.0) - 0.5) * 0.04;
  col += grain;

  col = col / (1.0 + col * 0.2);

  col = pow(max(col, vec3(0.0)), vec3(0.95));

  gl_FragColor = vec4(col, 1.0);
}
`;

interface FBO {
  fbo: WebGLFramebuffer;
  tex: WebGLTexture;
}

interface FeedbackUniforms {
  prev: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  res: WebGLUniformLocation | null;
  zoomSpeed: WebGLUniformLocation | null;
  rotSpeed: WebGLUniformLocation | null;
  mouse: WebGLUniformLocation | null;
}

interface DisplayUniforms {
  scene: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  res: WebGLUniformLocation | null;
}

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vSrc: string, fSrc: string): WebGLProgram | null {
  const vertShader = compileShader(gl, gl.VERTEX_SHADER, vSrc);
  const fragShader = compileShader(gl, gl.FRAGMENT_SHADER, fSrc);
  if (!vertShader || !fragShader) return null;

  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vertShader);
  gl.attachShader(prog, fragShader);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
    return null;
  }
  // Shaders are attached; safe to flag for deletion (freed when program is deleted)
  gl.deleteShader(vertShader);
  gl.deleteShader(fragShader);
  return prog;
}

function createFBO(gl: WebGLRenderingContext, w: number, h: number): FBO | null {
  const tex = gl.createTexture();
  if (!tex) return null;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  const fbo = gl.createFramebuffer();
  if (!fbo) {
    gl.deleteTexture(tex);
    return null;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    console.error('FBO incomplete:', status);
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(tex);
    return null;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return { fbo, tex };
}

export function FeedbackLoop({ className }: FeedbackLoopProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    // Tunable parameters (slowed down for ambient background)
    const ZOOM_SPEED = 0.7;
    const ROTATION_SPEED = 0.35;

    // Mouse state
    let smoothMouseX = 0.5;
    let smoothMouseY = 0.5;
    let mouseActive = false;
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let needsResize = true;
    let displayW = 0;
    let displayH = 0;

    // ── Programs ──
    const feedbackProg = createProgram(gl, VERT_SRC, FEEDBACK_FRAG_SRC);
    const displayProg = createProgram(gl, VERT_SRC, DISPLAY_FRAG_SRC);
    if (!feedbackProg || !displayProg) return;

    // ── Uniform locations ──
    const fbUniforms: FeedbackUniforms = {
      prev: gl.getUniformLocation(feedbackProg, 'u_prev'),
      time: gl.getUniformLocation(feedbackProg, 'u_time'),
      res: gl.getUniformLocation(feedbackProg, 'u_res'),
      zoomSpeed: gl.getUniformLocation(feedbackProg, 'u_zoomSpeed'),
      rotSpeed: gl.getUniformLocation(feedbackProg, 'u_rotSpeed'),
      mouse: gl.getUniformLocation(feedbackProg, 'u_mouse'),
    };

    const dispUniforms: DisplayUniforms = {
      scene: gl.getUniformLocation(displayProg, 'u_scene'),
      time: gl.getUniformLocation(displayProg, 'u_time'),
      res: gl.getUniformLocation(displayProg, 'u_res'),
    };

    // ── Full-screen triangle ──
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    function bindQuad(prog: WebGLProgram): void {
      const aPos = gl!.getAttribLocation(prog, 'a_pos');
      gl!.enableVertexAttribArray(aPos);
      gl!.vertexAttribPointer(aPos, 2, gl!.FLOAT, false, 0, 0);
    }

    // ── FBO state ──
    let fboA: FBO | null = null;
    let fboB: FBO | null = null;
    let fboWidth = 0;
    let fboHeight = 0;

    function initFBOs(): void {
      fboWidth = Math.round(canvas!.clientWidth * dpr);
      fboHeight = Math.round(canvas!.clientHeight * dpr);
      // Cap at reasonable max for performance
      const maxDim = 1920;
      if (fboWidth > maxDim || fboHeight > maxDim) {
        const ratio = maxDim / Math.max(fboWidth, fboHeight);
        fboWidth = Math.round(fboWidth * ratio);
        fboHeight = Math.round(fboHeight * ratio);
      }

      if (fboA) {
        gl!.deleteTexture(fboA.tex);
        gl!.deleteFramebuffer(fboA.fbo);
      }
      if (fboB) {
        gl!.deleteTexture(fboB.tex);
        gl!.deleteFramebuffer(fboB.fbo);
      }

      fboA = createFBO(gl!, fboWidth, fboHeight);
      fboB = createFBO(gl!, fboWidth, fboHeight);

      if (!fboA || !fboB) return;

      // Clear both FBOs to black
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fboA.fbo);
      gl!.viewport(0, 0, fboWidth, fboHeight);
      gl!.clearColor(0.0, 0.0, 0.0, 1.0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fboB.fbo);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    }

    function resize(): void {
      needsResize = false;
      const w = Math.round(canvas!.clientWidth * dpr);
      const h = Math.round(canvas!.clientHeight * dpr);
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
        displayW = w;
        displayH = h;
        initFBOs();
      }
    }

    resize();

    // ── Mouse/touch interaction ──
    function cssToNorm(clientX: number, clientY: number): { x: number; y: number } {
      return {
        x: clientX / canvas!.clientWidth,
        y: 1.0 - clientY / canvas!.clientHeight,
      };
    }

    function onMouseMove(e: MouseEvent): void {
      const p = cssToNorm(e.clientX, e.clientY);
      targetMouseX = p.x;
      targetMouseY = p.y;
      mouseActive = true;
    }
    function onMouseLeave(): void {
      mouseActive = false;
    }
    function onTouchStart(e: TouchEvent): void {
      const t = e.touches[0];
      const p = cssToNorm(t.clientX, t.clientY);
      targetMouseX = p.x;
      targetMouseY = p.y;
      mouseActive = true;
    }
    function onTouchMove(e: TouchEvent): void {
      e.preventDefault();
      const t = e.touches[0];
      const p = cssToNorm(t.clientX, t.clientY);
      targetMouseX = p.x;
      targetMouseY = p.y;
      mouseActive = true;
    }
    function onTouchEnd(): void {
      mouseActive = false;
    }

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    // ── Animation state ──
    let running = true;
    let currentFBO = 0; // 0 = read from A, write to B; 1 = read from B, write to A
    let lastTime = 0;
    let rafId = 0;

    function render(now: number): void {
      if (!running) {
        rafId = requestAnimationFrame(render);
        return;
      }
      if (needsResize) resize();
      if (!fboA || !fboB) {
        rafId = requestAnimationFrame(render);
        return;
      }

      if (!lastTime) lastTime = now;
      lastTime = now;

      const time = prefersReduced ? 0.0 : now * 0.001;

      // Smooth mouse position
      if (mouseActive) {
        smoothMouseX += (targetMouseX - smoothMouseX) * 0.06;
        smoothMouseY += (targetMouseY - smoothMouseY) * 0.06;
      } else {
        smoothMouseX += (0.5 - smoothMouseX) * 0.02;
        smoothMouseY += (0.5 - smoothMouseY) * 0.02;
      }

      // ── Pass 1: Feedback ──
      const readFBO = currentFBO === 0 ? fboA : fboB;
      const writeFBO = currentFBO === 0 ? fboB : fboA;

      gl!.bindFramebuffer(gl!.FRAMEBUFFER, writeFBO.fbo);
      gl!.viewport(0, 0, fboWidth, fboHeight);

      gl!.useProgram(feedbackProg);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, quadBuf);
      bindQuad(feedbackProg!);

      gl!.activeTexture(gl!.TEXTURE0);
      gl!.bindTexture(gl!.TEXTURE_2D, readFBO.tex);
      gl!.uniform1i(fbUniforms.prev, 0);
      gl!.uniform1f(fbUniforms.time, time);
      gl!.uniform2f(fbUniforms.res, fboWidth, fboHeight);
      gl!.uniform1f(fbUniforms.zoomSpeed, ZOOM_SPEED);
      gl!.uniform1f(fbUniforms.rotSpeed, ROTATION_SPEED);
      gl!.uniform2f(fbUniforms.mouse, smoothMouseX, smoothMouseY);

      gl!.drawArrays(gl!.TRIANGLES, 0, 3);

      // Swap
      currentFBO = 1 - currentFBO;

      // ── Pass 2: Display ──
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
      gl!.viewport(0, 0, displayW, displayH);

      gl!.useProgram(displayProg);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, quadBuf);
      bindQuad(displayProg!);

      gl!.activeTexture(gl!.TEXTURE0);
      gl!.bindTexture(gl!.TEXTURE_2D, writeFBO.tex);
      gl!.uniform1i(dispUniforms.scene, 0);
      gl!.uniform1f(dispUniforms.time, time);
      gl!.uniform2f(dispUniforms.res, displayW, displayH);

      gl!.drawArrays(gl!.TRIANGLES, 0, 3);

      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);

    // ── Resize ──
    function onResize(): void {
      needsResize = true;
    }
    window.addEventListener('resize', onResize);

    // ── Pause when offscreen ──
    function onVisibilityChange(): void {
      running = !document.hidden;
      if (running) lastTime = 0;
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);

      // Delete WebGL resources
      if (fboA) {
        gl.deleteTexture(fboA.tex);
        gl.deleteFramebuffer(fboA.fbo);
      }
      if (fboB) {
        gl.deleteTexture(fboB.tex);
        gl.deleteFramebuffer(fboB.fbo);
      }
      gl.deleteBuffer(quadBuf);
      gl.deleteProgram(feedbackProg);
      gl.deleteProgram(displayProg);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
}
