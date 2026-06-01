import { useRef, useState } from 'react';
import { Upload, FileCheck2, AlertCircle, FileDown, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Section } from './Stat';
import { parseDataset, type ParseResult } from '../../lib/parseDataset';
import type { useAdmin } from '../../hooks/useAdmin';

type Admin = ReturnType<typeof useAdmin>;

const SAMPLE_JSON = `[
  {
    "questions": ["Tumi ke?", "তুমি কে?", "Who are you?"],
    "answer": "আমি Sofia, তোমার AI সঙ্গী।",
    "category": "intro",
    "tags": ["greeting"]
  }
]`;

const SAMPLE_CSV = `question,answer,category,tags
"Tumi ke?","আমি Sofia।","intro","greeting"
"Tomar nam ki?","আমার নাম Sofia।","intro","name"`;

export default function BulkTab({ admin }: { admin: Admin }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [rawText, setRawText] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    let all: ParseResult = { items: [], skipped: 0, format: '' };
    const formats: string[] = [];
    for (const f of Array.from(files)) {
      const text = await f.text();
      const p = parseDataset(text, f.name);
      all.items.push(...p.items);
      all.skipped += p.skipped;
      formats.push(`${f.name}:${p.format}`);
    }
    all.format = formats.join(', ');
    setPreview(all);
    setRawText('');
    toast.success(`Parsed ${all.items.length} items from ${files.length} file(s)`);
  }

  function parseTextarea() {
    if (!rawText.trim()) { toast.error('Paste content first'); return; }
    const p = parseDataset(rawText);
    setPreview(p);
    toast.success(`Parsed ${p.items.length} items (${p.format})`);
  }

  async function commit() {
    if (!preview?.items.length) return;
    setUploading(true);
    setProgress({ done: 0, total: preview.items.length });
    try {
      const ok = await admin.bulkAddQA(preview.items, (n, total) => setProgress({ done: n, total }));
      toast.success(`Uploaded ${ok} / ${preview.items.length}`);
      await admin.reload();
      setPreview(null); setRawText('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (e: any) { toast.error(e?.message || 'Upload failed'); }
    finally { setUploading(false); }
  }

  async function exportJSON() {
    const data = admin.all.qaData;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `sofia-qa-${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Exported');
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <Section
        title="Bulk Upload"
        desc="Drop JSON / JSONL / CSV / TSV / TXT. Multiple files supported. Auto-detects format."
        action={
          <button onClick={exportJSON} className="px-3 py-1.5 rounded-md bg-muted text-sm flex items-center gap-1.5">
            <FileDown className="w-4 h-4" /> Export all
          </button>
        }
      >
        <label
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          onDragOver={e => e.preventDefault()}
          className="block border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition"
        >
          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <div className="text-sm font-medium">Drop files here or click to browse</div>
          <div className="text-xs text-muted-foreground mt-1">.json · .jsonl · .csv · .tsv · .txt</div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".json,.jsonl,.csv,.tsv,.txt"
            onChange={e => handleFiles(e.target.files)}
            className="hidden"
          />
        </label>

        <div className="text-center text-xs text-muted-foreground">— or paste raw text —</div>

        <textarea
          value={rawText}
          onChange={e => setRawText(e.target.value)}
          rows={6}
          placeholder={`Paste JSON array, CSV rows, or:\n\nQ: Tumi ke?\nA: আমি Sofia।`}
          className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm font-mono"
        />
        <button onClick={parseTextarea} className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-sm flex items-center gap-1.5">
          <Wand2 className="w-4 h-4" /> Parse text
        </button>

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Show format examples</summary>
          <pre className="mt-2 p-3 bg-muted rounded text-[11px] overflow-x-auto">{SAMPLE_JSON}</pre>
          <pre className="mt-2 p-3 bg-muted rounded text-[11px] overflow-x-auto">{SAMPLE_CSV}</pre>
        </details>
      </Section>

      {preview && (
        <Section title={`Preview: ${preview.items.length} items`} desc={`Format: ${preview.format} · Skipped: ${preview.skipped}`}>
          {preview.items.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" /> No valid items parsed. Check the format.
            </div>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto divide-y divide-border border border-border rounded-md">
                {preview.items.slice(0, 50).map((it, i) => (
                  <div key={i} className="p-2 text-xs">
                    <div className="font-medium truncate">{it.questions[0]}</div>
                    <div className="text-muted-foreground truncate">{it.answer}</div>
                  </div>
                ))}
                {preview.items.length > 50 && <div className="p-2 text-xs text-center text-muted-foreground">+ {preview.items.length - 50} more</div>}
              </div>

              {uploading && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Uploading…</span>
                    <span>{progress.done} / {progress.total}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setPreview(null)} disabled={uploading} className="px-3 py-1.5 rounded-md bg-muted text-sm">Discard</button>
                <button onClick={commit} disabled={uploading} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm flex items-center gap-1.5 disabled:opacity-50">
                  <FileCheck2 className="w-4 h-4" /> Commit {preview.items.length} to Firebase
                </button>
              </div>
            </>
          )}
        </Section>
      )}
    </div>
  );
}
