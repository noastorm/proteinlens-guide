/**
 * disease-map.js — Curated disease → UniProt ID lookup table.
 *
 * This module is a fast-path shortcut so common disease-name queries
 * resolve instantly without a network call.
 *
 * Phase 4 note: Once proteins.json is generated (Phase 3), search.js
 * will take over as the primary lookup. This map becomes an optional
 * first-pass cache for known high-traffic queries.
 *
 * Format:
 *   DISEASE_MAP[normalisedKey] = 'UNIPROTID'
 *
 * Keys should be lowercase, stripped of punctuation, trimmed.
 * Aliases object allows multiple spellings to map to the same key.
 */

export const DISEASE_MAP = {
  // Cancer / tumour suppressors
  'tp53': 'P04637',
  'p53': 'P04637',
  'li-fraumeni syndrome': 'P04637',
  'egfr': 'P00533',
  'lung cancer': 'P00533',
  'kras': 'P01116',
  'pancreatic cancer': 'P01116',
  'brca1': 'P38398',
  'breast cancer': 'P38398',
  'brca2': 'P51587',

  // Metabolic / diabetes
  'gck': 'P35557',
  'glucokinase': 'P35557',
  'mody2': 'P35557',
  'insulin': 'P01308',
  'type 1 diabetes': 'P01308',

  // Neurological
  'app': 'P05067',
  'alzheimer': 'P05067',
  'alzheimers disease': 'P05067',
  'snca': 'P37840',
  'parkinsons disease': 'P37840',
  "parkinson's disease": 'P37840',
  'htt': 'P42858',
  'huntingtin': 'P42858',
  'huntingtons disease': 'P42858',

  // Cardiovascular
  'cftr': 'P13569',
  'cystic fibrosis': 'P13569',
  'mfn2': 'O95140',
  'charcot-marie-tooth': 'O95140',

  // Infectious disease
  'sars-cov-2 3clpro': 'P0DTD1',
  '3clpro': 'P0DTD1',
  'mpro': 'P0DTD1',
  'covid protease': 'P0DTD1',
};

/** Normalise a query string to match DISEASE_MAP keys */
export function normaliseQuery(query) {
  return query
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Look up a UniProt ID from a disease / gene query.
 * Returns null if nothing is found in the curated map.
 * @param {string} query
 * @returns {string|null}
 */
export function lookupDisease(query) {
  const key = normaliseQuery(query);
  return DISEASE_MAP[key] ?? null;
}
