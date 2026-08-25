"use client";

import { useState, useEffect, useMemo, type ReactElement } from "react";
import { Ring } from "@/components/lib/ring";
import { ConceptMap } from "@/components/lib/concept-map";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [originalText, setOriginalText] = useState("");
  const [currentText, setCurrentText] = useState("");
  const [firstScanResult, setFirstScanResult] = useState<{
    scores: { rigor: number; clarity: number; evidence: number };
    segments: Array<{ text: string; type: string }>;
  } | null>(null);
  const [latestScanResult, setLatestScanResult] = useState<{
    scores: { rigor: number; clarity: number; evidence: number };
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
    setOriginalText(magicSample);
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
          console.log("Transfer answer correct:", data.feedback);
        } else {
          setScanError("Not quite — " + (data.feedback || "Keep trying"));
        }
      } else {
        setScanError(data.error || "Check failed");
      }
    } catch (err) {
      console.error("Transfer check failed:", err);
      setScanError("Check failed. Please try again.");
      setIsScanning(false);
    }
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

  const resolveIssuesCount = (): number => {
    if (!latestScanResult || !firstScanResult) return 0;
    const firstFlagged = firstScanResult.segments.filter((s) => s.type !== "normal").length;
    const latestFlagged = latestScanResult.segments.filter((s) => s.type !== "normal").length;
    return Math.max(0, firstFlagged - latestFlagged);
  };

  const computeIssueStats = (): string => {
    if (!latestScanResult) return "";
    const counts: Record<string, number> = {
      reasoning_error: 0,
      knowledge_gap: 0,
      unsupported_claim: 0,
      strong: 0,
    };
    for (const seg of latestScanResult.segments) {
      if (seg.type in counts) {
        counts[seg.type as keyof typeof counts]++;
      }
    }
    const parts: string[] = [];
    if (counts.reasoning_error > 0) {
      parts.push(`${counts.reasoning_error} Reasoning ${counts.reasoning_error === 1 ? "Error" : "Errors"}`);
    }
    if (counts.knowledge_gap > 0) {
      parts.push(`${counts.knowledge_gap} Knowledge ${counts.knowledge_gap === 1 ? "Gap" : "Gaps"}`);
    }
    if (counts.unsupported_claim > 0) {
      parts.push(`${counts.unsupported_claim} Unsupported ${counts.unsupported_claim === 1 ? "Claim" : "Claims"}`);
    }
    if (counts.strong > 0) {
      parts.push(`${counts.strong} Strong ${counts.strong === 1 ? "Point" : "Points"}`);
    }
    return parts.join(" · ");
  };

