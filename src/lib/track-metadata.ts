// src/lib/track-metadata.ts
// Client-safe subset of the curriculum registry. NEVER import curriculum.ts
// from a 'use client' file — it contains the withheld fact and citation,
// and importing it here would leak that into the browser bundle.

import type { TrackId } from '@/types/argument';

export interface TrackMetadata {
  id: TrackId;
  title: string;
  rubricCriteria: string[];
  ungraded?: boolean;
}

export const TRACK_METADATA: TrackMetadata[] = [
  {
    id: 'scientific_reasoning',
    title: 'Scientific Reasoning: Climate Dynamics',
    rubricCriteria: ['Empirical Validation', 'Causal Logic', 'Premise Isolation'],
  },
  {
    id: 'historical_analysis',
    title: 'Historical Analysis: Industrial Revolution Causes',
    rubricCriteria: ['Source Evaluation', 'Socioeconomic Context', 'Chronological Continuity'],
  },
  {
    id: 'policy_evaluation',
    title: 'Policy Evaluation: Universal Basic Income Trials',
    rubricCriteria: ['Fiscal Sustainability', 'Labor Market Impact', 'Empirical Baseline Consistency'],
  },
  {
    id: 'sandbox',
    title: 'Sandbox — Open Topic',
    rubricCriteria: ['Ungraded', 'No fixed source', "AI's own assessment only"],
    ungraded: true,
  },
];
