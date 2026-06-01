/**
 * Universal dataset parser — accepts JSON, JSONL, CSV, TSV, or plain text Q→A pairs.
 * Returns normalized QARecord[] regardless of input shape.
 */
import type { QARecord } from '../hooks/useAdmin';

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function normalizeItem(raw: any): QARecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const questions = asArray(raw.questions ?? raw.question ?? raw.q ?? raw.query ?? raw.prompt)
    .map((s: any) => String(s).trim()).filter(Boolean);
  const answer = String(raw.answer ?? raw.a ?? raw.response ?? raw.reply ?? '').trim();
  if (!questions.length || !answer) return null;
  return {
    questions,
    answer,
    category: raw.category || raw.cat || 'general',
    tags: Array.isArray(raw.tags) ? raw.tags : (raw.tags ? String(raw.tags).split(',').map((s: string) => s.trim()) : []),
    feedback: raw.feedback || { positive: 0, negative: 0 },
  };
}

function parseCSV(text: string): any[] {
  // Minimal CSV/TSV parser supporting quoted fields, comma or tab delim.
  const delim = text.includes('\t') && !text.includes(',') ? '\t' : ',';
  const rows: string[][] = [];
  let cur: string[] = [], cell = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') inQ = false;
      else cell += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === delim) { cur.push(cell); cell = ''; }
      else if (c === '\n') { cur.push(cell); rows.push(cur); cur = []; cell = ''; }
      else if (c === '\r') { /* skip */ }
      else cell += c;
    }
  }
  if (cell.length || cur.length) { cur.push(cell); rows.push(cur); }
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  return rows.slice(1).filter(r => r.some(c => c.trim())).map(r => {
    const obj: any = {};
    headers.forEach((h, i) => obj[h] = r[i] ?? '');
    return obj;
  });
}

export interface ParseResult {
  items: QARecord[];
  skipped: number;
  format: string;
}

export function parseDataset(content: string, filename = ''): ParseResult {
  const trimmed = content.trim();
  if (!trimmed) return { items: [], skipped: 0, format: 'empty' };

  // JSON / JSONL
  try {
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      const arr = Array.isArray(parsed) ? parsed
        : Array.isArray(parsed.qa) ? parsed.qa
        : Array.isArray(parsed.qaData) ? parsed.qaData
        : Array.isArray(parsed.data) ? parsed.data
        : typeof parsed === 'object' ? Object.values(parsed)
        : [];
      const items = arr.map(normalizeItem).filter(Boolean) as QARecord[];
      return { items, skipped: arr.length - items.length, format: 'json' };
    }
  } catch { /* fall through */ }

  // JSONL
  if (trimmed.includes('\n') && trimmed.split('\n').every(l => {
    const s = l.trim(); return !s || s.startsWith('{');
  })) {
    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
    const arr = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    const items = arr.map(normalizeItem).filter(Boolean) as QARecord[];
    if (items.length) return { items, skipped: lines.length - items.length, format: 'jsonl' };
  }

  // CSV/TSV (auto-detect by filename or comma/tab in first line)
  if (/\.(csv|tsv)$/i.test(filename) || /^[^{[].*[,\t]/.test(trimmed.split('\n')[0])) {
    const arr = parseCSV(trimmed);
    const items = arr.map(normalizeItem).filter(Boolean) as QARecord[];
    if (items.length) return { items, skipped: arr.length - items.length, format: 'csv' };
  }

  // Plain text: alternating Q: / A: blocks, or "Question | Answer"
  const items: QARecord[] = [];
  const blocks = trimmed.split(/\n\s*\n/);
  let skipped = 0;
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const qLines: string[] = [], aLines: string[] = [];
    let mode: 'q' | 'a' | null = null;
    for (const line of lines) {
      const qm = line.match(/^(?:q|question|প্রশ্ন)[:\-)]\s*(.+)/i);
      const am = line.match(/^(?:a|answer|উত্তর)[:\-)]\s*(.+)/i);
      const pipe = line.match(/^(.+?)\s*[|→=]\s*(.+)$/);
      if (qm) { mode = 'q'; qLines.push(qm[1]); }
      else if (am) { mode = 'a'; aLines.push(am[1]); }
      else if (pipe && qLines.length === 0) { qLines.push(pipe[1]); aLines.push(pipe[2]); mode = 'a'; }
      else if (mode === 'q') qLines.push(line);
      else if (mode === 'a') aLines.push(line);
    }
    if (qLines.length && aLines.length) {
      items.push({ questions: qLines, answer: aLines.join('\n'), category: 'general', tags: [] });
    } else if (block.trim()) skipped++;
  }
  return { items, skipped, format: items.length ? 'text' : 'unknown' };
}
