import { useEffect, useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Section } from './Stat';
import type { useAdmin } from '../../hooks/useAdmin';

type Admin = ReturnType<typeof useAdmin>;

const DEFAULT_WEIGHTS = { bm25: 0.35, tfidf: 0.25, ngram: 0.15, fuzzy: 0.10, phonetic: 0.08, jaccard: 0.07 };
const DEFAULT_THRESHOLDS = { bm25: 1.8, tfidf: 0.07, ngram: 0.12, fuzzy: 0.60, phonetic: 0.68, jaccard: 0.20, lowConfidence: 35, highConfidence: 70 };

export default function ConfigTab({ admin }: { admin: Admin }) {
  const cfg = (admin.all.botConfig || {}) as any;
  const [draft, setDraft] = useState<any>({
    botName: cfg.botName ?? 'Sofia',
    version: cfg.version ?? '4.0',
    language: cfg.language ?? 'bn',
    searchWeights: { ...DEFAULT_WEIGHTS, ...(cfg.searchWeights || {}) },
    thresholds: { ...DEFAULT_THRESHOLDS, ...(cfg.thresholds || {}) },
    features: cfg.features || {},
  });

  useEffect(() => {
    setDraft({
      botName: cfg.botName ?? 'Sofia',
      version: cfg.version ?? '4.0',
      language: cfg.language ?? 'bn',
      searchWeights: { ...DEFAULT_WEIGHTS, ...(cfg.searchWeights || {}) },
      thresholds: { ...DEFAULT_THRESHOLDS, ...(cfg.thresholds || {}) },
      features: cfg.features || {},
    });
  }, [admin.all.botConfig]);

  async function save() {
    try {
      await admin.setNode('botConfig', draft);
      await admin.reload();
      toast.success('Config saved');
    } catch (e: any) { toast.error(e?.message); }
  }

  function reset() {
    setDraft((d: any) => ({ ...d, searchWeights: { ...DEFAULT_WEIGHTS }, thresholds: { ...DEFAULT_THRESHOLDS } }));
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <Section title="Bot Identity">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Bot name" value={draft.botName} onChange={v => setDraft({ ...draft, botName: v })} />
          <Field label="Version" value={draft.version} onChange={v => setDraft({ ...draft, version: v })} />
          <Field label="Default lang" value={draft.language} onChange={v => setDraft({ ...draft, language: v })} />
        </div>
      </Section>

      <Section title="Search Engine Weights" desc="Higher = more influence on final score. Adjust live and watch Analytics.">
        <div className="space-y-3">
          {Object.entries(draft.searchWeights).map(([k, v]: any) => (
            <Slider key={k} label={k} value={v} min={0} max={1} step={0.01}
              onChange={n => setDraft({ ...draft, searchWeights: { ...draft.searchWeights, [k]: n } })} />
          ))}
        </div>
      </Section>

      <Section title="Confidence Thresholds" desc="Per-engine minimum scores and overall confidence cutoffs.">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(draft.thresholds).map(([k, v]: any) => (
            <Field key={k} label={k} type="number" value={v}
              onChange={n => setDraft({ ...draft, thresholds: { ...draft.thresholds, [k]: Number(n) } })} />
          ))}
        </div>
      </Section>

      <Section title="Feature Flags">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(draft.features).map(([k, v]: any) => (
            <label key={k} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted cursor-pointer">
              <input type="checkbox" checked={!!v} onChange={e => setDraft({ ...draft, features: { ...draft.features, [k]: e.target.checked } })} />
              {k}
            </label>
          ))}
        </div>
      </Section>

      <div className="flex gap-2">
        <button onClick={save} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm flex items-center gap-1.5"><Save className="w-4 h-4" /> Save config</button>
        <button onClick={reset} className="px-4 py-2 rounded-md bg-muted text-sm flex items-center gap-1.5"><RotateCcw className="w-4 h-4" /> Reset defaults</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: any; onChange: (v: any) => void; type?: string }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} className="w-full px-2 py-1.5 rounded bg-background border border-border text-sm" />
    </label>
  );
}

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-mono">{label}</span>
        <span className="font-mono">{value.toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full accent-primary" />
    </div>
  );
}
