/**
 * api.js
 * UniProt and AlphaFold fetch functions.
 */

export async function resolveGeneToUniprotId(geneName) {
  const url = `https://rest.uniprot.org/uniprotkb/search?query=gene:${encodeURIComponent(geneName)}+AND+organism_id:9606+AND+reviewed:true&fields=accession&format=json&size=1`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`No reviewed human UniProt entry found for gene: ${geneName}`);
  }
  return data.results[0].primaryAccession;
}

export async function fetchUniprotEntry(uniprotId) {
  const res = await fetch(`https://rest.uniprot.org/uniprotkb/${uniprotId}?format=json`);
  if (!res.ok) throw new Error(`UniProt entry not found: ${uniprotId}`);
  return res.json();
}

export async function fetchAlphaFoldEntry(uniprotId) {
  try {
    const res = await fetch(`https://alphafold.ebi.ac.uk/api/prediction/${uniprotId}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchPLDDTFromCif(cifUrl, afEntry) {
  try {
    const res = await fetch(cifUrl);
    if (!res.ok) throw new Error('Could not download AlphaFold mmCIF');
    const cifText = await res.text();
    const values = parsePlddtValuesFromCif(cifText);
    if (!values.length) throw new Error('No pLDDT values found in mmCIF');
    return summarizePLDDT(values, cifUrl);
  } catch {
    const avgFallback = Number(
      afEntry?.globalMetricValue ?? afEntry?.confidenceScore ?? afEntry?.plddt
    );
    if (Number.isFinite(avgFallback)) {
      return {
        avg: avgFallback,
        count: null,
        bins: null,
        source: 'AlphaFold API summary only',
        note: 'Per-residue pLDDT parsing was unavailable; only the AlphaFold summary score is shown.',
      };
    }
    return null;
  }
}

function parsePlddtValuesFromCif(cifText) {
  const lines = cifText.split(/\r?\n/);
  const headerIndex = lines.findIndex(l => l.trim() === '_ma_qa_metric_local.metric_value');
  if (headerIndex === -1) return [];

  const values = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.startsWith('#')) { if (values.length) break; continue; }
    if (trimmed.startsWith('_') || trimmed === 'loop_') { if (values.length) break; continue; }
    const parts = trimmed.match(/(?:'[^']*'|"[^"]*"|\S+)/g);
    if (!parts || parts.length < 6) continue;
    const value = Number(parts[5].replace(/['"]/g, ''));
    if (Number.isFinite(value)) values.push(value);
  }
  return values;
}

function summarizePLDDT(values, sourceUrl) {
  const total = values.length;
  const avg = values.reduce((a, b) => a + b, 0) / total;
  const bins = {
    high: values.filter(v => v >= 90).length,
    conf: values.filter(v => v >= 70 && v < 90).length,
    low:  values.filter(v => v >= 50 && v < 70).length,
    vlow: values.filter(v => v < 50).length,
  };
  return {
    avg,
    count: total,
    bins: {
      high: Math.round((bins.high / total) * 100),
      conf: Math.round((bins.conf / total) * 100),
      low:  Math.round((bins.low  / total) * 100),
      vlow: Math.max(0,
        100
        - Math.round((bins.high / total) * 100)
        - Math.round((bins.conf / total) * 100)
        - Math.round((bins.low  / total) * 100)
      ),
    },
    source: 'AlphaFold mmCIF per-residue pLDDT',
    note: `Computed from ${total} per-residue local confidence values parsed from the AlphaFold structure file.`,
  };
}
