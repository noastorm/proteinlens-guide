/**
 * scripts/generate-proteins.js
 *
 * Reads scripts/uniprot-human-reviewed.tsv, calls the Claude API for each
 * protein, and writes plain-English explanations to public/proteins.json.
 *
 * Usage:
 *   node scripts/generate-proteins.js
 *
 * Requirements:
 *   - .env file with ANTHROPIC_API_KEY=sk-ant-...
 *   - scripts/uniprot-human-reviewed.tsv downloaded from UniProt
 *
 * Safe to stop and restart — already-processed IDs are skipped.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, '..');

// ─── Config ───────────────────────────────────────────────────────────────────

const TSV_PATH    = path.join(__dirname, 'uniprot-human-reviewed.tsv');
const OUTPUT_PATH = path.join(ROOT, 'public', 'proteins.json');
const API_KEY     = loadEnv();

const REQUESTS_PER_MINUTE = 40;   // conservative — free tier is ~50/min
const DELAY_MS = Math.ceil(60000 / REQUESTS_PER_MINUTE);
const BATCH_SAVE_EVERY = 50;      // write to disk every N proteins

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  console.log('ProteinLens — batch protein explanation generator');
  console.log('─'.repeat(50));

  if (!API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY not found in .env file.');
    process.exit(1);
  }

  if (!fs.existsSync(TSV_PATH)) {
    console.error(`ERROR: TSV file not found at ${TSV_PATH}`);
    console.error('Download it from UniProt: https://www.uniprot.org/uniprotkb?query=reviewed:true+AND+organism_id:9606');
    process.exit(1);
  }

  // Load existing output (for resumability)
  let proteins = {};
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      proteins = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
      console.log(`Resuming — ${Object.keys(proteins).length} proteins already processed.`);
    } catch {
      console.log('Could not parse existing proteins.json — starting fresh.');
    }
  } else {
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  }

  // Parse TSV
  const rows = parseTSV(TSV_PATH);
  console.log(`TSV loaded — ${rows.length} proteins to process.`);

  const todo = rows.filter(r => r.accession && !proteins[r.accession]);
  console.log(`${todo.length} remaining after skipping already-processed.\n`);

  if (todo.length === 0) {
    console.log('All proteins already processed! proteins.json is complete.');
    return;
  }

  let processed = 0;
  let errors    = 0;

  for (const row of todo) {
    const { accession, proteinName, geneNames, functionText, diseaseText } = row;

    process.stdout.write(`[${processed + 1}/${todo.length}] ${accession} (${geneNames || '—'})... `);

    try {
      const result = await callClaude(accession, proteinName, geneNames, functionText, diseaseText);
      proteins[accession] = result;
      processed++;
      process.stdout.write('✓\n');
    } catch (err) {
      errors++;
      process.stdout.write(`✗ ${err.message}\n`);
      // On rate limit, wait longer
      if (err.message.includes('429') || err.message.includes('rate')) {
        console.log('  Rate limit hit — waiting 60s...');
        await sleep(60000);
      }
    }

    // Save periodically
    if (processed % BATCH_SAVE_EVERY === 0) {
      saveOutput(OUTPUT_PATH, proteins);
      console.log(`  → Saved ${Object.keys(proteins).length} proteins to proteins.json`);
    }

    await sleep(DELAY_MS);
  }

  // Final save
  saveOutput(OUTPUT_PATH, proteins);

  console.log('\n' + '─'.repeat(50));
  console.log(`Done! ${processed} processed, ${errors} errors.`);
  console.log(`Output: ${OUTPUT_PATH}`);
  console.log(`Total proteins in file: ${Object.keys(proteins).length}`);
}

// ─── Claude API call ──────────────────────────────────────────────────────────

async function callClaude(accession, proteinName, geneNames, functionText, diseaseText) {
  const prompt = `You are writing plain-English summaries of human proteins for a public science website aimed at students, patients, and curious non-experts.

Given this UniProt data, produce a JSON object with these exact fields:
- "id": the UniProt accession (string)
- "gene": primary gene name, or empty string if unknown
- "name": full protein name
- "plain_summary": 2-3 sentences explaining what this protein does in plain English. No jargon. Imagine explaining to a smart 16-year-old.
- "disease_connection": 1-2 sentences on what diseases or conditions this protein is linked to. If none, write "No known disease associations in current databases."
- "drug_discovery_note": 1 sentence on whether this protein is a drug target or has therapeutic relevance. If not known, write "Not currently a known drug target."
- "search_terms": array of 8-15 lowercase strings someone might search to find this protein — include disease names, gene name, protein name variants, body systems affected.

Respond with ONLY the JSON object, no markdown, no explanation.

UniProt Accession: ${accession}
Protein Name: ${proteinName || 'Unknown'}
Gene Names: ${geneNames || 'Unknown'}
Function: ${functionText || 'No function annotation available.'}
Disease Involvement: ${diseaseText || 'No disease annotations.'}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text.slice(0, 100)}`);
  }

  const data  = await response.json();
  const text  = data.content?.[0]?.text || '';
  const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

  try {
    const parsed = JSON.parse(clean);
    // Ensure required fields exist
    return {
      id:                  parsed.id                  || accession,
      gene:                parsed.gene                || geneNames?.split(' ')[0] || '',
      name:                parsed.name                || proteinName || '',
      plain_summary:       parsed.plain_summary       || '',
      disease_connection:  parsed.disease_connection  || '',
      drug_discovery_note: parsed.drug_discovery_note || '',
      search_terms:        Array.isArray(parsed.search_terms) ? parsed.search_terms : [],
    };
  } catch {
    throw new Error(`JSON parse failed. Raw: ${clean.slice(0, 80)}`);
  }
}

// ─── TSV parser ───────────────────────────────────────────────────────────────

function parseTSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines   = content.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split('\t').map(h => h.trim().toLowerCase());

  // Find column indices — UniProt TSV column names vary slightly
  const idx = {
    accession:   findCol(headers, ['entry', 'accession', 'entry name']),
    proteinName: findCol(headers, ['protein names', 'protein name']),
    geneNames:   findCol(headers, ['gene names', 'gene name']),
    function:    findCol(headers, ['function [cc]', 'function', 'function(s) [cc]']),
    disease:     findCol(headers, ['involvement in disease', 'disease involvement', 'pathology & biotech']),
  };

  console.log('TSV columns detected:', Object.entries(idx).map(([k, v]) => `${k}=${v}`).join(', '));

  return lines.slice(1).map(line => {
    const cols = line.split('\t');
    return {
      accession:    cols[idx.accession]?.trim()   || '',
      proteinName:  cols[idx.proteinName]?.trim() || '',
      geneNames:    cols[idx.geneNames]?.trim()   || '',
      functionText: cols[idx.function]?.trim()    || '',
      diseaseText:  cols[idx.disease]?.trim()     || '',
    };
  }).filter(r => r.accession);
}

function findCol(headers, candidates) {
  for (const c of candidates) {
    const i = headers.findIndex(h => h.includes(c));
    if (i !== -1) return i;
  }
  return 0; // fallback to first column
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function saveOutput(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return null;
  const content = fs.readFileSync(envPath, 'utf8');
  const match   = content.match(/ANTHROPIC_API_KEY\s*=\s*(.+)/);
  return match ? match[1].trim() : null;
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