const renderRings = () => {
    if (!latestScanResult) return null;
const rings: ReactElement[] = [
      <motion.div key="rigor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" as const }}>
        <Ring title="Rigor" value={latestScanResult.scores.rigor ?? 0} max={100} />
      </motion.div>,
      <motion.div key="clarity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" as const, delay: 0.08 }}>
        <Ring title="Clarity" value={latestScanResult.scores.clarity ?? 0} max={100} />
      </motion.div>,
      <motion.div key="evidence" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" as const, delay: 0.16 }}>
        <Ring title="Evidence" value={latestScanResult.scores.evidence ?? 0} max={100} />
      </motion.div>
    ];

    if (shouldShowLearningDelta && firstScanResult) {
      rings.push(
        <motion.div key="rigor-base">
          <Ring title="Rigor" value={firstScanResult.scores.rigor ?? 0} max={100} />
        </motion.div>,
        <motion.div key="clarity-base">
          <Ring title="Clarity" value={firstScanResult.scores.clarity ?? 0} max={100} />
        </motion.div>,
        <motion.div key="evidence-base">
          <Ring title="Evidence" value={firstScanResult.scores.evidence ?? 0} max={100} />
        </motion.div>
      );
    }
    return rings;
  };

  const appleFont = `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif`;

  return (
    <div
      className="min-h-screen antialiased relative overflow-hidden"
      style={{ background: "#f5f5f7", fontFamily: appleFont } as React.CSSProperties}
    >
      {/* ===== GLASSMORPHISM BACKGROUND ORBS — fixed behind content ===== */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true" style={{ zIndex: 0 }}>
        <div className="absolute -top-28 -left-24 h-[560px] w-[560px] rounded-full bg-blue-200 opacity-20 blur-3xl orb-drift orb-drift-1" />
        <div className="absolute -top-16 right-0 h-[620px] w-[620px] rounded-full bg-purple-200 opacity-15 blur-3xl orb-drift orb-drift-2" />
        <div className="absolute top-[38%] left-1/2 h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-sky-100 opacity-20 blur-3xl orb-drift orb-drift-3" />
      </div>

      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-10 relative" style={{ zIndex: 1 }}>
        {/* ===== HEADER — centered, minimal ===== */}
        <header className="text-center py-14 mb-2">
          <h1
            className="text-[32px] font-semibold tracking-tight text-zinc-900"
            style={{ fontFamily: appleFont, letterSpacing: "-0.02em" }}
          >
            ThoughtMirror
          </h1>
          <p
            className="text-[15px] leading-relaxed mt-3 text-zinc-500 max-w-md mx-auto"
            style={{ fontFamily: appleFont }}
          >
            Don&apos;t ask AI for the answer. Ask AI where your thinking breaks.
          </p>
        </header>

        {/* ===== ERROR BANNER ===== */}
        {scanError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            role="alert"
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
          >
            {scanError}
          </motion.div>
        )}

        {/* ===== INPUT CARD — STEP 1 EMPTY / STEP 2 SCANNING / STEP 5 PENDING ===== */}
        <motion.div
          className={`bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-2xl p-8 mb-8 ${isScanning && "border-breathing"}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" as const }}
        >
          {/* Pending edits banner — Step 5 */}
          <AnimatePresence>
            {hasPendingEdits && !isScanning && hasScanned && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" as const }}
                className="mb-6 rounded-xl bg-[#0071e3]/[0.08] border border-[#0071e3]/15 px-4 py-3 text-sm leading-relaxed text-[#0071e3]"
                style={{ fontFamily: appleFont }}
              >
                You&apos;ve updated your explanation. Ready to see if it improved?
              </motion.div>
            )}
          </AnimatePresence>

          {/* Textarea with scanning overlay */}
          <div className="relative overflow-hidden rounded-xl">
            <textarea
              placeholder="Explain a concept in your own words..."
              value={currentText}
              onChange={(e) => {
                setCurrentText(e.target.value);
                if (hasScanned && e.target.value !== latestScanResult?.segments.map((s) => s.text).join("")) {
                  setHasPendingEdits(true);
                }
              }}
              readOnly={isScanning}
              className="w-full min-h-[200px] resize-none rounded-xl border border-zinc-200 bg-white p-4 text-[15px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/15 shadow-sm transition-colors disabled:opacity-60"
              style={{ fontFamily: appleFont }}
            />
            {isScanning && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl" aria-hidden="true">
                <motion.div
                  className="absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-[rgba(0,113,227,0.08)] to-transparent blur-2xl"
                  initial={{ top: "0%" }}
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" as const }}
                />
              </div>
            )}
          </div>

          {/* Subtle row: Try example + Advanced */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={handleMagicSample}
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
              style={{ fontFamily: appleFont }}
            >
              Try an example →
            </button>

            <details className="group">
              <summary
                className="text-sm text-zinc-400 hover:text-zinc-600 cursor-pointer select-none list-none flex items-center gap-1.5 transition-colors"
                style={{ fontFamily: appleFont }}
              >
                <span className="transition-transform group-open:rotate-90 inline-block text-[10px]">▶</span>
                ⚙ Advanced
              </summary>
              <div className="mt-3">
                <p className="text-xs leading-relaxed text-zinc-500 mb-2 max-w-md">
                  Paste lecture notes or reference material you&apos;d like the analysis to be grounded against.
                </p>
                <textarea
                  value={sourceMaterial}
                  onChange={(e) => setSourceMaterial(e.target.value)}
                  placeholder="Reference material (optional)..."
                  className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/15 min-h-[80px] resize-none"
                  style={{ fontFamily: appleFont }}
                />
              </div>
            </details>
          </div>

          {/* Button area — step dependent */}
          <div className="mt-6">
            {isScanning ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <span className="text-sm text-zinc-600 tracking-wide">
                  {scanPhrases[scanPhraseIndex]}
                </span>
              </div>
            ) : hasPendingEdits && hasScanned ? (
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" as const }}
                onClick={handleScan}
                disabled={!currentText.trim() || isScanning}
                className="w-full inline-flex items-center justify-center rounded-[12px] bg-[#0071e3] px-6 py-3.5 text-[15px] font-medium text-white hover:bg-[#0077ED] active:bg-[#0068D1] disabled:opacity-40 disabled:pointer-events-none transition-colors"
                style={{
                  fontFamily: appleFont,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(0,113,227,0.3)",
                }}
              >
                Scan Again →
              </motion.button>
            ) : !hasScanned ? (
              <button
                onClick={handleScan}
                disabled={!currentText.trim() || isScanning}
                className="w-full inline-flex items-center justify-center rounded-[12px] bg-[#0071e3] px-6 py-3.5 text-[15px] font-medium text-white hover:bg-[#0077ED] active:bg-[#0068D1] disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 ease-out"
                style={{
                  fontFamily: appleFont,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(0,113,227,0.3)",
                }}
              >
                Analyze My Thinking →
              </button>
            ) : null}
          </div>
        </motion.div>

        {/* ===== RESULTS — only after first scan ===== */}
        <AnimatePresence mode="wait">
          {hasScanned && latestScanResult && !isScanning && (
            <motion.div
              key={`results-${scanCount}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: "easeOut" as const }}
              className="space-y-6"
            >
              {/* Score Rings — glass surface */}
              <div className="bg-white/50 backdrop-blur-lg border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-2xl p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="flex flex-wrap justify-center gap-10 sm:gap-12"
                >
                  {renderRings()}
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="text-center text-sm text-zinc-600 mt-8"
                  style={{ fontFamily: appleFont }}
                >
                  Here&apos;s what we found:
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.25 }}
                  className="text-center mt-3"
                >
                  <span className="text-sm text-zinc-500" style={{ fontFamily: appleFont }}>
                    {computeIssueStats() || "No issues detected — strong reasoning!"}
                  </span>
                </motion.div>
              </div>

              {/* Analysis Card */}
              <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-2xl p-8">
                <h2 className="text-base font-semibold tracking-tight text-zinc-900 mb-5" style={{ fontFamily: appleFont, letterSpacing: "-0.01em" }}>
                  Analysis
                </h2>

                <AnalysisDisplay
                  key={scanCount}
                  result={latestScanResult}
                  onSocraticResponse={handleSocraticResponse}
                  scanCount={scanCount}
                  />

                {latestScanResult.segments.some((s) => s.type !== "normal") && (
                  <p className="text-xs text-zinc-400 mt-6" style={{ fontFamily: appleFont }}>
                    Click a highlighted phrase to improve it
                  </p>
                )}

                {/* Detailed breakdown — subtle disclosure */}
                {latestScanResult.segments.filter((s) => s.type !== "normal").length > 0 && (
                  <details className="group mt-6">
                    <summary className="text-sm text-zinc-400 hover:text-zinc-700 cursor-pointer select-none list-none flex items-center gap-2 transition-colors" style={{ fontFamily: appleFont }}>
                      <span className="transition-transform group-open:rotate-90 inline-block text-[10px]">▶</span>
                      View detailed breakdown
                    </summary>
                    <div className="mt-4 space-y-2 max-h-80 overflow-y-auto pr-1">
                      {latestScanResult.segments
                        .filter((seg) => seg.type !== "normal")
                        .map((seg, i) => {
                          const truncatedText = seg.text.length > 80 ? seg.text.substring(0, 80) + "..." : seg.text;
                          const typeLabel =
                            seg.type === "reasoning_error"
                              ? "Reasoning Error"
                              : seg.type === "knowledge_gap"
                              ? "Knowledge Gap"
                              : seg.type === "unsupported_claim"
                              ? "Unsupported Claim"
                              : "Strong Reasoning";
                          return (
                            <div key={i} className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/60 hover:bg-zinc-50 transition-colors">
                              <p className="text-zinc-700 text-sm leading-relaxed truncate" style={{ fontFamily: appleFont }}>
                                {truncatedText}
                              </p>
                              <p className="text-zinc-500 text-xs mt-1" style={{ fontFamily: appleFont }}>
                                {typeLabel}
                                {seg.grounded ? " · Grounded" : ""}
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  </details>
                )}

                {/* Concept Map — behind text link only */}
                {latestScanResult.concepts && latestScanResult.concepts.length > 0 && (
                  <details className="group mt-6">
                    <summary className="text-sm text-zinc-400 hover:text-zinc-700 cursor-pointer select-none list-none flex items-center gap-2 transition-colors" style={{ fontFamily: appleFont }}>
                      <span className="transition-transform group-open:rotate-90 inline-block text-[10px]">▶</span>
                      View concept map →
                    </summary>
                    <div className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
                      <ConceptMap concepts={latestScanResult.concepts} onConceptClick={() => {}} />
                    </div>
                  </details>
                )}
              </div>

              {/* Learning Delta — after rescan */}
              {shouldShowLearningDelta && latestScanResult && firstScanResult && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" as const }}
                  className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-2xl p-8"
                >
                  <h3 className="text-base font-semibold tracking-tight text-zinc-900 mb-6" style={{ fontFamily: appleFont }}>
                    Learning Delta
                  </h3>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-xs tracking-wide uppercase text-zinc-500 mb-1" style={{ fontFamily: appleFont }}>
                        Rigor
                      </p>
                      <p className="font-semibold text-xl tracking-tight text-zinc-900" style={{ fontFamily: appleFont }}>
                        {firstScanResult.scores.rigor} → {latestScanResult.scores.rigor ?? 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs tracking-wide uppercase text-zinc-500 mb-1" style={{ fontFamily: appleFont }}>
                        Clarity
                      </p>
                      <p className="font-semibold text-xl tracking-tight text-zinc-900" style={{ fontFamily: appleFont }}>
                        {firstScanResult.scores.clarity} → {latestScanResult.scores.clarity ?? 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs tracking-wide uppercase text-zinc-500 mb-1" style={{ fontFamily: appleFont }}>
                        Evidence
                      </p>
                      <p className="font-semibold text-xl tracking-tight text-zinc-900" style={{ fontFamily: appleFont }}>
                        {firstScanResult.scores.evidence} → {latestScanResult.scores.evidence ?? 0}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-center">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700" style={{ fontFamily: appleFont }}>
                      Issues resolved: {resolveIssuesCount()}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Transfer question */}
              {latestScanResult.transferQuestion && (
                <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-2xl p-8">
                  <h3 className="text-base font-semibold tracking-tight text-zinc-900 mb-3" style={{ fontFamily: appleFont }}>
                    One more thing — prove it
                  </h3>
                  <p className="text-zinc-600 text-sm leading-relaxed mb-2" style={{ fontFamily: appleFont }}>
                    {latestScanResult.transferQuestion.question}
                  </p>
                  <p className="text-zinc-500 text-xs leading-relaxed mb-6" style={{ fontFamily: appleFont }}>
                    {latestScanResult.transferQuestion.context}
                  </p>
                  <div className="rounded-xl border border-zinc-200 p-4 bg-white">
                    <textarea
                      placeholder="Your answer here..."
                      value={transferAnswer}
                      onChange={(e) => setTransferAnswer(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/15 min-h-[100px] resize-none"
                      style={{ fontFamily: appleFont }}
                    />
                    <div className="flex gap-3 mt-4">
                      <button
                        
                        className="flex-1 rounded-[12px] border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                        style={{ fontFamily: appleFont }}
                      >
                        Close
                      </button>
                      <button
                        onClick={handleTransferCheck}
                        className="flex-1 rounded-[12px] bg-[#0071e3] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0077ED] transition-colors"
                        style={{
                          fontFamily: appleFont,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(0,113,227,0.3)",
                        }}
                      >
                        Check
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const SEGMENT_UNDERLINE_CLASS: Record<string, string> = {
  reasoning_error: "decoration-red-500",
  knowledge_gap: "decoration-amber-500",
  unsupported_claim: "decoration-orange-500",
  strong: "decoration-emerald-500",
};

function getSegmentUnderlineClass(type: string): string {
  return SEGMENT_UNDERLINE_CLASS[type] || "decoration-zinc-300";
}

type AnalysisDisplayProps = {
  result: {
    scores: { rigor: number; clarity: number; evidence: number };
    segments: Array<{
      text: string;
      type: "normal" | "reasoning_error" | "knowledge_gap" | "unsupported_claim" | "strong";
      label?: string;
      socratic_question?: string;
      grounded?: boolean;
    }>;
  };
  onSocraticResponse: (index: number, newText: string) => void;
  scanCount: number;
};

function AnalysisDisplay({ result, onSocraticResponse }: AnalysisDisplayProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="leading-relaxed text-zinc-900">
      <div className="flex flex-wrap gap-x-1 gap-y-1 text-[15px] leading-7">
        {result.segments.map((seg, i) => {
          const isNormal = seg.type === "normal";
          const underlineClass = isNormal
            ? ""
            : `underline decoration-2 underline-offset-4 ${getSegmentUnderlineClass(seg.type)}`;
          const onClick = isNormal ? undefined : () => setOpenIndex(i);

          return (
            <span
              key={i}
              className={`${underlineClass} ${isNormal ? "" : "cursor-pointer hover:opacity-80 transition-opacity"} rounded-sm`}
              onClick={onClick}
              role={isNormal ? undefined : "button"}
              style={{ fontFamily: `-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif` }}
            >
              {seg.text}
            </span>
          );
        })}
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <SocraticModal
            seg={result.segments[openIndex]}
            index={openIndex}
            onApply={onSocraticResponse}
            onClose={() => setOpenIndex(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SocraticModal({
  seg,
  index,
  onApply,
  onClose,
}: {
  seg: {
    text: string;
    type: "normal" | "reasoning_error" | "knowledge_gap" | "unsupported_claim" | "strong";
    label?: string;
    socratic_question?: string;
  };
  index: number;
  onApply: (index: number, newText: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(seg.text);

  useEffect(() => {
    setDraft(seg.text);
  }, [seg.text]);

  const appleFont = `-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" as const }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-2xl p-8 max-w-2xl w-full text-left"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.25, ease: "easeOut" as const }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold tracking-tight text-zinc-900 mb-4 text-xl" style={{ fontFamily: appleFont, letterSpacing: "-0.015em" }}>
          Think Deeper
        </h3>

        <p className="text-zinc-700 leading-relaxed text-lg mb-6" style={{ fontFamily: appleFont }}>
          {seg.socratic_question || "Consider this question..."}
        </p>

        <textarea
          className="w-full rounded-xl border border-zinc-200 bg-white p-4 focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/15 text-zinc-900 placeholder:text-zinc-400 min-h-[120px] resize-none leading-relaxed text-[15px] shadow-sm transition-all"
          placeholder="Rewrite this part in your own words..."
          value={draft}
          onChange={(e) => {
            console.log(`[SocraticModal] textarea onChange draft=${JSON.stringify(e.target.value)}`);
            setDraft(e.target.value);
          }}
          style={{ fontFamily: appleFont }}
        />

        <button
          className="mt-6 w-full inline-flex items-center justify-center rounded-[12px] bg-[#0071e3] px-6 py-3.5 text-[15px] font-medium text-white hover:bg-[#0077ED] active:bg-[#0068D1] transition-colors"
          style={{
            fontFamily: appleFont,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(0,113,227,0.3)",
          }}
          onClick={() => {
            console.log('[Apply clicked] index:', index, 'text:', draft);
            console.log(`[SocraticModal] Apply clicked: index=${index}, newText=${JSON.stringify(draft)}`);
            onApply(index, draft);
            onClose();
          }}
        >
          Apply My Answer →
        </button>
        <button
          className="mt-3 w-full text-center text-sm text-zinc-500 hover:text-zinc-700 transition-colors py-2"
          style={{ fontFamily: appleFont }}
          onClick={onClose}
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}
