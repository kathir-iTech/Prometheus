"use client";

import { useState, useEffect, useMemo, type CSSProperties } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

const appleFont = `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif`;

const ACCENT = "#8b5cf6";

export default function Home() {
  const [currentText, setCurrentText] = useState("");
  const [firstScanResult, setFirstScanResult] = useState<{
    scores: {
      rigor: number;
      clarity: number;
      evidence: number;
      confidence?: "high" | "moderate" | "low";
    };
    segments: Array<{ text: string; type: string }>;
  } | null>(null);
  const [latestScanResult, setLatestScanResult] = useState<{
    scores: {
      rigor: number;
      clarity: number;
      evidence: number;
      confidence?: "high" | "moderate" | "low";
    };
    segments: Array<{
      text: string;
      type: "normal" | "reasoning_error" | "knowledge_gap" | "unsupported_claim" | "strong";
      label?: string;
      socratic_question?: string;
      grounded?: boolean;
    }>;
    concepts?: Array<{
      id: string;
      label: string;
      status: "solid" | "gap" | "error";
      relatedTo: string[];
    }>;
    transferQuestion?: {
      question: string;
      context: string;
    };
  } | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [sourceMaterial, setSourceMaterial] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanPhraseIndex, setScanPhraseIndex] = useState(0);
  const [hasPendingEdits, setHasPendingEdits] = useState(false);
  const scanPhrases = useMemo(
    () => ["Testing your claim...", "Probing for weaknesses...", "Sharpening the challenge..."],
    []
  );
  const [transferAnswer, setTransferAnswer] = useState("");
  const [transferFeedback, setTransferFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  // VivaMind: focused challenge + inline editing
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftText, setDraftText] = useState("");
  const [editedIndices, setEditedIndices] = useState<Set<number>>(new Set());

  const magicSample = `Homework should be banned because it increases stress with no proven benefit. Studies show students are happier without homework, so banning it will automatically improve grades for everyone. Schools that removed homework saw immediate success, proving it never helps learning.`;

  const handleScan = async () => {
    setIsScanning(true);
    setScanError(null);

    console.log("[handleScan] currentText being sent:", JSON.stringify(currentText));
    console.log("[handleScan] sourceMaterial being sent:", JSON.stringify(sourceMaterial));
    console.log("[handleScan] scanCount before this scan:", scanCount);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentText, sourceMaterial, isRescan: scanCount >= 1 }),
      });

      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || (data && (data as any).error)) {
        setScanError(
          ((data as any) && (data as any).error) ||
            "The analysis request failed. Please check your connection and try again."
        );
        return;
      }

      if (data && (data as any).segments && (data as any).segments.length > 0) {
        setScanCount((prev) => prev + 1);
        setLatestScanResult(data as any);
        setFirstScanResult((prev) =>
          prev
            ? prev
            : {
                scores: (data as any).scores || { rigor: 0, clarity: 0, evidence: 0 },
                segments: (data as any).segments.map((s: any) => ({
                  text: s.text,
                  type: s.type,
                  grounded: s.grounded ?? false,
                })),
              }
        );
        setHasScanned(true);
        setHasPendingEdits(false);
        // reset inline editing state on new scan; focused will be set via effect
        setEditingIndex(null);
        setEditedIndices(new Set());
      } else {
        setScanCount((prev) => prev + 1);
        setLatestScanResult({
          scores: (data as any)?.scores || { rigor: 0, clarity: 0, evidence: 0 },
          segments: [{ text: currentText, type: "normal" }],
        });
        setFirstScanResult((prev) =>
          prev
            ? prev
            : {
                scores: (data as any)?.scores || { rigor: 0, clarity: 0, evidence: 0 },
                segments: [{ text: currentText, type: "normal" }],
              }
        );
        setHasScanned(true);
        setHasPendingEdits(false);
        setEditingIndex(null);
        setEditedIndices(new Set());
      }
    } catch (err) {
      console.error("Scan failed:", err);
      setScanError(
        "The analysis request failed. Please check your connection and try scanning again."
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleMagicSample = () => {
    setCurrentText(magicSample);
  };

  const handleSocraticResponse = (index: number, newText: string) => {
    console.log(`[handleSocraticResponse] called with index=${index}, newText=${JSON.stringify(newText)}`);
    console.log(`[handleSocraticResponse] before segments[${index}]=${JSON.stringify(latestScanResult?.segments?.[index]?.text)}`);
    console.log(`[handleSocraticResponse] before currentText=${JSON.stringify(currentText)}`);
    const segments =
      latestScanResult?.segments.map((seg, i) => {
        if (i === index) {
          return { ...seg, text: newText };
        }
        return seg;
      }) || [];

    setLatestScanResult({
      ...latestScanResult!,
      segments,
    });

    const newCurrentText = segments.map((s) => s.text).join("");
    console.log(`[handleSocraticResponse] after newCurrentText=${JSON.stringify(newCurrentText)}`);
    setCurrentText(newCurrentText);
    setHasPendingEdits(true);
  };

  const handleTransferCheck = async () => {
    if (!latestScanResult?.transferQuestion) return;
    setIsScanning(true);
    try {
      const res = await fetch("/api/transfer-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: latestScanResult.transferQuestion.question,
          context: latestScanResult.transferQuestion.context,
          answer: transferAnswer,
        }),
      });
      const data = await res.json();
      setIsScanning(false);
      if (res.ok && data && data.correctness !== undefined) {
        if (data.correctness === "correct") {
          setScanError(null);
          setTransferFeedback({
            ok: true,
            text: data.feedback || "Correct — nicely applied.",
          });
        } else {
          setScanError("Not quite — " + (data.feedback || "Keep trying"));
          setTransferFeedback({
            ok: false,
            text: "Not quite — " + (data.feedback || "Keep trying"),
          });
        }
      } else {
        setScanError(data.error || "Check failed");
        setTransferFeedback({ ok: false, text: data.error || "Check failed" });
      }
    } catch (err) {
      console.error("Transfer check failed:", err);
      setScanError("Check failed. Please try again.");
      setTransferFeedback({ ok: false, text: "Check failed. Please try again." });
      setIsScanning(false);
    }
  };

  const handleNewTopic = () => {
    setCurrentText("");
    setFirstScanResult(null);
    setLatestScanResult(null);
    setScanCount(0);
    setHasScanned(false);
    setHasPendingEdits(false);
    setScanError(null);
    setSourceMaterial("");
    setTransferAnswer("");
    setTransferFeedback(null);
    setFocusedIndex(null);
    setEditingIndex(null);
    setDraftText("");
    setEditedIndices(new Set());
  };

  const shouldShowLearningDelta =
    scanCount >= 2 && latestScanResult && firstScanResult;

  const errorTypes = new Set(["reasoning_error", "knowledge_gap", "unsupported_claim"]);
  const flaggedIndices =
    latestScanResult?.segments
      .map((s, i) => (errorTypes.has(s.type) ? i : null))
      .filter((v) => v !== null) as number[] || [];

  const firstFlaggedIndex = flaggedIndices.length > 0 ? flaggedIndices[0] : -1;

  // Keep focusedIndex in sync with latest scan: default to highest-priority flagged
  useEffect(() => {
    if (latestScanResult && flaggedIndices.length > 0) {
      // prioritize: reasoning_error > unsupported_claim > knowledge_gap > strong
      const priority: Record<string, number> = {
        reasoning_error: 0,
        unsupported_claim: 1,
        knowledge_gap: 2,
        strong: 3,
        normal: 99,
      };
      let best = flaggedIndices[0];
      let bestPrio = priority[latestScanResult.segments[best].type] ?? 99;
      for (const idx of flaggedIndices) {
        const p = priority[latestScanResult.segments[idx].type] ?? 99;
        if (p < bestPrio) {
          best = idx;
          bestPrio = p;
        }
      }
      // only auto-set if not already focused on a still-flagged index
      if (focusedIndex === null || !flaggedIndices.includes(focusedIndex)) {
        setFocusedIndex(best);
      }
    } else if (flaggedIndices.length === 0) {
      setFocusedIndex(null);
    }
  }, [latestScanResult?.segments]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning) {
      interval = setInterval(() => {
        setScanPhraseIndex((i) => (i + 1) % scanPhrases.length);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [isScanning, scanPhrases]);

  const step1Active = !hasScanned && !isScanning;
  const step2Active = isScanning;
  const step3Active = hasScanned && !isScanning && !shouldShowLearningDelta;
  const step4Active = !!shouldShowLearningDelta;

  type StepStatus = "done" | "active" | "future";

  const stepStatuses: StepStatus[] = [
    step1Active ? "active" : hasScanned ? "done" : "future",
    step2Active ? "active" : hasScanned ? "done" : "future",
    step3Active ? "active" : shouldShowLearningDelta ? "done" : "future",
    step4Active ? "active" : "future",
  ];

  const stepLabels = ["State your claim", "Challenge", "Defend", "Verdict"];

  function getSegmentBorderColor(type: string): string {
    switch (type) {
      case "reasoning_error":
        return "#ef4444";
      case "knowledge_gap":
        return "#eab308";
      case "unsupported_claim":
        return "#f97316";
      case "strong":
        return "#22c55e";
      default:
        return ACCENT;
    }
  }

  function getSegmentBackgroundTint(type: string): string {
    switch (type) {
      case "reasoning_error":
        return "rgba(239, 68, 68, 0.20)";
      case "knowledge_gap":
        return "rgba(234, 179, 8, 0.18)";
      case "unsupported_claim":
        return "rgba(249, 115, 22, 0.22)";
      case "strong":
        return "rgba(34, 197, 94, 0.18)";
      default:
        return "transparent";
    }
  }

  const scanParticles = [
    { left: "12%", bottom: "10%", duration: 7, delay: 0 },
    { left: "38%", bottom: "6%", duration: 9, delay: 1.6 },
    { left: "63%", bottom: "14%", duration: 8, delay: 3.1 },
    { left: "86%", bottom: "8%", duration: 10, delay: 2.2 },
  ];

  const shellClass =
    "min-h-screen antialiased text-zinc-100 bg-gradient-to-br from-[#0f0817] via-[#150b22] to-[#0c0614]";
  const cardClass =
    "bg-white/[0.06] backdrop-blur-2xl border border-violet-400/[0.15] shadow-[0_8px_32px_rgba(139,92,246,0.15)] rounded-2xl p-6 sm:p-8";

  const challengedSegment =
    focusedIndex !== null ? latestScanResult?.segments[focusedIndex] : null;

  const handleStartInlineEdit = (index: number) => {
    const seg = latestScanResult?.segments[index];
    if (!seg || seg.type === "normal") return;
    setFocusedIndex(index);
    setEditingIndex(index);
    setDraftText(seg.text);
  };

  const handleSaveInlineEdit = () => {
    if (editingIndex === null) return;
    const trimmed = draftText.trim();
    if (!trimmed) return;
    handleSocraticResponse(editingIndex, draftText);
    setEditedIndices((prev) => {
      const next = new Set(prev);
      next.add(editingIndex);
      return next;
    });
    setEditingIndex(null);
    setDraftText("");
  };

  const handleCancelInlineEdit = () => {
    setEditingIndex(null);
    setDraftText("");
  };

  // Verdict metrics
  const testedCount = firstScanResult
    ? firstScanResult.segments.filter((s) => errorTypes.has(s.type)).length
    : 0;
  const latestStrongCount = latestScanResult
    ? latestScanResult.segments.filter((s) => s.type === "strong").length
    : 0;
  // defended = strong segments + repaired normal-ish? Use strong as defended
  const defendedCount = latestStrongCount;
  // repaired = first flagged that are now normal or strong in latest
  let repairedCount = 0;
  if (firstScanResult && latestScanResult) {
    const minLen = Math.min(firstScanResult.segments.length, latestScanResult.segments.length);
    for (let i = 0; i < minLen; i++) {
      const wasFlagged = errorTypes.has(firstScanResult.segments[i].type);
      const nowFixed = latestScanResult.segments[i].type === "normal" || latestScanResult.segments[i].type === "strong";
      if (wasFlagged && nowFixed) {
        repairedCount++;
      }
    }
    // fallback: reduction in error-type flagged count
    if (repairedCount === 0 && testedCount > 0) {
      const latestErrors = latestScanResult.segments.filter((s) => errorTypes.has(s.type)).length;
      const firstErrors = firstScanResult.segments.filter((s) => errorTypes.has(s.type)).length;
      const diff = firstErrors - latestErrors;
      if (diff > 0) repairedCount = diff;
    }
  }

  const firstAvg = firstScanResult
    ? Math.round((firstScanResult.scores.rigor + firstScanResult.scores.clarity + firstScanResult.scores.evidence) / 3)
    : 0;
  const latestAvg = latestScanResult
    ? Math.round((latestScanResult.scores.rigor + latestScanResult.scores.clarity + latestScanResult.scores.evidence) / 3)
    : 0;

  return (
    <div className={shellClass} style={{ fontFamily: appleFont }}>
      {/* ===== DESKTOP LEFT RAIL ===== */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[220px] flex-col bg-[#0a0510]/90 backdrop-blur-xl border-r border-violet-400/[0.12] z-20">
        <div className="px-5 pt-6 pb-6">
          <span className="text-[15px] font-medium tracking-tight text-zinc-100">
            VivaMind
          </span>
          <p className="text-[11px] text-zinc-500 mt-1 leading-tight">Don&apos;t just explain it. Defend it.</p>
        </div>
        <nav className="px-3 space-y-1">
          {stepLabels.map((label, i) => {
            const status = stepStatuses[i];
            const isDone = status === "done";
            const isActive = status === "active";
            const labelClass = isActive
              ? "text-zinc-100 font-semibold"
              : isDone
              ? "text-zinc-300 font-medium"
              : "text-zinc-600 font-medium";
            const circleClass = isActive
              ? "bg-violet-500 text-white border-transparent"
              : isDone
              ? "bg-violet-500/20 text-violet-400 border-transparent"
              : "bg-transparent text-zinc-600 border border-violet-400/10";
            return (
              <div
                key={label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${circleClass}`}
                  style={
                    isActive
                      ? { boxShadow: "0 0 12px rgba(139,92,246,0.5)" }
                      : undefined
                  }
                >
                  {isDone ? "✓" : i + 1}
                </span>
                <span className={`text-sm ${labelClass}`}>{`${i + 1}. ${label}`}</span>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ===== MOBILE TOP STEP INDICATOR ===== */}
      <header className="md:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-[#0a0510]/90 backdrop-blur-xl border-b border-violet-400/[0.12]">
        <div className="flex flex-col">
          <span className="text-[15px] font-medium tracking-tight text-zinc-100">
            VivaMind
          </span>
          <span className="text-[10px] text-zinc-500 tracking-wide">Don&apos;t just explain it. Defend it.</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {stepStatuses.map((status, i) => {
            const dotClass =
              status === "active"
                ? "bg-violet-500 w-6"
                : status === "done"
                ? "bg-violet-500/40 w-2.5"
                : "bg-white/10 w-2.5";
            return (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${dotClass}`}
              />
            );
          })}
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="md:ml-[220px] px-4 sm:px-8 py-8 max-w-4xl">
        {/* Step 1: State your claim */}
        {!hasScanned && !isScanning && (
          <div className={cardClass}>
            <h2 className="text-xl font-semibold text-zinc-100">
              State your claim
            </h2>
            <p className="text-sm text-zinc-500 mb-5">
              Make a claim and defend it. VivaMind will act as a sharp opponent — testing every weak link until your reasoning holds.
            </p>
            <textarea
              placeholder="Make a claim and back it with reasoning — e.g. 'Homework should be banned because it increases stress with no proven benefit.'"
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              readOnly={isScanning}
              className="w-full min-h-[220px] resize-none rounded-xl border border-violet-400/[0.12] bg-white/[0.04] p-4 text-[15px] leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors"
              style={{ fontFamily: appleFont }}
            />
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={handleMagicSample}
                className="text-sm text-zinc-500 hover:text-zinc-300 underline-offset-4 hover:underline transition-colors"
                style={{ fontFamily: appleFont }}
              >
                Try an example →
              </button>
              <button
                onClick={handleScan}
                disabled={!currentText.trim() || isScanning}
                className="inline-flex items-center justify-center rounded-lg bg-violet-500 px-6 py-3 text-[15px] font-medium text-white shadow-[0_0_16px_rgba(139,92,246,0.35)] hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                style={{ fontFamily: appleFont }}
              >
                Challenge my claim →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Analyzing / Challenge scanning */}
        {isScanning && (
          <div className={cardClass}>
            <h2 className="text-xl font-semibold text-zinc-100 mb-5">
              Challenging...
            </h2>
            <div className="relative overflow-hidden rounded-xl border border-violet-400/20 violet-border-pulse bg-white/[0.03]">
              <textarea
                readOnly
                value={currentText}
                className="w-full min-h-[220px] resize-none bg-transparent p-4 text-[15px] leading-relaxed text-zinc-100 border-0 focus:outline-none"
                style={{ fontFamily: appleFont }}
              />
              {scanParticles.map((p, i) => (
                <span
                  key={i}
                  className="particle"
                  style={{
                    left: p.left,
                    bottom: p.bottom,
                    animationDuration: `${p.duration}s`,
                    animationDelay: `${p.delay}s`,
                  }}
                />
              ))}
            </div>
            <div className="mt-5 flex items-center justify-center gap-2">
              <span className="text-sm text-zinc-500 tracking-wide">
                {scanPhrases[scanPhraseIndex]}
              </span>
            </div>
          </div>
        )}

        {/* Step 3: Challenge / Defend — focused challenge card + inline passage */}
        {hasScanned && !isScanning && !shouldShowLearningDelta && (
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-zinc-100">
                Defend your claim
              </h2>
              <span className="text-xs uppercase tracking-widest text-zinc-500">
                {flaggedIndices.length} {flaggedIndices.length === 1 ? "challenge" : "challenges"} found
              </span>
            </div>

            {/* Prominent Challenge Card — ONE at a time */}
            {challengedSegment && challengedSegment.type !== "normal" ? (
              <div className="mb-6 rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 backdrop-blur-xl p-5 shadow-[0_4px_24px_rgba(139,92,246,0.18)]">
                <p className="text-[11px] uppercase tracking-widest text-violet-300 mb-2 font-medium">Opponent&apos;s Challenge</p>
                <p className="text-[15px] leading-relaxed text-zinc-100" style={{ fontFamily: appleFont }}>
                  <span className="mr-1">🎯</span> Challenge:{" "}
                  <span className="font-medium">
                    {challengedSegment.socratic_question ||
                      "How would you justify this step without assuming what you're trying to prove?"}
                  </span>
                </p>
                {challengedSegment.label && (
                  <p className="mt-2 text-xs text-zinc-400">
                    Flagged as: <span className="text-zinc-300">{challengedSegment.label}</span> — click the highlighted text below to revise it directly.
                  </p>
                )}
              </div>
            ) : (
              <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <p className="text-sm text-emerald-300 font-medium">No challenges — your claim holds up.</p>
                <p className="text-xs text-emerald-200/70 mt-1">No weak points detected. You can re-analyze after edits or head to Verdict.</p>
              </div>
            )}

            {/* Scores secondary - de-emphasized */}
            <div className="grid grid-cols-3 gap-4 mb-6 opacity-80">
              <StatBar label="Rigor" value={latestScanResult?.scores?.rigor ?? 0} />
              <StatBar label="Clarity" value={latestScanResult?.scores?.clarity ?? 0} />
              <StatBar label="Evidence" value={latestScanResult?.scores?.evidence ?? 0} />
            </div>
            {latestScanResult?.scores?.confidence && (
              <p className="mb-6 text-xs text-zinc-500">
                Confidence:{" "}
                <span className="capitalize text-zinc-400">
                  {latestScanResult.scores.confidence}
                </span>
              </p>
            )}

            <h3 className="text-sm font-medium uppercase tracking-widest text-zinc-500 mb-3">
              Your argument — click to revise
            </h3>
            <div
              className="leading-relaxed text-zinc-100 text-[15px] rounded-xl border border-violet-400/[0.08] bg-white/[0.03] p-4"
              style={{ fontFamily: appleFont }}
            >
              {latestScanResult?.segments.map((seg, i) => {
                const isNormal = seg.type === "normal";
                const isFocused = i === focusedIndex;
                const isEditing = i === editingIndex;
                const isEdited = editedIndices.has(i);
                const isFlagged = !isNormal;

                // Resolved visual: strikethrough fade + checkmark
                if (isEdited && !isEditing) {
                  return (
                    <span key={i} className="inline">
                      <span
                        className="inline-flex items-baseline gap-1.5 rounded-md px-1 py-0.5 mx-0.5 align-baseline"
                        style={{
                          backgroundColor: "rgba(34,197,94,0.12)",
                          textDecorationLine: "line-through",
                          textDecorationColor: "#22c55e",
                          textDecorationThickness: 2,
                          opacity: 0.7,
                          border: isFocused ? "1px solid rgba(34,197,94,0.5)" : "1px solid transparent",
                          borderRadius: 4,
                        }}
                        title="Revised — re-analyze to lock it in"
                      >
                        <span>{seg.text}</span>
                        <span className="text-emerald-400 text-xs font-bold">✓ repaired</span>
                      </span>
                    </span>
                  );
                }

                if (isEditing) {
                  return (
                    <span key={i} className="inline">
                      <textarea
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        autoFocus
                        rows={2}
                        className="inline w-full min-w-[220px] rounded-lg border border-violet-500 bg-white/[0.08] p-2 text-[15px] leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 align-baseline"
                        style={{ fontFamily: appleFont, verticalAlign: "baseline" }}
                      />
                      <span className="inline-flex gap-2 ml-2 align-baseline">
                        <button
                          onClick={handleSaveInlineEdit}
                          disabled={!draftText.trim()}
                          className="text-xs px-3 py-1 rounded-md bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-40"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelInlineEdit}
                          className="text-xs px-3 py-1 rounded-md bg-white/10 text-zinc-300 hover:bg-white/15"
                        >
                          Cancel
                        </button>
                      </span>
                    </span>
                  );
                }

                const segmentStyle: CSSProperties = isNormal
                  ? {}
                  : {
                      backgroundColor: getSegmentBackgroundTint(seg.type),
                      textDecorationLine: "underline",
                      textDecorationColor: getSegmentBorderColor(seg.type),
                      textDecorationThickness: 2,
                      textUnderlineOffset: 4,
                      paddingInline: 4,
                      borderRadius: 4,
                      outline: isFocused ? `2px solid ${getSegmentBorderColor(seg.type)}` : "none",
                      outlineOffset: 2,
                      cursor: isFlagged ? "pointer" : undefined,
                    };
                const onClick = isFlagged ? () => handleStartInlineEdit(i) : undefined;
                return (
                  <span key={i}>
                    {i === firstFlaggedIndex && !isEdited && (
                      <span
                        className="pulse-dot mr-1.5 inline-block h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.9)] align-baseline"
                        title="Start here"
                      />
                    )}
                    <span
                      style={segmentStyle}
                      onClick={onClick}
                      role={isFlagged ? "button" : undefined}
                      className={isFlagged ? "hover:opacity-80 transition-opacity" : undefined}
                      title={isFlagged ? "Click to revise this claim directly" : undefined}
                    >
                      {seg.text}
                    </span>
                  </span>
                );
              })}
            </div>

            <p className="mt-3 text-xs text-zinc-500">
              Click any highlighted claim to edit it inline — your revision replaces the text directly.
            </p>

            {/* Other challenges list */}
            {flaggedIndices.length > 1 && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">
                  Other challenges ({flaggedIndices.length - 1} more)
                </p>
                <div className="flex flex-wrap gap-2">
                  {flaggedIndices.map((idx) => {
                    if (idx === focusedIndex) return null;
                    const seg = latestScanResult!.segments[idx];
                    const isEdited = editedIndices.has(idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => setFocusedIndex(idx)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          isEdited
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 line-through decoration-emerald-400"
                            : "bg-white/[0.04] border-violet-400/20 text-zinc-400 hover:text-zinc-200 hover:border-violet-400/30"
                        }`}
                        style={{ fontFamily: appleFont }}
                      >
                        {isEdited ? "✓ " : ""}
                        {(seg.label || seg.type).replace("_", " ")} — {seg.text.slice(0, 28)}...
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-violet-400/[0.12] pt-6">
              <span className="text-sm text-zinc-500">
                {hasPendingEdits
                  ? "Revised — re-analyze to see if your defense holds."
                  : "Revise the highlighted claim above to defend it."}
              </span>
              <button
                onClick={handleScan}
                disabled={!currentText.trim() || isScanning || !hasPendingEdits}
                className={
                  hasPendingEdits
                    ? "inline-flex items-center justify-center rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-medium text-white shadow-[0_0_16px_rgba(139,92,246,0.35)] hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    : "inline-flex items-center justify-center rounded-lg bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-zinc-500 border border-white/10 cursor-not-allowed"
                }
                style={{ fontFamily: appleFont }}
              >
                Re-analyze →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Verdict */}
        {shouldShowLearningDelta && latestScanResult && firstScanResult && (
          <div className={cardClass}>
            <h2 className="text-xl font-semibold text-zinc-100 mb-1">Verdict</h2>
            <p className="text-sm text-zinc-500 mb-6">
              Your defense, measured.
            </p>

            {/* Headline: X tested · Y defended · Z repaired */}
            <div className="rounded-xl border border-violet-400/20 bg-white/[0.04] p-5 mb-6 text-center">
              <p className="text-lg font-semibold text-zinc-100 tracking-tight">
                {testedCount} claims tested · {defendedCount} defended · {repairedCount} repaired
              </p>
              <p className="text-xs text-zinc-500 mt-2">
                Scan {scanCount} results vs. first attempt — see delta below
              </p>
            </div>

            {/* Secondary: numeric score delta */}
            <div className="grid grid-cols-3 gap-4 mb-2">
              <DeltaBar
                label="Rigor"
                value={latestScanResult.scores.rigor}
                prior={firstScanResult.scores.rigor}
              />
              <DeltaBar
                label="Clarity"
                value={latestScanResult.scores.clarity}
                prior={firstScanResult.scores.clarity}
              />
              <DeltaBar
                label="Evidence"
                value={latestScanResult.scores.evidence}
                prior={firstScanResult.scores.evidence}
              />
            </div>
            <p className="text-xs text-zinc-500 text-center mb-6">
              was {firstAvg} avg → now {latestAvg} avg
              <span className={latestAvg >= firstAvg ? " text-emerald-400" : " text-zinc-500"}>
                {" "}{latestAvg >= firstAvg ? "▲" : "▼"} {latestAvg - firstAvg > 0 ? `+${latestAvg - firstAvg}` : latestAvg - firstAvg}
              </span>
            </p>
            {latestScanResult.scores.confidence && (
              <p className="mb-8 text-xs text-zinc-500 text-center">
                Confidence:{" "}
                <span className="capitalize text-zinc-400">
                  {latestScanResult.scores.confidence}
                </span>
              </p>
            )}

            {latestScanResult?.transferQuestion?.question && (
              <div className="rounded-xl border border-violet-400/[0.12] bg-white/[0.04] p-6">
                <h3
                  className="text-base font-semibold tracking-tight text-zinc-100 mb-1"
                  style={{ fontFamily: appleFont }}
                >
                  Stress Test
                </h3>
                <p className="text-sm text-violet-300 mb-3" style={{ fontFamily: appleFont }}>
                  One more test: does your reasoning survive this?
                </p>
                <p
                  className="text-zinc-300 text-sm leading-relaxed mb-2"
                  style={{ fontFamily: appleFont }}
                >
                  {latestScanResult.transferQuestion.question}
                </p>
                <p
                  className="text-zinc-500 text-xs leading-relaxed mb-5"
                  style={{ fontFamily: appleFont }}
                >
                  {latestScanResult.transferQuestion.context}
                </p>
                <textarea
                  placeholder="Your answer here..."
                  value={transferAnswer}
                  onChange={(e) => setTransferAnswer(e.target.value)}
                  className="w-full rounded-xl border border-violet-400/[0.12] bg-white/[0.04] p-3 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 min-h-[100px] resize-none"
                  style={{ fontFamily: appleFont }}
                />
                {transferFeedback && (
                  <p
                    className={`mt-3 text-sm leading-relaxed ${
                      transferFeedback.ok ? "text-emerald-400" : "text-amber-400"
                    }`}
                    style={{ fontFamily: appleFont }}
                  >
                    {transferFeedback.text}
                  </p>
                )}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      setTransferAnswer("");
                      setTransferFeedback(null);
                    }}
                    className="text-sm text-zinc-400 hover:text-zinc-200 underline-offset-4 hover:underline transition-colors"
                    style={{ fontFamily: appleFont }}
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleTransferCheck}
                    disabled={!transferAnswer.trim() || isScanning}
                    className="ml-auto inline-flex items-center justify-center rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-medium text-white shadow-[0_0_16px_rgba(139,92,246,0.35)] hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    style={{ fontFamily: appleFont }}
                  >
                    Check
                  </button>
                </div>
              </div>
            )}

            <div className="mt-10 flex justify-center border-t border-violet-400/[0.12] pt-8">
              <button
                onClick={handleNewTopic}
                className="inline-flex items-center justify-center rounded-lg bg-violet-500 px-6 py-3 text-[15px] font-medium text-white shadow-[0_0_16px_rgba(139,92,246,0.35)] hover:bg-violet-600 transition-colors"
                style={{ fontFamily: appleFont }}
              >
                Defend a new claim →
              </button>
            </div>
          </div>
        )}
        {scanError && (
          <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-300" style={{ fontFamily: appleFont }}>{scanError}</p>
          </div>
        )}
      </main>
    </div>
  );
}

function StatBar({ label, value }: { label: string; value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  useEffect(() => {
    const controls = animate(count, value, { duration: 0.8, ease: "easeOut" });
    return () => controls.stop();
  }, [value, count]);

  return (
    <div className="text-left">
      <span className="text-xs uppercase tracking-widest text-zinc-500">{label}</span>
      <p className="text-2xl font-bold text-zinc-100 leading-tight">
        <motion.span>{rounded}</motion.span>
      </p>
      <div className="mt-2 h-1 w-full rounded-full bg-white/[0.08] overflow-hidden">
        <div
          className="h-full rounded-full bg-violet-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function DeltaBar({
  label,
  value,
  prior,
}: {
  label: string;
  value: number;
  prior: number;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  useEffect(() => {
    const controls = animate(count, value, { duration: 0.8, ease: "easeOut" });
    return () => controls.stop();
  }, [value, count]);

  const improved = value >= prior;

  return (
    <div className="text-left">
      <span className="text-xs uppercase tracking-widest text-zinc-500">{label}</span>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-zinc-100 leading-tight">
          <motion.span>{rounded}</motion.span>
        </p>
        <span className="text-xs text-zinc-500">was {prior}</span>
        <span className={`text-xs ${improved ? "text-emerald-500" : "text-zinc-600"}`}>
          {improved ? "▲" : "▼"}
        </span>
      </div>
      <div className="mt-2 h-1 w-full rounded-full bg-white/[0.08] overflow-hidden">
        <div
          className="h-full rounded-full bg-violet-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
