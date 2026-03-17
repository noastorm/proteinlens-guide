/**
 * main.js
 * App entry point — wires search UI to API calls and wizard rendering.
 * Phase 4: integrates proteins.json search via search.js
 */

import './style.css';
import { resolveGeneToUniprotId, fetchUniprotEntry, fetchAlphaFoldEntry } from './api.js';
import { renderResults, resetResultState } from './wizard.js';
import { loadProteins, searchDisease } from './search.js';

let searchType = 'uniprot';

// Pre-load proteins.json in the background as soon as the page opens
loadProteins().catch(() => {
  console.warn('proteins.json not available — disease search will fall back to UniProt gene search.');
});

// ─── UI helpers ───────────────────────────────────────────────────────────────

function setType(t) {
  searchType = t;
  document.getElementById('typeUniprot').classList.toggle('active', t === 'uniprot');
  document.getElementById('typeGene').classList.toggle('active', t === 'gene');
  document.getElementById('typeDisease').classList.toggle('active', t === 'disease');
}

function setStatus(msg) {
  document.getElementById('statusText').textContent = msg;
  document.getElementById('statusBar').classList.add('visible');
}

function hideStatus() {
  document.getElementById('statusBar').classList.remove('visible');
}

function showError(msg) {
  hideStatus();
  const eb = document.getElementById('errorBox');
  eb.textContent = msg;
  eb.classList.add('visible');
}

function hideError() {
  document.getElementById('errorBox').classList.remove('visible');
}

// ─── Search ───────────────────────────────────────────────────────────────────

async function runSearch() {
  const raw = document.getElementById('searchInput').value.trim();
  if (!raw) return;

  hideError();
  resetResultState();
  document.getElementById('summaryCard')?.remove();
  document.getElementById('searchBtn').disabled = true;

  try {
    let uniprotId = raw;

    if (searchType === 'disease') {
      setStatus(`Searching for "${raw}"...`);
      const match = await searchDisease(raw);

      if (!match) {
        throw new Error(`No protein found matching "${raw}". Try a disease name, gene name, or symptom.`);
      }

      uniprotId = match.uniprotId;
      showSummaryCard(match.entry);

    } else if (searchType === 'gene') {
      setStatus(`Resolving gene "${raw}" → UniProt...`);
      uniprotId = await resolveGeneToUniprotId(raw);
    }

    setStatus(`Fetching UniProt entry for ${uniprotId}...`);
    const upData = await fetchUniprotEntry(uniprotId);

    setStatus('Querying AlphaFold Database...');
    const afData = await fetchAlphaFoldEntry(uniprotId);

    hideStatus();
    await renderResults(uniprotId, upData, afData, { setStatus, hideStatus });

  } catch (err) {
    showError(`Error: ${err.message}`);
  }

  document.getElementById('searchBtn').disabled = false;
}

function showSummaryCard(entry) {
  document.getElementById('summaryCard')?.remove();

  const card = document.createElement('div');
  card.id = 'summaryCard';
  card.style.cssText = `
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 24px;
    animation: fadeIn 0.3s ease;
  `;

  card.innerHTML = `
    <div style="font-family:'Syne',sans-serif;font-size:0.65rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin-bottom:8px">
      Plain-English Summary
    </div>
    <div style="font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:700;color:var(--text-bright);margin-bottom:10px">
      ${escapeHtml(entry.name || entry.gene || 'Protein')}
      ${entry.gene ? `<span style="color:var(--accent);font-size:0.85rem;font-weight:400;margin-left:8px">${escapeHtml(entry.gene)}</span>` : ''}
    </div>
    <p style="font-size:0.85rem;color:var(--text);line-height:1.75;margin-bottom:10px">${escapeHtml(entry.plain_summary || '')}</p>
    ${entry.disease_connection ? `
      <p style="font-size:0.8rem;color:#ff99bb;line-height:1.7;margin-bottom:8px">
        <span style="color:var(--danger);font-weight:700">Disease link:</span> ${escapeHtml(entry.disease_connection)}
      </p>` : ''}
    ${entry.drug_discovery_note ? `
      <p style="font-size:0.75rem;color:var(--text-dim);line-height:1.7">
        <span style="color:var(--accent2);font-weight:700">Drug research:</span> ${escapeHtml(entry.drug_discovery_note)}
      </p>` : ''}
  `;

  const results = document.getElementById('results');
  results.parentNode.insertBefore(card, results);
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function quickSearch(id, type) {
  setType(type);
  document.getElementById('searchInput').value = id;
  runSearch();
}

document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') runSearch();
});

window.runSearch   = runSearch;
window.quickSearch = quickSearch;
window.setType     = setType;
