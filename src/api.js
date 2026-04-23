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

  // Find the loop_ block containing _ma_qa_metric_local
  let inMetricLoop = false;
  const columnNames = [];
  let metricValueColIndex = -1;
  const values = [];
  let parsingData = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (trimmed === 'loop_') {
      // Reset — start of a new loop block
      inMetricLoop = false;
      columnNames.length = 0;
      metricValueColIndex = -1;
      parsingData = false;
      continue;
    }

    if (trimmed.startsWith('_ma_qa_metric_local.')) {
      inMetricLoop = true;
      const colName = trimmed.split('.')[1];
      columnNames.push(colName);
      if (colName === 'metric_value') {
        metricValueColIndex = columnNames.length - 1;
      }
      parsingData = false;
      continue;
    }

    // Once we've seen column headers and hit a non-header line, we're in data
    if (inMetricLoop && columnNames.length > 0 && !trimmed.startsWith('_') && trimmed !== 'loop_') {
      if (!trimmed || trimmed.startsWith('#')) {
        if (values.length > 0) break; // end of this block
        continue;
      }

      parsingData = true;

      // Parse the row — handle quoted tokens
      const parts = trimmed.match(/(?:'[^']*'|"[^"]*"|\S+)/g);
      if (!parts) continue;

      if (metricValueColIndex >= 0 && metricValueColIndex < parts.length) {
        const val = Number(parts[metricValueColIndex].replace(/['"]/g, ''));
        if (Number.isFinite(val) && val >= 0 && val <= 100) {
          values.push(val);
        }
      }
    }

    // If we were parsing data and hit a new loop or category, stop
    if (parsingData && (trimmed === 'loop_' || (trimmed.startsWith('_') && !trimmed.startsWith('_ma_qa_metric_local.')))) {
      break;
    }
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
