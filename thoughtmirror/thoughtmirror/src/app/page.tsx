"use client";

import { useState, useEffect, useMemo, type CSSProperties } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";

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
    () => ["Reading your explanation...", "Finding gaps...", "Almost ready..."],
    []
  );
  const [transferAnswer, setTransferAnswer] = useState("");
  const [transferFeedback, setTransferFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const magicSample = `Neural networks are made of brain cells called neurons that fire electricity. When we think, the neurons send signals to each other through synopses. This is how we learn things and remember them forever. The brain is like a computer made of meat.`;

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

      if (!res.ok || (data && data.error)) {
        setScanError(
          (data && data.error) ||
            "The analysis request failed. Please check your connection and try again."
        );
        return;
      }

      if (data && data.segments && data.segments.length > 0) {
        setScanCount((prev) => prev + 1);
        setLatestScanResult(data);
        setFirstScanResult((prev) =>
          prev
            ? prev
            : {
                scores: data.scores || { rigor: 0, clarity: 0, evidence: 0 },
                segments: data.segments.map((s: unknown) => ({
                  text: s.text,
                  type: s.type,
                  grounded: s.grounded ?? false,
                })),
              }
        );
        setHasScanned(true);
        setHasPendingEdits(false);
      } else {
        setScanCount((prev) => prev + 1);
        setLatestScanResult({
          scores: data?.scores || { rigor: 0, clarity: 0, evidence: 0 },
          segments: [{ text: currentText, type: "normal" }],
        });
        setFirstScanResult((prev) =>
          prev
            ? prev
            : {
                scores: data?.scores || { rigor: 0, clarity: 0, evidence: 0 },
                segments: [{ text: currentText, type: "normal" }],
              }
        );
        setHasScanned(true);
        setHasPendingEdits(false);
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
    setOpenIndex(null);
  };

  const shouldShowLearningDelta =
    scanCount >= 2 && latestScanResult && firstScanResult;

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
  const step4Active = shouldShowLearningDelta;

  type StepStatus = "done" | "active" | "future";

  const stepStatuses: StepStatus[] = [
    step1Active ? "active" : hasScanned ? "done" : "future",
    step2Active ? "active" : hasScanned ? "done" : "future",
    step3Active ? "active" : shouldShowLearningDelta ? "done" : "future",
    step4Active ? "active" : "future",
  ];

  const stepLabels = ["Explain", "Analyze", "Repair", "Measure"];

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

  return (
    <div className={shellClass} style={{ fontFamily: appleFont }}>
      {/* ===== DESKTOP LEFT RAIL ===== */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[220px] flex-col bg-[#0a0510]/90 backdrop-blur-xl border-r border-violet-400/[0.12] z-20">
        <div className="px-5 pt-6 pb-6">
          <span className="text-[15px] font-medium tracking-tight text-zinc-100">
            ThoughtMirror
          </span>
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
        <span className="text-[15px] font-medium tracking-tight text-zinc-100">
          ThoughtMirror
        </span>
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
        {/* Step 1: Explain */}
        {!hasScanned && !isScanning && (
          <div className={cardClass}>
            <h2 className="text-xl font-semibold text-zinc-100 mb-1">
              Explain a concept
            </h2>
            <p className="text-sm text-zinc-500 mb-5">
              In your own words — no right answer yet, just your thinking.
            </p>
            <textarea
              placeholder="Explain a concept in your own words..."
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
                Analyze my thinking →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Analyze / scanning */}
        {isScanning && (
          <div className={cardClass}>
            <h2 className="text-xl font-semibold text-zinc-100 mb-5">
              Analyzing
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

        {/* Step 3: Results */}
        {hasScanned && !isScanning && !shouldShowLearningDelta && (
          <div className={cardClass}>
            <h2 className="text-xl font-semibold text-zinc-100 mb-5">
              What we found
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-2">
              <StatBar label="Rigor" value={latestScanResult?.scores?.rigor ?? 0} />
              <StatBar label="Clarity" value={latestScanResult?.scores?.clarity ?? 0} />
              <StatBar label="Evidence" value={latestScanResult?.scores?.evidence ?? 0} />
            </div>
            {latestScanResult?.scores?.confidence && (
              <p className="mb-8 text-xs text-zinc-500">
                Confidence:{" "}
                <span className="capitalize text-zinc-400">
                  {latestScanResult.scores.confidence}
                </span>
              </p>
            )}
            {!latestScanResult?.scores?.confidence && <div className="mb-6" />}

            <h3 className="text-sm font-medium uppercase tracking-widest text-zinc-500 mb-3">
              Analysis
            </h3>
            <div
              className="leading-relaxed text-zinc-100 text-[15px]"
              style={{ fontFamily: appleFont }}
            >
              {latestScanResult?.segments.map((seg, i) => {
                const isNormal = seg.type === "normal";
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
                    };
                const onClick = isNormal ? undefined : () => setOpenIndex(i);
                return (
                  <span
                    key={i}
                    style={segmentStyle}
                    onClick={onClick}
                    role={isNormal ? undefined : "button"}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {seg.text}
                  </span>
                );
              })}
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              Click any highlighted segment to open a guided repair.
            </p>

            <div className="mt-8 flex items-center justify-between border-t border-violet-400/[0.12] pt-6">
              <span className="text-sm text-zinc-500">
                {hasPendingEdits
                  ? "Repaired — re-analyze to measure progress."
                  : "Repair issues above, then re-analyze to see your growth."}
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

        {/* Step 4: Measure / Learning Delta */}
        {shouldShowLearningDelta && latestScanResult && firstScanResult && (
          <div className={cardClass}>
            <h2 className="text-xl font-semibold text-zinc-100 mb-1">
              Learning delta
            </h2>
            <p className="text-sm text-zinc-500 mb-6">
              Your scores compared with your first attempt.
            </p>

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
            {latestScanResult.scores.confidence && (
              <p className="mb-8 text-xs text-zinc-500">
                Confidence:{" "}
                <span className="capitalize text-zinc-400">
                  {latestScanResult.scores.confidence}
                </span>
              </p>
            )}
            {!latestScanResult.scores.confidence && <div className="mb-6" />}

            {latestScanResult?.transferQuestion?.question && (
              <div className="rounded-xl border border-violet-400/[0.12] bg-white/[0.04] p-6">
                <h3
                  className="text-base font-semibold tracking-tight text-zinc-100 mb-3"
                  style={{ fontFamily: appleFont }}
                >
                  One more thing — prove it
                </h3>
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
                Explain a new topic →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ===== SOCRATIC MODAL (overlays on Step 3) ===== */}
      <AnimatePresence>
        {openIndex !== null && latestScanResult?.segments[openIndex] && (
          <SocraticModal
            key="socratic"
            segment={latestScanResult.segments[openIndex]}
            index={openIndex}
            onClose={() => setOpenIndex(null)}
            onSubmit={(text) => {
              handleSocraticResponse(openIndex, text);
              setOpenIndex(null);
            }}
          />
        )}
      </AnimatePresence>
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
      <p className="text-4xl font-bold text-zinc-100 leading-tight">
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
        <p className="text-4xl font-bold text-zinc-100 leading-tight">
          <motion.span>{rounded}</motion.span>
        </p>
        <span className="text-sm text-zinc-500">was {prior}</span>
        <span className={improved ? "text-emerald-500" : "text-zinc-600"}>
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

function SocraticModal({
  segment,
  index,
  onClose,
  onSubmit,
}: {
  segment: {
    text: string;
    type: string;
    label?: string;
    socratic_question?: string;
  };
  index: number;
  onClose: () => void;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState(segment.text);

  useEffect(() => {
    setText(segment.text);
  }, [segment.text, index]);

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        className="relative w-full max-w-lg rounded-2xl border border-violet-400/[0.15] bg-white/[0.06] backdrop-blur-2xl shadow-[0_8px_32px_rgba(139,92,246,0.25)] p-6"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        style={{ fontFamily: appleFont }}
      >
        <h3 className="text-xl font-semibold text-zinc-100 mb-2">
          Repair this reasoning
        </h3>
        <p className="text-sm text-zinc-400 leading-relaxed mb-4">
          {segment.socratic_question ||
            "Rewrite this part to address the issue in your own words."}
        </p>
        <div className="mb-3 rounded-lg border-l-2 border-violet-400/30 bg-white/[0.04] px-3 py-2 text-xs text-zinc-500">
          {segment.text}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full min-h-[120px] resize-none rounded-xl border border-violet-400/[0.12] bg-white/[0.04] p-3 text-[15px] leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          style={{ fontFamily: appleFont }}
        />
        <div className="mt-4 flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            className="text-sm text-zinc-400 hover:text-zinc-200 underline-offset-4 hover:underline transition-colors"
            style={{ fontFamily: appleFont }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(text)}
            disabled={!text.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-medium text-white shadow-[0_0_16px_rgba(139,92,246,0.35)] hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            style={{ fontFamily: appleFont }}
          >
            Save repair
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
