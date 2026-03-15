/**
 * main.js
 * App entry point — wires search UI to API calls and wizard rendering.
 */

import './style.css';
import { resolveGeneToUniprotId, fetchUniprotEntry, fetchAlphaFoldEntry } from './api.js';
import { renderResults, resetResultState } from './wizard.js';

let searchType = 'uniprot';

// ─── UI helpers ───────────────────────────────────────────────────────────────

function setType(t) {
  searchType = t;
  document.getElementById('typeUniprot').classList.toggle('active', t === 'uniprot');
  document.getElementById('typeGene').classList.toggle('active', t === 'gene');
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
  document.getElementById('searchBtn').disabled = true;

  try {
    let uniprotId = raw;

    if (searchType === 'gene') {
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

function quickSearch(id, type) {
  setType(type);
  document.getElementById('searchInput').value = id;
  runSearch();
}

// ─── Event listeners ──────────────────────────────────────────────────────────

document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') runSearch();
});

// Expose to HTML onclick attributes
window.runSearch   = runSearch;
window.quickSearch = quickSearch;
window.setType     = setType;
