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

      // dark glass backdrop
      ctx.fillStyle = 'rgba(18,20,24,0.6)';
      ctx.fillRect(0, 0, width, height);

      // faint amber ambient
      const grad = ctx.createRadialGradient(width / 2, 0, 20, width / 2, 0, width * 0.7);
      grad.addColorStop(0, 'rgba(255,158,100,0.10)');
      grad.addColorStop(1, 'rgba(255,158,100,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const positions = computeLayout(width);

      ctx.strokeStyle = 'rgba(255,158,100,0.45)';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = 'rgba(255,158,100,0.35)';
      ctx.shadowBlur = 6;
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
      ctx.shadowBlur = 0;

      segments.forEach((seg, i) => {
        const pos = positions[i];
        if (!pos) return;
        // node fill
        if (seg.type === 'normal') ctx.fillStyle = 'rgba(16,40,30,0.92)';
        else if (seg.type === 'premise_conflict') ctx.fillStyle = 'rgba(52,18,18,0.92)';
        else ctx.fillStyle = 'rgba(52,34,12,0.92)';

        ctx.strokeStyle =
          seg.type === 'normal'
            ? 'rgba(110,231,183,0.45)'
            : seg.type === 'premise_conflict'
              ? 'rgba(252,165,165,0.45)'
              : 'rgba(255,158,100,0.55)';
        ctx.lineWidth = 1;

        const r = 10;
        ctx.beginPath();
        ctx.roundRect(pos.x, pos.y, NODE_WIDTH, NODE_HEIGHT, r);
        ctx.fill();
        ctx.stroke();

        // top highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.14)';
        ctx.beginPath();
        ctx.moveTo(pos.x + r, pos.y + 0.5);
        ctx.lineTo(pos.x + NODE_WIDTH - r, pos.y + 0.5);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.font = '12px Inter, sans-serif';
        const truncated =
          seg.text.length > MAX_LABEL_CHARS ? seg.text.slice(0, MAX_LABEL_CHARS) + '…' : seg.text;
        ctx.fillText(truncated, pos.x + 10, pos.y + NODE_HEIGHT / 2 + 4, NODE_WIDTH - 20);
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
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#6B7280]">
        Dependency map (model-inferred — not verified logic)
      </p>
      <div className="glass-ethereal overflow-hidden rounded-2xl p-1.5">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHover(null)}
          className="w-full rounded-xl border border-white/[0.06]"
        />
      </div>
      {hover && (
        <div
          className="glass-deep pointer-events-none absolute z-10 max-w-xs rounded-xl border border-amber-core/30 px-3 py-2 text-xs text-white shadow-amber-ring"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          {hover.text}
        </div>
      )}
    </div>
  );
}
