/**
 * wizard.js
 * Handles rendering all result panels once protein data is loaded.
 */

import { fetchPLDDTFromCif } from './api.js';

export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function renderResults(uniprotId, up, af, { setStatus, hideStatus }) {
  document.getElementById('results').classList.add('visible');

  const name =
    up.proteinDescription?.recommendedName?.fullName?.value ||
    up.proteinDescription?.submissionNames?.[0]?.fullName?.value ||
    'Unknown Protein';

  const gene      = up.genes?.[0]?.geneName?.value || '—';
  const organism  = up.organism?.scientificName || '—';
  const seq       = up.sequence?.value || '';
  const seqLen    = up.sequence?.length || 0;

  document.getElementById('resName').textContent = name;
  document.getElementById('resGene').innerHTML   =
    `Gene: ${escapeHtml(gene)}  ·  UniProt: ${escapeHtml(uniprotId)}<button class="copy-btn" id="copyIdBtn" title="Copy UniProt ID to clipboard">⎘ Copy ID</button>`;
  document.getElementById('copyIdBtn').addEventListener('click', () => {
    const btn = document.getElementById('copyIdBtn');
    navigator.clipboard.writeText(uniprotId).catch(() => {});
    btn.textContent = '✓ Copied';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '⎘ Copy ID'; btn.classList.remove('copied'); }, 2000);
  });
  document.getElementById('resOrganism').textContent = organism;
  document.getElementById('seqLen').textContent      = `${seqLen} aa`;
  document.getElementById('seqStrip').innerHTML      = renderSequence(seq, up.features || []);

  document.getElementById('extLinks').innerHTML = `
    <a class="ext-link" href="https://www.uniprot.org/uniprotkb/${encodeURIComponent(uniprotId)}" target="_blank">↗ UniProt</a>
    <a class="ext-link" href="https://alphafold.ebi.ac.uk/entry/${encodeURIComponent(uniprotId)}" target="_blank">↗ AlphaFold DB</a>
    <a class="ext-link" href="https://www.rcsb.org/search?request=%7B%22query%22%3A%7B%22type%22%3A%22terminal%22%2C%22service%22%3A%22text%22%2C%22parameters%22%3A%7B%22value%22%3A%22${encodeURIComponent(gene)}%22%7D%7D%7D" target="_blank">↗ RCSB PDB</a>
    <a class="ext-link" href="https://www.ncbi.nlm.nih.gov/clinvar/?term=${encodeURIComponent(gene)}[gene]" target="_blank">↗ ClinVar</a>
  `;

  const afEntry = Array.isArray(af) && af[0] ? af[0] : null;
  const cifUrl  = afEntry?.cifUrl || `https://alphafold.ebi.ac.uk/files/AF-${uniprotId}-F1-model_v4.cif`;

  document.getElementById('afLink').href      = `https://alphafold.ebi.ac.uk/entry/${encodeURIComponent(uniprotId)}`;
  document.getElementById('molstarLink').href = `https://molstar.org/viewer/?afdb=${encodeURIComponent(uniprotId)}`;
  setEmbeddedViewer(uniprotId, !!afEntry);

  let plddtInfo = null;
  if (afEntry) {
    setStatus('Parsing per-residue pLDDT from AlphaFold mmCIF...');
    plddtInfo = await fetchPLDDTFromCif(cifUrl, afEntry);
    hideStatus();
  }
  renderPLDDT(plddtInfo);

  // Disease alert
  const diseases = up.comments?.filter(c => c.commentType === 'DISEASE') || [];
  if (diseases.length > 0) {
    document.getElementById('diseaseAlert').classList.add('visible');
    document.getElementById('diseaseList').innerHTML = diseases.map(d => {
      const label = d.disease?.diseaseId || d.disease?.description || d.note?.texts?.[0]?.value || 'Disease association';
      const labelStr = String(label);
      return `<span class="disease-chip" title="${escapeHtml(labelStr)}">${escapeHtml(labelStr.slice(0, 75))}${labelStr.length > 75 ? '…' : ''}</span>`;
    }).join('');
  }

  const variantFeatures = (up.features || []).filter(f => f.type === 'Natural variant' && f.description);
  renderBindingSites(up.features || [], seq);
  renderVariants(variantFeatures);

  // GO terms
  const go    = up.uniProtKBCrossReferences?.filter(r => r.database === 'GO') || [];
  const funcs = go
    .filter(g => g.properties?.find(p => p.key === 'GoTerm' && p.value?.startsWith('F:')))
    .map(g => g.properties.find(p => p.key === 'GoTerm')?.value?.replace('F:', '').trim())
    .filter(Boolean).slice(0, 8);
  const procs = go
    .filter(g => g.properties?.find(p => p.key === 'GoTerm' && p.value?.startsWith('P:')))
    .map(g => g.properties.find(p => p.key === 'GoTerm')?.value?.replace('P:', '').trim())
    .filter(Boolean).slice(0, 8);

  document.getElementById('funcTags').innerHTML = funcs.length
    ? funcs.map(f => `<span class="func-tag">${escapeHtml(f)}</span>`).join('')
    : '<span style="color:var(--text-dim);font-size:0.8rem">No GO molecular function annotations</span>';

  document.getElementById('procTags').innerHTML = procs.length
    ? procs.map(p => `<span class="func-tag">${escapeHtml(p)}</span>`).join('')
    : '<span style="color:var(--text-dim);font-size:0.8rem">No GO biological process annotations</span>';

  const fnNote = up.comments?.find(c => c.commentType === 'FUNCTION');
  const fnText = fnNote?.texts?.[0]?.value || '';
  document.getElementById('funcNote').textContent = fnText
    ? fnText.slice(0, 280) + (fnText.length > 280 ? '…' : '')
    : 'No concise UniProt function summary available.';

  drawBackbone();

  setTimeout(() => {
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

export function resetResultState() {
  document.getElementById('results').classList.remove('visible');
  document.getElementById('diseaseAlert').classList.remove('visible');
  document.getElementById('diseaseList').innerHTML = '';
  document.getElementById('variantRows').innerHTML =
    '<tr><td colspan="4" style="color:var(--text-dim);text-align:center;padding:20px">Loading variants...</td></tr>';
  document.getElementById('bindingSites').innerHTML =
    '<div style="color:var(--text-dim);font-size:0.8rem">Loading...</div>';
  document.getElementById('funcTags').innerHTML  = '—';
  document.getElementById('procTags').innerHTML  = '—';
  document.getElementById('funcNote').textContent = '—';
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function setEmbeddedViewer(uniprotId, hasAfModel) {
  const iframe  = document.getElementById('molstarEmbed');
  if (!hasAfModel) {
    iframe.classList.remove('visible');
    iframe.removeAttribute('src');
    return;
  }
  iframe.src = `https://molstar.org/viewer/?afdb=${encodeURIComponent(uniprotId)}&hide-controls=1`;
  iframe.classList.add('visible');
}

function renderSequence(seq, features) {
  if (!seq) return '<span style="color:var(--text-dim)">No sequence available</span>';

  const bindingPositions = new Set();
  const variantPositions = new Set();

  features.forEach(f => {
    if (['Active site', 'Binding site', 'Metal binding', 'Site'].includes(f.type)) {
      for (let i = (f.location?.start?.value || 1) - 1; i < (f.location?.end?.value || 1); i++) {
        bindingPositions.add(i);
      }
    }
    if (f.type === 'Natural variant') {
      variantPositions.add((f.location?.start?.value || 1) - 1);
    }
  });

  return seq.split('').map((aa, i) => {
    if (variantPositions.has(i)) return `<span class="seq-variant" title="Variant at pos ${i + 1}">${aa}</span>`;
    if (bindingPositions.has(i)) return `<span class="seq-active" title="Annotated residue ${i + 1}">${aa}</span>`;
    return aa;
  }).join('');
}

function renderPLDDT(info) {
  const scoreEl = document.getElementById('confScore');
  const descEl  = document.getElementById('confDesc');
  const noteEl  = document.getElementById('plddtNote');

  let high = 0, conf = 0, low = 0, vlow = 0;

  if (!info) {
    scoreEl.textContent = 'N/A';
    scoreEl.className   = 'conf-score medium';
    descEl.textContent  = 'AlphaFold model not available';
    noteEl.textContent  = 'No AlphaFold prediction found for this protein.';
  } else {
    const avg = info.avg;
    if (avg >= 80) {
      scoreEl.className  = 'conf-score high';
      descEl.textContent = 'High confidence model';
    } else if (avg >= 65) {
      scoreEl.className  = 'conf-score medium';
      descEl.textContent = 'Moderate confidence';
    } else {
      scoreEl.className  = 'conf-score low';
      descEl.textContent = 'Low confidence / flexible model';
    }
    if (Number.isFinite(avg)) {
      const dur = 700, t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        scoreEl.textContent = (avg * (1 - Math.pow(1 - p, 3))).toFixed(1);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } else {
      scoreEl.textContent = 'N/A';
    }

    if (info.bins) {
      high = info.bins.high;
      conf = info.bins.conf;
      low  = info.bins.low;
      vlow = info.bins.vlow;
      noteEl.textContent = `${info.note} Source: ${info.source}. Very low-confidence regions often correspond to disorder or flexible loops.`;
    } else {
      noteEl.textContent = `${info.note} Source: ${info.source}.`;
    }
  }

  setTimeout(() => {
    document.getElementById('barHigh').style.width  = high + '%';
    document.getElementById('barConf').style.width  = conf + '%';
    document.getElementById('barLow').style.width   = low  + '%';
    document.getElementById('barVlow').style.width  = vlow + '%';
    document.getElementById('pHigh').textContent    = high + '%';
    document.getElementById('pConf').textContent    = conf + '%';
    document.getElementById('pLow').textContent     = low  + '%';
    document.getElementById('pVlow').textContent    = vlow + '%';
  }, 100);
}

function renderBindingSites(features, seq) {
  const container = document.getElementById('bindingSites');
  const sites     = features.filter(f =>
    ['Active site', 'Binding site', 'Metal binding', 'Site'].includes(f.type)
  );

  if (!sites.length) {
    container.innerHTML = `<div style="color:var(--text-dim);font-size:0.8rem;line-height:1.8">
      No experimentally annotated functional residues were found in this UniProt entry.<br>
      <span style="color:var(--accent)">→</span> This panel reports existing UniProt annotations only.
    </div>`;
    return;
  }

  const grouped = {};
  sites.forEach(s => { (grouped[s.type] ??= []).push(s); });

  container.innerHTML = Object.entries(grouped).map(([type, entries], idx) => {
    const residues = entries.map(e => {
      const pos = e.location?.start?.value;
      const aa  = pos && seq ? seq[pos - 1] : '?';
      return `<span class="res-highlight">${escapeHtml(aa)}${pos || '?'}</span>`;
    });

    const score      = entries.length > 3 ? 'high' : entries.length > 1 ? 'med' : 'low';
    const scoreLabel = score === 'high' ? 'More annotations' : score === 'med' ? 'Multiple sites' : 'Single site';
    const description = entries.map(e => e.description).filter(Boolean).slice(0, 2).join(' · ');

    return `
      <div class="binding-site" style="animation-delay:${idx * 0.1}s">
        <div class="site-row">
          <div class="site-name">${escapeHtml(type)}</div>
          <div class="site-score ${score}">${scoreLabel}</div>
        </div>
        <div class="site-residues">${residues.join(' ')}</div>
        <div style="font-size:0.7rem;color:var(--text-dim);margin-top:4px">
          Source: UniProt feature annotations${description ? ` · ${escapeHtml(description)}` : ''}
        </div>
      </div>`;
  }).join('');
}

function classifyVariant(desc) {
  const lower = desc.toLowerCase();
  if (/likely pathogenic/.test(lower)) return { cls: 'path-likely',      label: 'Likely path.'  };
  if (/pathogenic/.test(lower))        return { cls: 'path-pathogenic',  label: 'Pathogenic'    };
  if (/likely benign/.test(lower))     return { cls: 'path-benign',      label: 'Likely benign' };
  if (/benign/.test(lower))            return { cls: 'path-benign',      label: 'Benign'        };
  if (/uncertain|vus|unknown/.test(lower)) return { cls: 'path-vus',    label: 'Uncertain'     };
  return { cls: 'path-vus', label: 'Reported' };
}

function cleanVariantDescription(desc) {
  return desc
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/in dbsnp/ig, ' ')
    .replace(/;\s*dbsnp:[^;]+/ig, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderVariants(variants) {
  const tbody        = document.getElementById('variantRows');
  const countEl      = document.getElementById('variantCount');
  const showMoreWrap = document.getElementById('variantShowMore');
  const diseased     = variants.filter(v => v.description && !/in dbsnp/i.test(v.description));

  if (countEl) countEl.textContent = diseased.length > 0 ? `(${diseased.length})` : '';

  if (!diseased.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:var(--text-dim);text-align:center;padding:20px;font-size:0.8rem">No disease-annotated variants found in this UniProt entry.</td></tr>`;
    if (showMoreWrap) showMoreWrap.innerHTML = '';
    return;
  }

  const makeRows = (list) => list.map((v, idx) => {
    const pos  = v.location?.start?.value || '?';
    const orig = v.alternativeSequence?.originalSequence || '?';
    const alt  = v.alternativeSequence?.alternativeSequences?.[0] || '?';
    const desc = cleanVariantDescription(v.description || '');
    const cls  = classifyVariant(desc);
    return `<tr style="animation-delay:${Math.min(idx, 12) * 0.04}s">
      <td><span class="var-pos">${escapeHtml(String(pos))}</span></td>
      <td><span class="var-change">${escapeHtml(String(orig))}→${escapeHtml(String(alt))}</span></td>
      <td><span class="pathogenicity ${cls.cls}">${cls.label}</span></td>
      <td style="color:var(--text-dim);font-size:0.72rem">${escapeHtml(desc.slice(0, 180))}${desc.length > 180 ? '…' : ''}</td>
    </tr>`;
  }).join('');

  const LIMIT = 20;
  tbody.innerHTML = makeRows(diseased.slice(0, LIMIT));

  if (showMoreWrap) {
    if (diseased.length > LIMIT) {
      showMoreWrap.innerHTML = `<button class="show-more-btn">Show all ${diseased.length} variants ↓</button>`;
      showMoreWrap.querySelector('button').addEventListener('click', () => {
        tbody.innerHTML = makeRows(diseased);
        showMoreWrap.innerHTML = '';
      });
    } else {
      showMoreWrap.innerHTML = '';
    }
  }
}

function drawBackbone() {
  const container = document.getElementById('svgBackbone');
  const W = 1100, H = 360;
  const points = [];
  for (let i = 0; i <= 80; i++) {
    const x = (i / 80) * W;
    const y = H / 2 + Math.sin(i * 0.3) * 60 + Math.sin(i * 0.7) * 30 + Math.cos(i * 0.15) * 40;
    points.push([x, y]);
  }
  const pathD = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');

  const DASH = 3000;
  const spheres = points.filter((_, i) => i % 8 === 0).map(([x, y], i) => {
    const colors = ['#00d4ff', '#7b2fff', '#00ff88', '#ff6b35'];
    const c      = colors[i % colors.length];
    const appear = (0.8 + i * 0.15).toFixed(2);
    const pulse  = (parseFloat(appear) + 0.3).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="5" fill="${c}" opacity="0">
      <animate attributeName="opacity" from="0" to="0.55" dur="0.3s" fill="freeze" begin="${appear}s"/>
      <animate attributeName="r" values="5;7;5" dur="${(1.5 + i * 0.2).toFixed(1)}s" repeatCount="indefinite" begin="${pulse}s"/>
    </circle>`;
  }).join('');

  container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="chainGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stop-color="#7b2fff" stop-opacity="0.32"/>
        <stop offset="50%"  stop-color="#00d4ff" stop-opacity="0.42"/>
        <stop offset="100%" stop-color="#00ff88" stop-opacity="0.32"/>
      </linearGradient>
    </defs>
    <path d="${pathD}" stroke="url(#chainGrad)" stroke-width="2.5" fill="none"
          stroke-linecap="round" stroke-linejoin="round"
          stroke-dasharray="${DASH}" stroke-dashoffset="${DASH}">
      <animate attributeName="stroke-dashoffset" from="${DASH}" to="0" dur="1.3s" fill="freeze" begin="0.05s"/>
    </path>
    ${spheres}
  </svg>`;
}
