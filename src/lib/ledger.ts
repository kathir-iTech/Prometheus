// src/lib/ledger.ts
// Single JSON blob in localStorage. Resets on Incognito/cache-clear —
// documented, accepted limitation, not something to fix with a database.

import type { TrackId, RubricScore } from '@/types/argument';

const LEDGER_KEY = 'vivamind_ledger_v1';

export interface LedgerEntry {
  trackId: TrackId;
  timestamp: number;
  firstPassScore: RubricScore;
  revisedScore: RubricScore;
  prediction: number;
}

export function readLedger(): LedgerEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LEDGER_KEY);
    return raw ? (JSON.parse(raw) as LedgerEntry[]) : [];
  } catch {
    return []; // corrupted/tampered data — fail safe, never throw
  }
}

export function appendLedgerEntry(entry: LedgerEntry): void {
  if (typeof window === 'undefined') return;
  const current = readLedger();
  current.push(entry);
  try {
    window.localStorage.setItem(LEDGER_KEY, JSON.stringify(current));
  } catch {
    // storage full/unavailable — skip silently, never break the app
  }
}
