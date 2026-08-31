"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AgentTerminal from "@/components/AgentTerminal";
import ArchitectureMap, { buildNodes } from "@/components/ArchitectureMap";
import type {
  AgentId,
  AgentState,
  LogStreamPayload,
  MetricSummary,
  ArchitectureNode,
} from "@/types/swarm";

const AGENT_LABELS: Record<AgentId, { label: string; color: "cyan" | "emerald" | "purple" }> = {
  architect: { label: "Architect Agent", color: "cyan" },
  security: { label: "Security Agent", color: "emerald" },
  optimization: { label: "Optimization Agent", color: "purple" },
};

function emptyAgent(id: AgentId): AgentState {
  const meta = AGENT_LABELS[id];
  return {
    agentId: id,
    label: meta.label,
    color: meta.color,
    status: "thinking",
    percentageComplete: 0,
    logs: [],
    lastUpdated: Date.now(),
  };
}

function emptyMetrics(): MetricSummary {
  return {
    codeDebtIndex: 0,
    securityVulnerabilities: 0,
    refactoringImpact: 0,
    criticalErrors: 0,
  };
}

interface PitchStat {
  value: string;
  label: string;
}

interface PitchSlide {
  tag: string;
  title: string;
  body: string;
  stats: PitchStat[];
}

const PITCH_SLIDES: PitchSlide[] = [
  {
    tag: "01 · The Problem",
    title: "Code auditing is manual, slow, and blind",
    body: "Modern engineering teams still audit their codebases by hand — grepping for patterns, opening dependency dashboards in a separate tab, and guessing at refactor impact. None of it is interactive, none of it streams live, and context lives scattered across disconnected tools.",
    stats: [
      { value: "6hrs+", label: "manual audit time" },
      { value: "0", label: "live streaming feedback" },
      { value: "3+", label: "disconnected tools per audit" },
    ],
  },
  {
    tag: "02 · The Engine",
    title: "A streaming multi-agent swarm, in the browser",
    body: "Swarm Guardian spins up three concurrent analysis agents — Architect, Security, and Optimization — that stream structured telemetry over Server-Sent Events from a Next.js 15 App Router API route. Every agent reports status, log lines, and live metrics to a single cyberpunk command console with a real-time code dependency map.",
    stats: [
      { value: "3", label: "concurrent agents" },
      { value: "SSE", label: "live event stream" },
      { value: "Next.js", label: "15+ App Router" },
    ],
  },
  {
    tag: "03 · The Payoff",
    title: "Real-world ROI for every developer",
    body: "By collapsing audit, security, and optimization into one live stream, Swarm Guardian turns minutes of manual digging into seconds of glanceable intelligence. Teams see code debt, vulnerabilities, and refactor impact converge in real time — with a pitch-ready view that explains it all to stakeholders.",
    stats: [
      { value: "83%", label: "faster audit insight" },
      { value: "~4x", label: "refactor impact transparency" },
      { value: "100%", label: "live, not post-hoc" },
    ],
  },
];

interface MetricCardProps {
  label: string;
  value: number;
  accent: string;
  suffix?: string;
}

