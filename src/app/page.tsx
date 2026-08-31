"use client";

import { useEffect, useState } from "react";
import type {
  ScanResult,
  Segment,
  SegmentType,
  Confidence,
} from "@/lib/types";

type WorkSegment = Segment & { edited: boolean; resolved: boolean };

const STEPS = [
  "State your claim",
  "Challenge",
  "Defend",
  "Verdict",
] as const;

const STATUS_MSGS = [
  "Analyzing your claim...",
  "Checking the evidence...",
  "Almost done...",
];

const FLAGGED: SegmentType[] = [
  "reasoning_error",
  "unsupported_claim",
  "knowledge_gap",
];

function isFlagged(type: SegmentType): boolean {
  return FLAGGED.includes(type);
}

function priorityRank(type: SegmentType): number {
  switch (type) {
    case "reasoning_error":
      return 3;
    case "unsupported_claim":
      return 2;
    case "knowledge_gap":
      return 1;
    default:
      return 0;
  }
}

function segBorderClass(type: SegmentType): string {
  switch (type) {
    case "reasoning_error":
      return "border-l-2 border-red-500/70";
    case "unsupported_claim":
      return "border-l-2 border-orange-500/70";
    case "knowledge_gap":
      return "border-l-2 border-yellow-500/70";
    case "strong":
      return "border-l-2 border-green-500/70";
    default:
      return "";
  }
}

function segLabelClass(type: SegmentType): string {
  switch (type) {
    case "reasoning_error":
      return "text-red-300";
    case "unsupported_claim":
      return "text-orange-300";
    case "knowledge_gap":
      return "text-yellow-300";
    case "strong":
      return "text-green-300";
    default:
      return "text-white/40";
  }
}

function topChallenge(segments: Segment[]): Segment | null {
  let best: Segment | null = null;
  let bestRank = -1;
  for (const s of segments) {
    if (!isFlagged(s.type)) continue;
    const r = priorityRank(s.type);
    if (r > bestRank) {
      bestRank = r;
      best = s;
    }
  }
  return best;
}

function wordOverlap(a: string, b: string): number {
  const ta = new Set(
    a.split(/\s+/).map((w) => w.replace(/[^a-z0-9]/gi, "")).filter(Boolean)
  );
  const tb = new Set(
    b.split(/\s+/).map((w) => w.replace(/[^a-z0-9]/gi, "")).filter(Boolean)
  );
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const w of ta) if (tb.has(w)) inter++;
  return inter / Math.max(ta.size, tb.size);
}

function computeVerdict(first: ScanResult, latest: ScanResult) {
  const firstFlagged = first.segments.filter((s) => isFlagged(s.type));
  const X = firstFlagged.length;
  let Y = 0;
  let Z = 0;
  for (const f of firstFlagged) {
    const fn = f.text.trim().toLowerCase();
    let best: Segment | null = null;
    let bestScore = 0;
    for (const g of latest.segments) {
      const gn = g.text.trim().toLowerCase();
      if (!gn) continue;
      const ov = wordOverlap(fn, gn);
      if (ov > bestScore) {
        bestScore = ov;
        best = g;
      }
    }
    const improved = best && (best.type === "normal" || best.type === "strong");
    if (improved) Y++;
    if (best && best.type === "strong") Z++;
  }
  return { X, Y, Z };
}

function ScoreBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-white/60">{label}</span>
        <span className="text-2xl font-semibold text-white">{value}</span>
      </div>
      <div className="h-1 w-full rounded-full bg-white/10">
        <div
          className="h-1 rounded-full bg-violet-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function Page() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [firstScan, setFirstScan] = useState<ScanResult | null>(null);
  const [latestScan, setLatestScan] = useState<ScanResult | null>(null);
  const [segments, setSegments] = useState<WorkSegment[]>([]);
  const [hasEdits, setHasEdits] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!loading) return;
    setStatusIdx(0);
    const id = setInterval(
      () => setStatusIdx((i) => (i + 1) % STATUS_MSGS.length),
      1300
    );
    return () => clearInterval(id);
  }, [loading]);

  async function runAnalysis(text: string, isFirst: boolean) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Analysis failed");
      const scan = data as ScanResult;
      if (isFirst && !firstScan) setFirstScan(scan);
      setLatestScan(scan);
      setSegments(
        scan.segments.map((s) => ({ ...s, edited: false, resolved: false }))
      );
      setHasEdits(false);
      setEditingIdx(null);
      return scan;
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function handleChallenge() {
    if (!input.trim() || loading) return;
    const scan = await runAnalysis(input, true);
    if (scan) setStep(2);
  }

  async function handleReanalyze() {
    if (!hasEdits || loading) return;
    const currentText = segments.map((s) => s.text).join("");
    const scan = await runAnalysis(currentText, false);
    if (scan) setStep(4);
  }

  function beginEdit(idx: number) {
    setEditingIdx(idx);
    setDraft(segments[idx].text);
  }

  function saveEdit() {
    if (editingIdx === null) return;
    const idx = editingIdx;
    setSegments((prev) =>
      prev.map((s, i) =>
        i === idx
          ? { ...s, text: draft, edited: true, resolved: true }
          : s
      )
    );
    setHasEdits(true);
    setEditingIdx(null);
  }

  function cancelEdit() {
    setEditingIdx(null);
    setDraft("");
  }

  function reset() {
    setStep(1);
    setInput("");
    setFirstScan(null);
    setLatestScan(null);
    setSegments([]);
    setHasEdits(false);
    setEditingIdx(null);
    setError(null);
  }

  const displayed = latestScan;
  const challenge = displayed ? topChallenge(displayed.segments) : null;
  const anyFlagged = displayed
    ? displayed.segments.some((s) => isFlagged(s.type))
    : false;

  const verdict =
    firstScan && latestScan ? computeVerdict(firstScan, latestScan) : null;

  return (
    <div className="min-h-screen w-full bg-[#0b0d12] text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-5 py-8 md:flex-row md:gap-10">
        {/* Sidebar */}
        <aside className="md:w-56 md:shrink-0">
          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-tight text-white">
              VivaMind
            </h1>
            <p className="mt-1 text-sm text-violet-400">
              Don&apos;t just explain it. Defend it.
            </p>
          </div>
          <nav className="flex flex-row gap-4 md:flex-col md:gap-3">
            {STEPS.map((label, i) => {
              const n = (i + 1) as 1 | 2 | 3 | 4;
              const active = step === n;
              const done = step > n;
              return (
                <div key={label} className="flex items-center gap-3">
                  <span
                    className={
                      active
                        ? "flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-xs font-semibold text-white"
                        : done
                          ? "flex h-6 w-6 items-center justify-center rounded-full border border-violet-500/60 text-xs text-violet-300"
                          : "flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-xs text-white/40"
                    }
                  >
                    {n}
                  </span>
                  <span
                    className={
                      active
                        ? "text-sm font-medium text-white"
                        : done
                          ? "text-sm text-white/60"
                          : "text-sm text-white/40"
                    }
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-[#14171f] p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* STEP 1 — State your claim */}
          {step === 1 && (
            <section className="rounded-xl border border-white/[0.08] bg-[#14171f] p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-white">
                State your claim
              </h2>
              <p className="mt-1 text-sm text-white/50">
                Make a claim and back it with reasoning.
              </p>
              <div className="relative mt-4">
                <textarea
                  className="min-h-[160px] w-full resize-y rounded-lg border border-white/[0.08] bg-[#0b0d12] p-4 text-white outline-none focus:border-violet-500"
                  placeholder="Make a claim and back it with reasoning — e.g. 'Homework should be banned because it increases stress with no proven benefit.'"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                />
                {loading && (
                  <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-violet-500 animate-border-pulse" />
                )}
              </div>
              {loading ? (
                <div className="mt-4 text-sm text-violet-300">
                  {STATUS_MSGS[statusIdx]}
                </div>
              ) : (
                <button
                  className="mt-4 rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-600"
                  onClick={handleChallenge}
                  disabled={!input.trim()}
                >
                  Challenge my claim →
                </button>
              )}
            </section>
          )}

          {/* STEP 2 — Challenge */}
          {step === 2 && displayed && (
            <section className="flex flex-col gap-5">
              <div className="rounded-xl border border-white/[0.08] bg-[#14171f] p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-white">Challenge</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <ScoreBar label="Rigor" value={displayed.scores.rigor} />
                  <ScoreBar label="Clarity" value={displayed.scores.clarity} />
                  <ScoreBar label="Evidence" value={displayed.scores.evidence} />
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-white/50">Confidence:</span>
                  <span className="font-medium capitalize text-violet-300">
                    {displayed.confidence}
                  </span>
                </div>
              </div>

              {challenge ? (
                <div className="rounded-xl border border-violet-500/40 bg-[#14171f] p-5 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wide text-violet-300">
                    🎯 Challenge
                  </div>
                  <p className="mt-2 text-base text-white">
                    {challenge.socratic_question}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-green-500/40 bg-[#14171f] p-5 shadow-sm text-green-300">
                  No challenges — your claim holds up.
                </div>
              )}

              <div className="rounded-xl border border-white/[0.08] bg-[#14171f] p-5 shadow-sm">
                <div className="whitespace-pre-wrap text-[15px] leading-7 text-white/90">
                  {displayed.segments.map((s, i) =>
                    isFlagged(s.type) ? (
                      <span
                        key={i}
                        className={`${segBorderClass(s.type)} inline-block pl-2`}
                      >
                        {s.text}
                      </span>
                    ) : (
                      <span key={i}>{s.text}</span>
                    )
                  )}
                </div>
              </div>

              {anyFlagged ? (
                <button
                  className="self-start rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-600"
                  onClick={() => setStep(3)}
                >
                  Defend this claim →
                </button>
              ) : (
                <button
                  className="self-start rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-600"
                  onClick={() => setStep(4)}
                >
                  See verdict →
                </button>
              )}
            </section>
          )}

          {/* STEP 3 — Defend */}
          {step === 3 && displayed && (
            <section className="flex flex-col gap-5">
              {challenge && (
                <div className="rounded-xl border border-violet-500/40 bg-[#14171f] p-5 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wide text-violet-300">
                    🎯 Challenge
                  </div>
                  <p className="mt-2 text-base text-white">
                    {challenge.socratic_question}
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-white/[0.08] bg-[#14171f] p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-white">Defend</h2>
                <p className="mt-1 text-sm text-white/50">
                  Click a highlighted claim to revise it, then re-analyze.
                </p>
                <div className="mt-4 flex flex-col gap-3">
                  {segments.map((s, i) =>
                    isFlagged(s.type) ? (
                      <div
                        key={i}
                        className={`rounded-r-md ${segBorderClass(
                          s.type
                        )} bg-white/[0.02] p-3`}
                      >
                        <div
                          className={`text-xs font-semibold uppercase tracking-wide ${segLabelClass(
                            s.type
                          )}`}
                        >
                          {s.label || s.type.replace("_", " ")}
                        </div>
                        {editingIdx === i ? (
                          <div className="mt-2">
                            <textarea
                              className="min-h-[90px] w-full resize-y rounded-lg border border-violet-500 bg-[#0b0d12] p-3 text-white outline-none"
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                            />
                            <div className="mt-2 flex gap-2">
                              <button
                                className="rounded-lg bg-violet-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-violet-600"
                                onClick={saveEdit}
                              >
                                Save
                              </button>
                              <button
                                className="rounded-lg border border-white/15 px-4 py-1.5 text-sm text-white/70"
                                onClick={cancelEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="mt-1 block text-left text-[15px] leading-7 text-white"
                            onClick={() => beginEdit(i)}
                            disabled={s.resolved}
                          >
                            {s.resolved ? (
                              <span className="text-white/50 line-through">
                                {s.text}
                              </span>
                            ) : (
                              s.text
                            )}
                            {s.resolved && (
                              <span className="ml-2 text-green-400">✓</span>
                            )}
                          </button>
                        )}
                      </div>
                    ) : (
                      <span key={i} className="text-[15px] leading-7 text-white/90">
                        {s.text}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  className={
                    hasEdits && !loading
                      ? "rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-600"
                      : "cursor-not-allowed rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white opacity-40"
                  }
                  onClick={handleReanalyze}
                  disabled={!hasEdits || loading}
                >
                  Re-analyze →
                </button>
                {!hasEdits && (
                  <span className="text-sm text-white/40">
                    Revise a highlighted claim above to defend it.
                  </span>
                )}
                {loading && (
                  <span className="text-sm text-violet-300">
                    {STATUS_MSGS[statusIdx]}
                  </span>
                )}
              </div>
            </section>
          )}

          {/* STEP 4 — Verdict */}
          {step === 4 && firstScan && latestScan && verdict && (
            <section className="flex flex-col gap-5">
              <div className="rounded-xl border border-white/[0.08] bg-[#14171f] p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-white">Verdict</h2>
                <p className="mt-3 text-2xl font-bold text-white">
                  {verdict.X} claims tested · {verdict.Y} defended ·{" "}
                  {verdict.Z} repaired
                </p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="text-sm">
                    <span className="text-white/50">Rigor: </span>
                    <span className="text-white">
                      {firstScan.scores.rigor} → {latestScan.scores.rigor}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-white/50">Clarity: </span>
                    <span className="text-white">
                      {firstScan.scores.clarity} → {latestScan.scores.clarity}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-white/50">Evidence: </span>
                    <span className="text-white">
                      {firstScan.scores.evidence} →{" "}
                      {latestScan.scores.evidence}
                    </span>
                  </div>
                </div>
              </div>

              <button
                className="self-start rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-600"
                onClick={reset}
              >
                Explain a new claim →
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
