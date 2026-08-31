"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentState } from "@/types/swarm";

interface AgentTerminalProps {
  agent: AgentState;
  accent: string;
}

function renderLogLine(line: string): React.ReactNode {
  const codeMatch = line.match(/\/(?:[\w.-]+\/)+\w+|\b(?:cod|map) util\b|[a-z]+\.[a-z]{2,4}@[\d.]+|\w+:[.\d]+/gi);
  if (!codeMatch) return line;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  codeMatch.forEach((match, idx) => {
    const index = line.indexOf(match, lastIndex);
    if (index === -1) return;
    if (index > lastIndex) {
      parts.push(line.slice(lastIndex, index));
    }
    parts.push(
      <span key={idx} className="text-cyan-300">
        {match}
      </span>
    );
    lastIndex = index + match.length;
  });
  if (lastIndex < line.length) parts.push(line.slice(lastIndex));
  return parts;
}

function downloadSessionLog(agent: AgentState): void {
  const header = `=== SWARM SESSION LOG ===\nagent: ${agent.label} (${agent.agentId})\nstatus: ${agent.status}\nlogs: ${agent.logs.length}\ntimestamp: ${new Date().toISOString()}\n=== BEGIN ===\n`;
  const body = agent.logs
    .map((line, i) => `${String(i).padStart(4, "0")} [${new Date(agent.lastUpdated).toISOString()}] ${line}`)
    .join("\n");
  const footer = `\n=== END ===\n`;
  const blob = new Blob([header + body + footer], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${agent.agentId}_session_${Date.now()}.log`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AgentTerminal({ agent, accent }: AgentTerminalProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [prevLen, setPrevLen] = useState(0);
  const [filter, setFilter] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);

  const filteredLogs = useMemo(() => {
    if (!filter.trim()) return agent.logs;
    let re: RegExp;
    try {
      re = new RegExp(filter.trim(), "i");
    } catch {
      return agent.logs.filter((l) => l.toLowerCase().includes(filter.toLowerCase()));
    }
    return agent.logs.filter((l) => re.test(l));
  }, [agent.logs, filter]);

  useEffect(() => {
    if (autoScroll) {
      const el = viewportRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [filteredLogs.length, autoScroll]);

  useEffect(() => {
    if (autoScroll) return;
    const el = viewportRef.current;
    if (!el) return;
    const stick = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (stick && agent.logs.length > prevLen) {
      el.scrollTop = el.scrollHeight;
    }
    setPrevLen(agent.logs.length);
  }, [agent.logs.length, autoScroll, prevLen]);

  const borderClass =
    accent === "cyan" ? "border-cyan-500/40" : accent === "emerald" ? "border-emerald-500/40" : "border-purple-500/40";
  const glowClass =
    accent === "cyan" ? "shadow-cyan-500/20" : "shadow-purple-500/20";
  const headerClass =
    accent === "cyan" ? "text-cyan-300" : accent === "emerald" ? "text-emerald-300" : "text-purple-300";
  const barClass =
    accent === "cyan" ? "bg-cyan-400" : accent === "emerald" ? "bg-emerald-400" : "bg-purple-400";

  const statusDot =
    agent.status === "resolved"
      ? "bg-emerald-400"
      : agent.status === "working"
        ? animateDot(accent)
        : "bg-amber-400 animate-pulse";

  return (
    <section
      className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border ${borderClass} bg-[#05070b]/95 backdrop-blur-md shadow-lg ${glowClass}`}
    >
      <header className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${statusDot}`} />
          <span className={`text-sm font-semibold tracking-wide ${headerClass}`}>
            {agent.label}
          </span>
          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/40">
            {agent.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-white/50">
            {filteredLogs.length}/{agent.logs.length}
          </span>
          <div className="h-1 w-20 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-1 rounded-full ${barClass} transition-all duration-300`}
              style={{ width: `${agent.percentageComplete}%` }}
            />
          </div>
        </div>
      </header>

      <div className="flex items-center gap-2 border-b border-white/[0.04] px-4 py-1.5">
        <span className="font-mono text-[10px] text-white/30">
          ~/agents/{agent.agentId.toLowerCase()}
        </span>
        <div className="relative ml-auto flex items-center">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="filter / regex…"
            className="w-36 rounded border border-white/10 bg-[#0a0e16] px-2 py-1 font-mono text-[10px] text-white outline-none transition-colors focus:border-cyan-400/60"
          />
        </div>
        <button
          onClick={() => downloadSessionLog(agent)}
          title="Download session log"
          className="rounded border border-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white/50 transition-colors hover:border-cyan-400/50 hover:text-cyan-300"
        >
          ⬇ log
        </button>
        <button
          onClick={() => setAutoScroll((v) => !v)}
          className={`font-mono text-[10px] uppercase tracking-wider ${
            autoScroll ? "text-emerald-400" : "text-white/40"
          }`}
        >
          {autoScroll ? "auto" : "manual"}
        </button>
      </div>

      <div
        ref={viewportRef}
        style={{ contentVisibility: "auto", containIntrinsicSize: "1px 5000px" }}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-3 font-mono text-[12.5px] leading-6 will-change-scroll"
      >
        {filteredLogs.map((line, i) => {
          const isLast = i === filteredLogs.length - 1;
          return (
            <div key={i} className="whitespace-pre-wrap">
              <span className="select-none text-white/25">{String(i).padStart(3, "0")} </span>
              <span className="text-emerald-500/70">▸</span>{" "}
              {renderLogLine(line)}
              {isLast && agent.status !== "resolved" && (
                <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-cyan-300 align-middle" />
              )}
            </div>
          );
        })}
        {filteredLogs.length === 0 && (
          <div className="text-white/25">
            {filter ? "no matches for filter" : "awaiting stream…"}
          </div>
        )}
      </div>
    </section>
  );
}

function animateDot(accent: string): string {
  switch (accent) {
    case "cyan":
      return "bg-cyan-400 animate-pulse";
    case "emerald":
      return "bg-emerald-400 animate-pulse";
    default:
      return "bg-purple-400 animate-pulse";
  }
}
