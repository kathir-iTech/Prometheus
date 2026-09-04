# VivaMind

> Don't just explain it. Defend it.

VivaMind is a Socratic argumentation engine. Submit an argument, get challenged
with a targeted question, defend it yourself, predict your own score, then see
the verdict — with the real source revealed for the first time.

VivaMind never fixes your argument or states the missing evidence. It finds the
weakest link and makes you close the gap yourself.

Core loop: **Claim → Challenge → Defend → Predict → Verdict**

## Tracks

- Scientific Reasoning: Climate Dynamics — sourced to Santer et al. (2023), PNAS.
- Historical Analysis: Industrial Revolution Causes — sourced to Robert Allen (2009).
- Policy Evaluation: Universal Basic Income Trials — sourced to Finland's Kela pilot (Kangas et al., 2020).
- Sandbox — Open Topic — ungrounded, explicitly labeled as the AI's own assessment.

## How it works

- `src/lib/curriculum.ts` holds a server-side-only fact registry, keyed by track ID.
  The client only ever sends a `trackId` string — it never receives or supplies
  the withheld fact directly.
- `src/app/api/analyze/route.ts` calls Gemini with a strict JSON `responseSchema`,
  classifying the argument into segments (unsupported claim / reasoning error /
  knowledge gap / premise conflict / normal) and generating one Socratic question.
  A leak guard checks the *model's own question* — not the student's text —
  against the withheld fact's keywords, so the system can't accidentally reveal
  the answer while asking about it.
- `src/app/api/verdict/route.ts` scores the revised argument on Rigor / Evidence /
  Clarity, temperature-pinned for consistency, and reveals the real source
  citation from the registry — never model-generated.
- Model fallback chain: `gemini-3.6-flash` → `gemini-3.5-flash` →
  `gemini-3.1-flash-lite`, configurable via `GEMINI_MODEL_FALLBACK_CHAIN`.
- Progress is stored locally per track (`localStorage`) — nothing about a
  student's arguments leaves their device.

## Known limitations (documented, not hidden)

- The leak guard is keyword-level, not semantic — it stops verbatim leaks, not
  a model paraphrasing the withheld fact.
- No backend database — progress resets in Incognito or on cache clear.
  Deliberate: makes the "nothing leaves the device" claim literally true.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

Requires `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) in `.env.local`.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · framer-motion ·
`@google/generative-ai`.
