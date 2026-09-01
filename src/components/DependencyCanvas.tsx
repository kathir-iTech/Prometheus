// src/components/DependencyCanvas.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import type { ArgumentSegment } from '@/types/argument';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 50;
const H_GAP = 40;
const V_GAP = 70;
const MAX_LABEL_CHARS = 22;

export function DependencyCanvas({ segments }: { segments: ArgumentSegment[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  // Model-inferred layout from supportsClauseIndex — not verified logic.
  // Label this in the UI the same way scores are labeled.
  function computeLayout(width: number) {
    const positions: { x: number; y: number }[] = new Array(segments.length);
    let x = 20;
    segments.forEach((seg, i) => {
      if (seg.supportsClauseIndex === null) {
        positions[i] = { x, y: 20 };
        x += NODE_WIDTH + H_GAP;
      }
    });
    segments.forEach((seg, i) => {
      if (seg.supportsClauseIndex !== null && positions[seg.supportsClauseIndex]) {
        const parent = positions[seg.supportsClauseIndex];
        positions[i] = { x: parent.x, y: parent.y + NODE_HEIGHT + V_GAP };
      } else if (!positions[i]) {
        positions[i] = { x, y: 20 };
        x += NODE_WIDTH + H_GAP;
      }
    });
    return positions;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    function draw() {
      const dpr = window.devicePixelRatio || 1;
      const width = container!.clientWidth;
      const height = 300;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      const ctx = canvas!.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const positions = computeLayout(width);

      ctx.strokeStyle = '#cbd5e1';
      segments.forEach((seg, i) => {
        if (seg.supportsClauseIndex !== null && positions[seg.supportsClauseIndex]) {
          const from = positions[seg.supportsClauseIndex];
          const to = positions[i];
          ctx.beginPath();
          ctx.moveTo(from.x + NODE_WIDTH / 2, from.y + NODE_HEIGHT);
          ctx.lineTo(to.x + NODE_WIDTH / 2, to.y);
          ctx.stroke();
        }
      });

      segments.forEach((seg, i) => {
        const pos = positions[i];
        if (!pos) return;
        ctx.fillStyle =
          seg.type === 'normal' ? '#dcfce7' : seg.type === 'premise_conflict' ? '#fee2e2' : '#fef3c7';
        ctx.fillRect(pos.x, pos.y, NODE_WIDTH, NODE_HEIGHT);
        ctx.strokeStyle = '#94a3b8';
        ctx.strokeRect(pos.x, pos.y, NODE_WIDTH, NODE_HEIGHT);
        ctx.fillStyle = '#1e293b';
        ctx.font = '12px sans-serif';
        const truncated =
          seg.text.length > MAX_LABEL_CHARS ? seg.text.slice(0, MAX_LABEL_CHARS) + '…' : seg.text;
        ctx.fillText(truncated, pos.x + 8, pos.y + NODE_HEIGHT / 2 + 4, NODE_WIDTH - 16);
      });
    }

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(container);
    return () => ro.disconnect();
  }, [segments]);

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const positions = computeLayout(rect.width);
    const hitIndex = segments.findIndex((_, i) => {
      const p = positions[i];
      return p && mx >= p.x && mx <= p.x + NODE_WIDTH && my >= p.y && my <= p.y + NODE_HEIGHT;
    });
    setHover(hitIndex >= 0 ? { x: mx, y: my, text: segments[hitIndex].text } : null);
  }

  return (
    <div ref={containerRef} className="relative">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        Dependency map (model-inferred — not verified logic)
      </p>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
        className="w-full rounded-md border border-gray-200"
      />
      {hover && (
        <div
          className="pointer-events-none absolute z-10 max-w-xs rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          {hover.text}
        </div>
      )}
    </div>
  );
}
