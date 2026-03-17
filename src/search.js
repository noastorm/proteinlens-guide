/**
 * search.js
 * Loads public/proteins.json on startup and exposes searchDisease(query).
 * Checks the curated disease-map first, then falls back to full-text search.
 */

import { lookupDisease } from './disease-map.js';

let proteinsData = null;
let loadingPromise = null;

export async function loadProteins() {
  if (proteinsData) return proteinsData;
  if (loadingPromise) return loadingPromise;

  loadingPromise = fetch('/proteins.json')
    .then(res => {
      if (!res.ok) throw new Error('Could not load proteins.json');
      return res.json();
    })
    .then(data => {
      proteinsData = data;
      loadingPromise = null;
      console.log(`proteins.json loaded — ${Object.keys(data).length} entries`);
      return data;
    });

  return loadingPromise;
}

export async function searchDisease(rawQuery) {
  const data = await loadProteins();

  // 1. Check curated map first
  const curatedId = lookupDisease(rawQuery);
  if (curatedId && data[curatedId]) {
    return { uniprotId: curatedId, entry: data[curatedId] };
  }

  // 2. Fall back to full-text search
  const query = rawQuery.toLowerCase().trim();
  if (!query) return null;

  let bestId    = null;
  let bestScore = 0;
  let bestEntry = null;

  for (const [id, entry] of Object.entries(data)) {
    let score = 0;
    const terms = (entry.search_terms || []).map(t => t.toLowerCase());
    const gene  = (entry.gene || '').toLowerCase();
    const name  = (entry.name || '').toLowerCase();

    if (gene === query)              score += 5;
    else if (gene.startsWith(query)) score += 3;
    if (name.includes(query))        score += 2;

    for (const term of terms) {
      if (term === query)              score += 3;
      else if (term.startsWith(query)) score += 2;
      else if (term.includes(query))   score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestId    = id;
      bestEntry = entry;
    }
  }

  if (!bestEntry || bestScore === 0) return null;
  return { uniprotId: bestId, entry: bestEntry };
}

export async function searchDiseaseTop(rawQuery, n = 3) {
  const data  = await loadProteins();
  const query = rawQuery.toLowerCase().trim();
  if (!query) return [];

  const scored = [];

  for (const [id, entry] of Object.entries(data)) {
    let score = 0;
    const terms = (entry.search_terms || []).map(t => t.toLowerCase());
    const gene  = (entry.gene || '').toLowerCase();
    const name  = (entry.name || '').toLowerCase();

    if (gene === query)              score += 5;
    else if (gene.startsWith(query)) score += 3;
    if (name.includes(query))        score += 2;

    for (const term of terms) {
      if (term === query)              score += 3;
      else if (term.startsWith(query)) score += 2;
      else if (term.includes(query))   score += 1;
    }

    if (score > 0) scored.push({ uniprotId: id, entry, score });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, n);
}
