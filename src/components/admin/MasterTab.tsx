import { useEffect, useState } from 'react';
import { Copy, Download, Zap, Cloud, CloudDownload, Play, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Section, Stat } from './Stat';
import type { useAdmin } from '../../hooks/useAdmin';
import { getSharedIntel } from '../../lib/sharedIntel';
import {
  runImprovementNow, lastReport,
} from '../../engine/intelligence/autonomousImprovement';
import {
  buildLocalSnapshot, pushToFirebase, pullFromFirebase,
  pushImprovementReport, getLastSync,
} from '../../lib/firebaseTraining';

type Admin = ReturnType<typeof useAdmin>;
const AUTO_SYNC_KEY = 'sofia_training_autosync';

async function copy(s: string, label: string) {
  try { await navigator.clipboard.writeText(s); toast.success(`${label} copied (${s.length.toLocaleString()} chars)`); }
  catch { toast.error('Clipboard failed'); }
}

function download(name: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}

export default function MasterTab({ admin }: { admin: Admin }) {
  const intel = getSharedIntel();
  const [snapshot, setSnapshot] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [report, setReport] = useState(lastReport());
  const [lastSync, setLastSync] = useState(getLastSync());
  const [autoSync, setAutoSync] = useState(() => localStorage.getItem(AUTO_SYNC_KEY) === '1');

  const rebuild = async () => {
    setBusy('build');
    try {
      const fb = await admin.snapshot();
      const training = buildLocalSnapshot();
      const diag = intel.getDiagnostics();
      setSnapshot({
        _meta: { createdAt: Date.now(), version: 'sofia-master-v1' },
        firebase: fb,
        training,
        intelligence: diag,
        autoImproveReport: lastReport(),
      });
      toast.success('Master snapshot built');
    } finally { setBusy(null); }
  };

  useEffect(() => { rebuild(); /* eslint-disable-next-line */ }, []);

  // Auto-sync to Firebase every 10 minutes when enabled
  useEffect(() => {
    if (!autoSync) return;
    const tick = async () => { try { await pushToFirebase(); setLastSync(Date.now()); } catch {/*ignore*/} };
    const id = setInterval(tick, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [autoSync]);

  const runImprove = async () => {
    setBusy('improve');
    try {
      const r = runImprovementNow(intel);
      setReport(r);
      try { await pushImprovementReport(r); } catch {/*ignore*/}
      toast.success(`Improved: +${r.inferred} inferred · merged ${r.duplicatesMerged}`);
    } catch (e: any) { toast.error(e?.message); }
    finally { setBusy(null); }
  };

  const push = async () => {
    setBusy('push');
    try { const s = await pushToFirebase(); setLastSync(s.ts); toast.success('Training data pushed to Firebase'); }
    catch (e: any) { toast.error(e?.message); } finally { setBusy(null); }
  };
  const pull = async () => {
    setBusy('pull');
    try {
      const r = await pullFromFirebase();
      setLastSync(getLastSync());
      toast.success(`Pulled — concepts +${r.concepts}, ontology +${r.ontology}, facts +${r.facts}, learned +${r.learned}`);
    } catch (e: any) { toast.error(e?.message); } finally { setBusy(null); }
  };

  const sections: Array<{ key: string; label: string; pick: (s: any) => any }> = [
    { key: 'all',         label: '★ FULL Master (everything)',  pick: s => s },
    { key: 'qaData',      label: '1. QA Dataset',               pick: s => s.firebase.qaData },
    { key: 'synonymMap',  label: '2. Synonyms',                 pick: s => s.firebase.synonymMap },
    { key: 'intents',     label: '3. Intents',                  pick: s => s.firebase.intents },
    { key: 'entities',    label: '4. Entities',                 pick: s => s.firebase.entities },
    { key: 'templates',   label: '5. Response Templates',       pick: s => s.firebase.responseTemplates },
    { key: 'spell',       label: '6. Spell Corrections',        pick: s => s.firebase.spellCorrections },
    { key: 'sentiment',   label: '7. Sentiment Lexicon',        pick: s => s.firebase.sentimentLexicon },
    { key: 'characters',  label: '8. Characters',               pick: s => s.firebase.characters },
    { key: 'slides',      label: '9. Slides',                   pick: s => s.firebase.slides },
    { key: 'concepts',    label: '10. Concepts (Intelligence)', pick: s => s.training.concepts },
    { key: 'ontology',    label: '11. Ontology Tree',           pick: s => s.training.ontology },
    { key: 'facts',       label: '12. Facts / Knowledge',       pick: s => s.training.facts },
    { key: 'learned',     label: '13. Learned by Sofia',        pick: s => s.training.learned },
    { key: 'graph',       label: '14. Knowledge Graph',         pick: s => s.intelligence.graph },
    { key: 'traces',      label: '15. Reasoning Traces',        pick: s => s.training.traces },
    { key: 'weights',     label: '16. Adaptive Weights',        pick: s => s.intelligence.weights },
    { key: 'feedback',    label: '17. Feedback Stats',          pick: s => s.intelligence.feedback },
    { key: 'config',      label: '18. Bot Config',              pick: s => s.firebase.botConfig },
  ];

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={<Zap className="w-4 h-4" />} label="QA records" value={Object.keys(admin.all.qaData || {}).length} />
        <Stat label="Concepts" value={intel.concepts.list().length} />
        <Stat label="Facts" value={intel.facts.list().length} />
        <Stat label="Learned" value={intel.active.learnedList().length} />
      </div>

      {/* --- Sequenced export with copy buttons --- */}
      <Section
        title="One-Click Master Export"
        desc="Everything Sofia knows — Firebase data + Intelligence engines — sequenced. Copy individually or grab the FULL bundle."
        action={
          <button onClick={rebuild} disabled={busy === 'build'}
            className="px-2 py-1 rounded bg-muted text-xs flex items-center gap-1">
            <RefreshCw className={`w-3 h-3 ${busy === 'build' ? 'animate-spin' : ''}`} /> Rebuild
          </button>
        }
      >
        {!snapshot ? (
          <div className="text-xs text-muted-foreground">Building…</div>
        ) : (
          <div className="divide-y divide-border border border-border rounded-md">
            {sections.map(sec => {
              const val = sec.pick(snapshot);
              const str = JSON.stringify(val ?? null);
              const empty = !val || (Array.isArray(val) ? val.length === 0 : Object.keys(val).length === 0);
              return (
                <div key={sec.key} className="p-2.5 flex items-center gap-2 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${sec.key === 'all' ? 'text-primary' : ''}`}>{sec.label}</div>
                    <div className="text-muted-foreground">{(str.length / 1024).toFixed(1)} KB · {empty ? 'empty' : 'ready'}</div>
                  </div>
                  <button
                    disabled={empty}
                    onClick={() => copy(JSON.stringify(val, null, 2), sec.label)}
                    className="px-2 py-1 rounded bg-primary text-primary-foreground flex items-center gap-1 disabled:opacity-40">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                  <button
                    disabled={empty}
                    onClick={() => download(`sofia-${sec.key}-${Date.now()}.json`, val)}
                    className="px-2 py-1 rounded bg-muted flex items-center gap-1 disabled:opacity-40">
                    <Download className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* --- Self-improvement --- */}
      <Section
        title="Autonomous Self-Improvement"
        desc="Sofia recalibrates her own confidence, merges duplicate facts, infers new relations, and tracks weak domains. Runs daily — or trigger now."
      >
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={runImprove} disabled={busy === 'improve'}
            className="px-3 py-2 rounded bg-primary text-primary-foreground text-sm flex items-center gap-1.5 disabled:opacity-50">
            <Play className="w-4 h-4" /> Run improvement now
          </button>
          {report && (
            <span className="text-xs text-muted-foreground">
              Last: {new Date(report.ts).toLocaleString()}
            </span>
          )}
        </div>
        {report && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="border border-border rounded p-2">
              <div className="text-muted-foreground">New inferred</div>
              <div className="text-lg font-semibold">{report.inferred}</div>
            </div>
            <div className="border border-border rounded p-2">
              <div className="text-muted-foreground">Duplicates merged</div>
              <div className="text-lg font-semibold">{report.duplicatesMerged}</div>
            </div>
            <div className="border border-border rounded p-2">
              <div className="text-muted-foreground">Stale removed</div>
              <div className="text-lg font-semibold">{report.staleRemoved}</div>
            </div>
            <div className="border border-border rounded p-2">
              <div className="text-muted-foreground">Weak domains</div>
              <div className="font-medium truncate">{report.weakDomains.join(', ') || '—'}</div>
            </div>
          </div>
        )}
      </Section>

      {/* --- Firebase training sync --- */}
      <Section
        title="Firebase Training Sync"
        desc="Share Sofia's learned intelligence (concepts, ontology, facts, learned items) with every user via Firebase. Personal chat history stays local."
        action={
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input type="checkbox" checked={autoSync} onChange={e => {
              setAutoSync(e.target.checked);
              localStorage.setItem(AUTO_SYNC_KEY, e.target.checked ? '1' : '0');
            }} /> Auto-push every 10m
          </label>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={push} disabled={busy === 'push'}
            className="px-3 py-2 rounded bg-primary text-primary-foreground text-sm flex items-center gap-1.5 disabled:opacity-50">
            <Cloud className="w-4 h-4" /> Push to Firebase
          </button>
          <button onClick={pull} disabled={busy === 'pull'}
            className="px-3 py-2 rounded bg-muted text-sm flex items-center gap-1.5 disabled:opacity-50">
            <CloudDownload className="w-4 h-4" /> Pull from Firebase
          </button>
          {lastSync > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-primary" />
              Last sync: {new Date(lastSync).toLocaleString()}
            </span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground">
          Paths: <code>training/concepts</code> · <code>training/ontology</code> · <code>training/facts</code> · <code>training/learned</code> · <code>training/reasoningTraces</code>
        </div>
      </Section>
    </div>
  );
}
