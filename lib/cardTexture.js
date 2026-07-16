'use client';

import * as THREE from 'three';

/**
 * Renders a project card face to a 2D canvas and wraps it as a THREE texture.
 *
 * Why not <Html> or drei's <Text>?
 *  - <Html transform> puts real DOM in the scene: it costs a matrix update per
 *    frame per card and never truly occludes.
 *  - drei's <Text> (troika) fetches a Roboto .woff from fonts.gstatic.com at
 *    *runtime* unless you ship a font binary. That is a network dependency on
 *    the critical render path for two labels.
 *
 * A canvas texture is drawn exactly once, uses the font already loaded by
 * next/font, and is just a texture to the GPU. Redrawn once more after
 * document.fonts.ready in case the webfont lands after first paint.
 */

const W = 900;
const H = 1200;

function fontFamily() {
  if (typeof window === 'undefined') return 'system-ui, sans-serif';
  // next/font exposes the generated family name through this CSS variable.
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-inter')
    .trim();
  return v ? `${v}, system-ui, sans-serif` : 'system-ui, sans-serif';
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Greedy word wrap. Returns the y position after the last drawn line. */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let cursorY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, cursorY);
    cursorY += lineHeight;
  }
  return cursorY;
}

function draw(ctx, project) {
  const family = fontFamily();
  const accent = project.accent;

  ctx.clearRect(0, 0, W, H);

  // --- Panel body -------------------------------------------------------
  const pad = 24;
  const bodyGrad = ctx.createLinearGradient(0, 0, W, H);
  bodyGrad.addColorStop(0, 'rgba(18,18,28,0.92)');
  bodyGrad.addColorStop(1, 'rgba(8,8,12,0.96)');
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 44);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Accent bloom bleeding in from the top-left corner.
  const bloom = ctx.createRadialGradient(180, 120, 0, 180, 120, 620);
  bloom.addColorStop(0, `${accent}55`);
  bloom.addColorStop(1, `${accent}00`);
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 44);
  ctx.fillStyle = bloom;
  ctx.fill();

  // Hairline border.
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 44);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const L = 80; // left margin for content
  const maxW = W - L * 2;

  // --- Header row -------------------------------------------------------
  ctx.textBaseline = 'alphabetic';
  ctx.font = `600 30px ${family}`;
  ctx.fillStyle = accent;
  ctx.fillText(project.index, L, 130);

  ctx.font = `500 26px ${family}`;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  const yearW = ctx.measureText(project.year).width;
  ctx.fillText(project.year, W - L - yearW, 130);

  // --- Title ------------------------------------------------------------
  ctx.font = `700 84px ${family}`;
  ctx.fillStyle = '#F5F5FA';
  ctx.fillText(project.name, L, 300);

  ctx.font = `500 34px ${family}`;
  ctx.fillStyle = accent;
  ctx.fillText(project.kind, L, 356);

  // --- Divider ----------------------------------------------------------
  ctx.beginPath();
  ctx.moveTo(L, 410);
  ctx.lineTo(W - L, 410);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // --- Summary ----------------------------------------------------------
  ctx.font = `400 32px ${family}`;
  ctx.fillStyle = 'rgba(255,255,255,0.66)';
  let y = wrapText(ctx, project.summary, L, 480, maxW, 48);

  // --- Metrics ----------------------------------------------------------
  y += 60;
  for (const metric of project.metrics) {
    ctx.font = `700 54px ${family}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(metric.value, L, y);

    ctx.font = `400 26px ${family}`;
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.fillText(metric.label.toUpperCase(), L, y + 40);
    y += 118;
  }

  // --- Stack chips ------------------------------------------------------
  let chipX = L;
  const chipY = H - 250;
  ctx.font = `500 24px ${family}`;
  for (const tech of project.stack) {
    const tw = ctx.measureText(tech).width;
    const cw = tw + 44;
    if (chipX + cw > W - L) break;
    roundRect(ctx, chipX, chipY, cw, 52, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.fillText(tech, chipX + 22, chipY + 34);
    chipX += cw + 14;
  }

  // --- Call to action ---------------------------------------------------
  ctx.font = `600 28px ${family}`;
  ctx.fillStyle = accent;
  ctx.fillText('VIEW CASE  →', L, H - 120);
}

/**
 * @returns {{ texture: THREE.CanvasTexture, dispose: () => void }}
 */
export function createCardTexture(project) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  draw(ctx, project);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  let cancelled = false;
  // The webfont may not have parsed on first draw — repaint once it has.
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    document.fonts.ready.then(() => {
      if (cancelled) return;
      draw(ctx, project);
      texture.needsUpdate = true;
    });
  }

  return {
    texture,
    dispose: () => {
      cancelled = true;
      texture.dispose();
    },
  };
}