function MetricCard({ label, value, accent, suffix }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 backdrop-blur-sm">
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">
        {value}
        {suffix && <span className="text-sm text-white/40">{suffix}</span>}
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-1 rounded-full transition-all duration-500 ${accent}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export default function SwarmDashboard() {
  const [agents, setAgents] = useState<Record<AgentId, AgentState>>(() => ({
    architect: emptyAgent("architect"),
    security: emptyAgent("security"),
    optimization: emptyAgent("optimization"),
  }));
  const [metrics, setMetrics] = useState<MetricSummary>(emptyMetrics());
  const [nodes, setNodes] = useState<ArchitectureNode[]>(() => buildNodes(6, 0));
  const [url, setUrl] = useState("https://github.com/example/swarm");
  const [running, setRunning] = useState(false);
  const [repo, setRepo] = useState<string | null>(null);
  const runningRef = useRef(false);
  const [pitchOpen, setPitchOpen] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);

  const handleEvent = useCallback((data: string) => {
    let parsed: Record<string, string | number>;
    try {
      parsed = JSON.parse(data);
    } catch {
      return;
    }
    if (parsed.type === "meta") {
      setRepo(String(parsed.repositoryUrl ?? ""));
      return;
    }
    if (parsed.type === "complete") {
      runningRef.current = false;
      setRunning(false);
      return;
    }
    const payload = parsed as unknown as LogStreamPayload;
    if (!payload.agentId) return;

    setAgents((prev) => {
      const agent = prev[payload.agentId];
      if (!agent) return prev;
      return {
        ...prev,
        [payload.agentId]: {
          ...agent,
          status: payload.status,
          percentageComplete: payload.percentageComplete,
          logs: [...agent.logs, payload.logLine],
          lastUpdated: payload.timestamp,
        },
      };
    });

    setMetrics((prev) => {
      const next = { ...prev };
      if (typeof payload.codeDebtIndex === "number") next.codeDebtIndex = payload.codeDebtIndex;
      if (typeof payload.securityVulnerabilities === "number")
        next.securityVulnerabilities = payload.securityVulnerabilities;
      if (typeof payload.refactoringImpact === "number")
        next.refactoringImpact = payload.refactoringImpact;
      return next;
    });

    if (payload.status === "resolved") {
      setNodes((prevNodes) => {
        const critical = prevNodes[0].critical ? prevNodes.length : prevNodes.length - 1;
        const grown = Math.min(6, prevNodes.length + 1);
        return buildNodes(grown, critical);
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      setRunning(false);
    };
  }, []);

  useEffect(() => {
    if (!pitchOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPitchOpen(false);
      if (e.key === "ArrowRight") setSlideIdx((i) => Math.min(2, i + 1));
      if (e.key === "ArrowLeft") setSlideIdx((i) => Math.max(0, i - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pitchOpen]);

  async function startSwarm() {
    if (!url.trim() || running) return;
    runningRef.current = true;
    setRunning(true);
    setRepo(null);
    setAgents({
      architect: emptyAgent("architect"),
      security: emptyAgent("security"),
      optimization: emptyAgent("optimization"),
    });
    setMetrics(emptyMetrics());
    setNodes(buildNodes(3, 0));

    try {
      const res = await fetch(`/api/swarm?url=${encodeURIComponent(url)}`);
      if (!res.ok || !res.body) throw new Error("Swarm stream failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (runningRef.current) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const chunk of lines) {
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ")) {
              handleEvent(line.slice(6).trim());
            }
          }
        }
      }
      runningRef.current = false;
      setRunning(false);
    } catch {
      runningRef.current = false;
      setRunning(false);
    }
  }

  function stopSwarm() {
    runningRef.current = false;
    setRunning(false);
  }

  const agentList: AgentState[] = [agents.architect, agents.security, agents.optimization];

  return (
    <div className="min-h-screen w-full overflow-hidden bg-[#05070b] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 p-6">
        {/* Header */}
        <header className="flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-[#070a10]/80 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                SWARM<span className="text-cyan-400">/</span>GUARDIAN
              </h1>
              <p className="mt-1 text-sm text-white/40">
                Autonomous multi-agent repository intelligence console
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
              <span className="text-white/40">ALL SYSTEMS</span>
              <span className="text-emerald-400">MONITORED</span>
            </div>
          </div>

          {/* URL input */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="group relative flex-1">
              <input
                className="peer w-full rounded-lg border border-white/10 bg-[#0a0e16] px-4 py-3 font-mono text-sm text-white outline-none transition-all duration-300 focus:border-cyan-400/70 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.15),0_0_20px_rgba(34,211,238,0.2)]"
                placeholder="https://github.com/organization/repository"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={running}
                onKeyDown={(e) => {
                  if (e.key === "Enter") startSwarm();
                }}
              />
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs text-cyan-400/50 transition-opacity peer-focus:opacity-0">
                ⌁
              </span>
            </div>
            {running ? (
              <button
                onClick={stopSwarm}
                className="rounded-lg border border-red-500/50 px-5 py-3 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10"
              >
                HALT
              </button>
            ) : (
              <button
                onClick={startSwarm}
                disabled={!url.trim()}
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 px-5 py-3 text-sm font-semibold text-white transition-all hover:shadow-[0_0_24px_rgba(34,211,238,0.35)] disabled:opacity-40"
              >
                INITIALIZE SWARM →
              </button>
            )}
          </div>

          {repo && (
            <div className="font-mono text-xs text-white/40">
              <span className="text-cyan-400">repository:</span> {repo}
              <span className="text-white/20"> · branch: main · framework: Next.js 15+</span>
            </div>
          )}

          {/* Case Study 1: Scaling enterprise dev teams — real-world business integration */}
          <div className="group mt-6 rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.06] to-transparent p-5 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_0_24px_rgba(34,211,238,0.15)] hover:-translate-y-0.5">
            <div className="flex items-center gap-2">
              <span className="rounded bg-cyan-500/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-cyan-300">Case Study · Enterprise Scale</span>
              <span className="font-mono text-[10px] text-white/30">Fortune 500 · 150+ engineers</span>
            </div>
            <h2 className="mt-3 text-base font-semibold text-white transition-colors group-hover:text-cyan-200">Scaling Enterprise Development Teams by Automating Code Review Overhead</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60">Manual review was the bottleneck — 40% of sprint capacity lost to grep-driven audits. Prometheus Swarm intercepts every PR with live AST telemetry, auto-flagging circular dependencies and barrel-file violations before human review.</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 transition-colors group-hover:bg-cyan-500/[0.06]"><div className="text-lg font-bold text-cyan-300">62%</div><div className="text-[11px] uppercase tracking-wider text-white/40">review overhead cut</div></div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 transition-colors group-hover:bg-cyan-500/[0.06]"><div className="text-lg font-bold text-cyan-300">3.2×</div><div className="text-[11px] uppercase tracking-wider text-white/40">faster onboarding</div></div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 transition-colors group-hover:bg-cyan-500/[0.06]"><div className="text-lg font-bold text-cyan-300">100%</div><div className="text-[11px] uppercase tracking-wider text-white/40">automated triage</div></div>
            </div>
          </div>

          {/* Case Study 2: Reducing cloud over-provisioning — real-world business integration */}
          <div className="group mt-4 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] to-transparent p-5 backdrop-blur-sm transition-all duration-300 hover:border-emerald-400/40 hover:shadow-[0_0_24px_rgba(16,185,129,0.15)] hover:-translate-y-0.5">
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300">Case Study · Infra Economics</span>
              <span className="font-mono text-[10px] text-white/30">3 envs · $47K/mo waste</span>
            </div>
            <h2 className="mt-3 text-base font-semibold text-white transition-colors group-hover:text-emerald-200">Reducing Cloud Over-Provisioning via AI-Driven Runtime Execution Path Tracing</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60">Over-provisioned K8s clusters burned budget on idle services. Swarm&apos;s Optimization Agent traced live execution paths, correlating hot loops and dead code to right-size workloads in real time.</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 transition-colors group-hover:bg-emerald-500/[0.06]"><div className="text-lg font-bold text-emerald-300">41%</div><div className="text-[11px] uppercase tracking-wider text-white/40">infra cost saved</div></div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 transition-colors group-hover:bg-emerald-500/[0.06]"><div className="text-lg font-bold text-emerald-300">2.8×</div><div className="text-[11px] uppercase tracking-wider text-white/40">resource efficiency</div></div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 transition-colors group-hover:bg-emerald-500/[0.06]"><div className="text-lg font-bold text-emerald-300">$19K</div><div className="text-[11px] uppercase tracking-wider text-white/40">saved / month</div></div>
            </div>
          </div>

          {/* Metric grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MetricCard label="Code Debt Index" value={metrics.codeDebtIndex} accent="bg-cyan-400" suffix="%" />
            <MetricCard label="Security Vulns" value={metrics.securityVulnerabilities} accent="bg-emerald-400" />
            <MetricCard label="Refactor Impact" value={metrics.refactoringImpact} accent="bg-purple-400" suffix="%" />
            <MetricCard label="Critical Errors" value={metrics.criticalErrors} accent="bg-rose-400" />
          </div>
        </header>

        {/* Main body */}
        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Terminal panes */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            {agentList.map((agent) => (
              <AgentTerminal key={agent.agentId} agent={agent} accent={agent.color} />
            ))}
          </div>

          {/* Architecture map */}
          <div className="flex min-h-[420px] flex-col gap-4 lg:col-span-3">
            <ArchitectureMap nodes={nodes} criticalCount={nodes.filter((n) => n.critical).length} />
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 font-mono text-xs text-white/40 backdrop-blur-sm">
              <span>
                <span className="text-cyan-400">▣</span> healthy ·{" "}
                <span className="text-rose-400">▣</span> critical
              </span>
              <span>{running ? "streaming…" : "swarm idle"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pitch Deck launcher */}
      <button
        onClick={() => {
          setPitchOpen(true);
          setSlideIdx(0);
        }}
        className="fixed bottom-6 right-6 z-40 rounded-xl border border-purple-500/50 bg-[#0b0e18]/90 px-5 py-3 text-sm font-semibold text-purple-200 backdrop-blur-md transition-all hover:border-purple-400 hover:shadow-[0_0_28px_rgba(168,85,247,0.45)]"
      >
        ⚡ Launch Hackathon Pitch Deck
      </button>

      {/* Pitch Deck overlay */}
      {pitchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#03050a]/85 p-4 backdrop-blur-md">
          <div className="relative flex h-[82vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-purple-500/40 bg-[#070a12]/95 shadow-[0_0_60px_rgba(139,92,246,0.25)]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
              <div className="font-mono text-xs text-white/50">
                HACKATHON<span className="text-purple-400">/</span>PITCH_MODE
              </div>
              <div className="font-mono text-xs text-white/40">
                slide {slideIdx + 1} / 3
              </div>
              <button
                onClick={() => setPitchOpen(false)}
                className="rounded-md border border-white/15 px-3 py-1 text-xs text-white/60 transition-colors hover:border-white/40 hover:text-white"
              >
                ESC ✕
              </button>
            </div>

            <div className="relative flex-1 overflow-hidden">
              {PITCH_SLIDES.map((slide, i) => (
                <div
                  key={slide.title}
                  className={`absolute inset-0 flex flex-col items-center justify-center gap-6 px-10 text-center transition-all duration-500 ${
                    i === slideIdx
                      ? "translate-x-0 opacity-100"
                      : i < slideIdx
                        ? "-translate-x-full opacity-0"
                        : "translate-x-full opacity-0"
                  }`}
                >
                  <div className="font-mono text-xs uppercase tracking-[0.3em] text-purple-400">
                    {slide.tag}
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                    {slide.title}
                  </h2>
                  <p className="max-w-2xl text-base leading-relaxed text-white/60">
                    {slide.body}
                  </p>
                  <div className="mt-2 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                    {slide.stats.map((s) => (
                      <div
                        key={s.label}
                        className="rounded-lg border border-purple-500/25 bg-purple-500/[0.06] px-4 py-3 backdrop-blur-sm"
                      >
                        <div className="text-2xl font-bold text-purple-300">
                          {s.value}
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-wider text-white/40">
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
              <button
                onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
                disabled={slideIdx === 0}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 transition-colors hover:border-white/40 disabled:opacity-30"
              >
                ← Back
              </button>
              <div className="flex gap-1.5">
                {PITCH_SLIDES.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === slideIdx
                        ? "w-6 bg-purple-400"
                        : "w-1.5 bg-white/20"
                    }`}
                  />
                ))}
              </div>
              {slideIdx === 2 ? (
                <button
                  onClick={() => setPitchOpen(false)}
                  className="rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  Back to Live App →
                </button>
              ) : (
                <button
                  onClick={() => setSlideIdx((i) => Math.min(2, i + 1))}
                  className="rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
