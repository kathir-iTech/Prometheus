"use client";

import { useEffect, useRef, useState } from "react";
import type { ArchitectureNode, TooltipPayload } from "@/types/swarm";

interface ArchitectureMapProps {
  nodes: ArchitectureNode[];
  criticalCount: number;
}

interface LayoutNode extends ArchitectureNode {
  px: number;
  py: number;
  vx: number;
  vy: number;
  seed: number;
}

interface TooltipState {
  x: number;
  y: number;
  payload: TooltipPayload | null;
}

const BASE_NODES: Array<{ id: string; path: string; moduleCount: number }> = [
  { id: "app", path: "/src/app", moduleCount: 18 },
  { id: "comps", path: "/src/components", moduleCount: 24 },
  { id: "lib", path: "/src/lib", moduleCount: 12 },
  { id: "types", path: "/src/types", moduleCount: 6 },
  { id: "public", path: "/public", moduleCount: 9 },
  { id: "api", path: "/src/app/api", moduleCount: 7 },
];

function hashString(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h << 5) - h + id.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function clampIntensity(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function mapNodeColor(critical: boolean, intensity: number): string {
  if (critical) {
    const alpha = 0.4 + clampIntensity(intensity) * 0.6;
    return `rgba(244, 63, 94, ${alpha})`;
  }
  const alpha = 0.25 + clampIntensity(intensity) * 0.6;
  return `rgba(34, 211, 238, ${alpha})`;
}

// Ray-casting cursor math using canvas spatial matrix
function rayCastHit(
  nodePx: number,
  nodePy: number,
  canvasWidth: number,
  canvasHeight: number,
  mouseX: number,
  mouseY: number,
  radius: number
): boolean {
  const sx = nodePx * canvasWidth;
  const sy = nodePy * canvasHeight;
  const dx = mouseX - sx;
  const dy = mouseY - sy;
  return Math.sqrt(dx * dx + dy * dy) <= radius;
}

function precomputeLayout(nodes: ArchitectureNode[]): LayoutNode[] {
  const total = Math.max(1, nodes.length);
  return nodes.map((node, i) => {
    const seed = hashString(node.id) % 1000;
    return {
      ...node,
      intensity: clampIntensity(node.intensity),
      px: 0.1 + (i / total) * 0.8,
      py: 0.18 + ((seed % 90) / 100),
      vx: ((seed % 17) - 7) * 0.00018,
      vy: ((seed % 13) - 6) * 0.00018,
      seed,
    };
  });
}

export default function ArchitectureMap({ nodes, criticalCount }: ArchitectureMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tickRef = useRef(0);
  const lastTimeRef = useRef(0);
  const layoutRef = useRef<LayoutNode[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState>({ x: 0, y: 0, payload: null });

  useEffect(() => {
    layoutRef.current = precomputeLayout(nodes);
    tickRef.current = 0;
  }, [nodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    lastTimeRef.current = performance.now();

    // Mouse tracking for ray-casting
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const dpr = window.devicePixelRatio || 1;
      // Use CSS pixel coordinates (clientWidth) for hit test to match layout px fractions
      const cssW = canvas.clientWidth || rect.width;
      const cssH = canvas.clientHeight || rect.height;

      let hovered: TooltipPayload | null = null;
      let bestDist = Infinity;
      const layout = layoutRef.current;
      const baseRadius = layout.length > 120 ? 6 : 14;

      for (const node of layout) {
        const radius = baseRadius + node.intensity * (layout.length > 120 ? 1.5 : 2) + 4;
        if (rayCastHit(node.px, node.py, cssW, cssH, mouseX, mouseY, radius)) {
          const sx = node.px * cssW;
          const sy = node.py * cssH;
          const dist = Math.hypot(mouseX - sx, mouseY - sy);
          if (dist < bestDist) {
            bestDist = dist;
            const importCount = node.moduleCount;
            const healthRating = Math.round((1 - node.intensity) * 100);
            hovered = {
              name: node.path.split("/").pop() || node.id,
              importCount,
              healthRating,
              critical: node.critical,
              x: node.px,
              y: node.py,
            };
          }
        }
      }
      setTooltip({ x: mouseX, y: mouseY, payload: hovered });
    };

    const handleMouseLeave = () => setTooltip({ x: 0, y: 0, payload: null });

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const draw = (now: number) => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      // Handle HiDPI
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      const w = rect.width;
      const h = rect.height;

      const delta = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;
      tickRef.current += 1;

      ctx.fillStyle = "rgba(3, 6, 10, 0.72)";
      ctx.fillRect(0, 0, w, h);

      const pulse = Math.sin(now * 0.003) * 0.5 + 0.5;
      const layout = layoutRef.current;
      const count = layout.length;

      for (const node of layout) {
        node.px += node.vx * (delta * 60);
        node.py += node.vy * (delta * 60);

        if (node.px < 0.04) {
          node.px = 0.04;
          node.vx = Math.abs(node.vx);
        }
        if (node.px > 0.96) {
          node.px = 0.96;
          node.vx = -Math.abs(node.vx);
        }
        if (node.py < 0.12) {
          node.py = 0.12;
          node.vy = Math.abs(node.vy);
        }
        if (node.py > 0.92) {
          node.py = 0.92;
          node.vy = -Math.abs(node.vy);
        }

        const sx = node.px * w;
        const sy = node.py * h;
        const isHovered = !!tooltip.payload && tooltip.payload.name === (node.path.split("/").pop() || node.id) && rayCastHit(node.px, node.py, w, h, tooltip.x, tooltip.y, count > 120 ? 10 : 18);
        const color = mapNodeColor(node.critical, node.intensity);
        const radius = count > 120 ? 6 : 14;
        const coreR = (count > 120 ? 2 : 4) + pulse * node.intensity * (count > 120 ? 1.5 : 2) + (isHovered ? 2 : 0);

        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.12 + node.intensity * 0.2 + (isHovered ? 0.15 : 0);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(sx, sy, coreR, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = node.critical ? "rgba(244,63,94,0.9)" : "rgba(34,211,238,0.9)";
        ctx.shadowBlur = isHovered ? 22 : count > 120 ? 6 : 16;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (count <= 60) {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = "10px monospace";
        for (const node of layout) {
          ctx.fillText(node.path, node.px * w + 10, node.py * h + 4);
        }
      }

      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.font = "11px monospace";
      ctx.fillText(`nodes: ${count} · critical: ${criticalCount}`, 10, 16);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [criticalCount, tooltip.payload, tooltip.x, tooltip.y]);

  return (
    <div className="relative flex-1 overflow-hidden rounded-xl border border-cyan-500/30 bg-[#03060a]/90">
      <canvas ref={canvasRef} className="h-full w-full" style={{ width: "100%", height: "100%" }} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_30%,rgba(3,6,10,0.7)_100%)]" />
      {tooltip.payload && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border bg-[#0a0e16]/95 px-3 py-2 font-mono text-[11px] leading-4 shadow-[0_0_20px_rgba(34,211,238,0.35)] backdrop-blur-md transition-opacity"
          style={{
            left: Math.min(tooltip.x + 16, 320),
            top: Math.max(tooltip.y - 48, 8),
            borderColor: tooltip.payload.critical ? "rgba(244,63,94,0.6)" : "rgba(34,211,238,0.6)",
            color: tooltip.payload.critical ? "rgb(253 164 175)" : "rgb(103 232 249)",
            boxShadow: tooltip.payload.critical ? "0 0 20px rgba(244,63,94,0.35)" : "0 0 20px rgba(34,211,238,0.35)",
          }}
        >
          <div className="font-semibold">{tooltip.payload.name}</div>
          <div className="text-white/60">
            imports: <span className="text-white">{tooltip.payload.importCount}</span> · health:{" "}
            <span className={tooltip.payload.healthRating > 70 ? "text-emerald-300" : tooltip.payload.healthRating > 40 ? "text-amber-300" : "text-rose-300"}>
              {tooltip.payload.healthRating}%
            </span>
            {tooltip.payload.critical && <span className="ml-2 text-rose-400">● critical</span>}
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-2 right-3 font-mono text-[10px] text-cyan-300/60">LIVE CODE MAP</div>
    </div>
  );
}

function buildNodes(count: number, critical: number): ArchitectureNode[] {
  const base = BASE_NODES.slice(0, Math.max(1, count));
  if (count > base.length) {
    const generated = generateFabricatedNodes(count - base.length);
    return [...base, ...generated].map((n, i) => ({
      ...n,
      x: 0,
      y: 0,
      critical: i < critical,
      intensity: Math.min(1, n.moduleCount / 30),
    }));
  }
  return base.map((b, i) => ({
    ...b,
    critical: i < critical,
    intensity: Math.min(1, b.moduleCount / 30),
    x: 0.12 + (i / (base.length - 1)) * 0.76 + ((i % 2) * 0.02 - 0.01),
    y: 0.25 + ((i * 7919) % 97) * 0.006,
  }));
}

function generateFabricatedNodes(count: number): Array<{ id: string; path: string; moduleCount: number }> {
  const out: Array<{ id: string; path: string; moduleCount: number }> = [];
  const prefixes = ["/src/app", "/src/lib", "/src/components", "/public", "/src/types", "/src/hooks"];
  for (let i = 0; i < count; i++) {
    const prefix = prefixes[i % prefixes.length];
    out.push({
      id: `node-${i}`,
      path: `${prefix}/mod-${(i % 40) + 1}.ts`,
      moduleCount: 2 + (i % 28),
    });
  }
  return out;
}

export { buildNodes };
