// src/lib/curriculum.ts

import type { TrackId } from '@/types/argument';

export interface FactBlock {
  id: string;
  statement: string;
  keywords: string[];
  citation: string;
}

export interface TrackConfig {
  id: TrackId;
  title: string;
  rubricCriteria: string[];
  fact: FactBlock;
}

export const CURRICULUM_REGISTRY: Record<TrackId, TrackConfig> = {
  scientific_reasoning: {
    id: 'scientific_reasoning',
    title: 'Scientific Reasoning: Climate Dynamics',
    rubricCriteria: ['Empirical Validation', 'Causal Logic', 'Premise Isolation'],
    fact: {
      id: 'FACT_SR_01',
      statement:
        'Tropospheric warming paired with stratospheric cooling is a fingerprint of greenhouse-gas forcing, not natural climate variability.',
      keywords: ['troposphere', 'stratosphere', 'greenhouse', 'cooling', 'warming', 'fingerprint', 'forcing'],
      citation:
        'Santer, B. D., et al. (2023). "Exceptional stratospheric contribution to human fingerprints on atmospheric temperature." PNAS, 120(22).',
    },
  },
  historical_analysis: {
    id: 'historical_analysis',
    title: 'Historical Analysis: Industrial Revolution Causes',
    rubricCriteria: ['Source Evaluation', 'Socioeconomic Context', 'Chronological Continuity'],
    fact: {
      id: 'FACT_HA_01',
      statement:
        "Britain industrialized first largely because it combined high wages with uniquely cheap, abundant coal, making labor-saving machinery profitable there before anywhere else.",
      keywords: ['coal', 'britain', 'wages', 'energy', 'labor-saving', 'machinery', 'cheap'],
      citation:
        'Allen, Robert C. (2009). The British Industrial Revolution in Global Perspective. Cambridge University Press.',
    },
  },
  policy_evaluation: {
    id: 'policy_evaluation',
    title: 'Policy Evaluation: Universal Basic Income Trials',
    rubricCriteria: ['Fiscal Sustainability', 'Labor Market Impact', 'Empirical Baseline Consistency'],
    fact: {
      id: 'FACT_PE_01',
      statement:
        "Finland's national basic-income trial produced negligible employment effects but measurably better psychological wellbeing and financial security.",
      keywords: ['finland', 'basic income', 'employment', 'wellbeing', 'negligible', 'kela'],
      citation:
        'Kangas, O., Jauhiainen, S., Simanainen, M., & Ylikännö, M. (eds.) (2020). "Suomen perustulokokeilun arviointi" [Evaluation of the Finnish Basic Income Experiment]. Reports and Memorandums of the Finnish Ministry of Social Affairs and Health 2020:15. Administered by Kela.',
    },
  },
};

export function getTrackOrThrow(id: string): TrackConfig {
  const track = CURRICULUM_REGISTRY[id as TrackId];
  if (!track) {
    throw new Error(`Invalid track id: ${id}`);
  }
  return track;
}
