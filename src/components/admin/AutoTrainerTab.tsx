import { useEffect, useState } from 'react';
import { Brain, Play, Trash2, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Section, Stat } from './Stat';
import {
  getTrainerStatus, setTrainerEnabled, setAutoApply, setInterval_,
  getProposals, runTrainingPass, markApplied, clearProposals,
  type VariantProposal,
} from '../../engine/intelligence/autoTrainer';
import type { useAdmin } from '../../hooks/useAdmin';

type Admin = ReturnType<typeof useAdmin>;

export default function AutoTrainerTab({ admin }: { admin: Admin }) {
  const [status, setStatus] = useState(getTrainerStatus());
  const [proposals, setProposals] = useState<VariantProposal[]>(getProposals());

  useEffect(() => {
    const t = setInterval(() => {
      setStatus(getTrainerStatus());
      setProposals(getProposals());
    }, 3000);
    return () => clearInterval(t);
  }, []);

  function refresh() {
    setStatus(getTrainerStatus());
    setProposals(getProposals());
  }

  function runNow() {
    const found = runTrainingPass({ qaIndex: admin.all.qaData });
    toast.success(`Pass complete · ${found.length} new proposal(s)`);
    refresh();
  }

  async function apply(p: VariantProposal) {
    try {
      await admin.mergeIntoQA(p.resultKey, p.newVariants);
      markApplied(p.resultKey, p.newVariants);
      toast.success(`Merged ${p.newVariants.length} variant(s)`);
      await admin.reload();
      refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Apply failed');
    }
  }

  async function applyAll() {
    const pending = proposals.filter(p => !p.applied);
    if (!pending.length) { toast.info('Nothing pending'); return; }
    for (const p of pending) {
      try {
        await admin.mergeIntoQA(p.resultKey, p.newVariants);
        markApplied(p.resultKey, p.newVariants);
      } catch { /* skip */ }
    }
    toast.success(`Applied ${pending.length} proposal(s)`);
    await admin.reload();
    refresh();
  }

  const pending = proposals.filter(p => !p.applied);
  const applied = proposals.filter(p => p.applied);
  const lastRun = status.lastRunAt
    ? new Date(status.lastRunAt).toLocaleTimeString()
    : '—';

  return (
    <div className="space-y-4 max-w-4xl">
      <Section
        title="Auto Self-Training"
        desc="Sofia নিজে নিজে শেখে — user-এর click pattern থেকে নতুন question variants suggest করে, engine weights tune করে।"
        action={
          <button onClick={runNow} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm flex items-center gap-1.5">
            <Play className="w-4 h-4" /> Run pass now
          </button>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Stat label="Total runs" value={status.totalRuns} />
          <Stat label="Auto-applied" value={status.totalApplied} />
          <Stat label="Pending proposals" value={pending.length} />
          <Stat label="Last run" value={lastRun} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <Toggle
            label="Enable trainer"
            checked={status.enabled}
            onChange={(v) => { setTrainerEnabled(v); refresh(); }}
            hint="Periodic background analysis of feedback events."
          />
          <Toggle
            label="Auto-apply proposals"
            checked={status.autoApply}
            onChange={(v) => { setAutoApply(v); refresh(); }}
            hint="Merge new variants without manual approval."
          />
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Interval</div>
            <select
              value={status.intervalMs}
              onChange={e => { setInterval_(Number(e.target.value)); refresh(); }}
              className="w-full px-2 py-1.5 rounded bg-background border border-border text-sm"
            >
              <option value={30_000}>30 seconds</option>
              <option value={60_000}>1 minute</option>
              <option value={120_000}>2 minutes</option>
              <option value={300_000}>5 minutes</option>
              <option value={900_000}>15 minutes</option>
            </select>
            <div className="text-[10px] text-muted-foreground mt-1">Restart trainer takes effect on next page load.</div>
          </div>
        </div>
      </Section>

      <Section
        title={`Pending Variant Proposals · ${pending.length}`}
        desc="Sofia যেগুলো শেখার সুযোগ পেয়েছে — accept করলে এই query variants existing answer-এর সাথে যুক্ত হবে।"
        action={
          <div className="flex gap-1">
            <button
              onClick={applyAll}
              disabled={!pending.length}
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm flex items-center gap-1.5 disabled:opacity-40"
            >
              <Sparkles className="w-4 h-4" /> Apply all
            </button>
            <button
              onClick={() => { clearProposals(); refresh(); toast.success('Cleared'); }}
              className="px-3 py-1.5 rounded-md bg-muted text-sm flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        }
      >
        {pending.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6 flex flex-col items-center gap-2">
            <Brain className="w-8 h-8 opacity-30" />
            কোনো নতুন proposal নেই। User chat করলে এখানে suggestions আসবে।
          </div>
        ) : (
          <div className="divide-y divide-border border border-border rounded-md max-h-96 overflow-y-auto">
            {pending.map((p, i) => {
              const existing = admin.all.qaData?.[p.resultKey];
              const answer = existing?.answer || '(missing)';
              return (
                <div key={i} className="p-3 text-xs space-y-1.5">
                  <div className="text-muted-foreground truncate"><span className="text-foreground font-medium">A:</span> {answer}</div>
                  <div className="flex flex-wrap gap-1">
                    {p.newVariants.map((v, j) => (
                      <span key={j} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[11px]">{v}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {p.evidenceClicks} click(s) · {new Date(p.proposedAt).toLocaleTimeString()}
                    </span>
                    <button
                      onClick={() => apply(p)}
                      className="px-2.5 py-1 rounded bg-primary text-primary-foreground text-[11px] flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Merge
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {applied.length > 0 && (
        <Section title={`Recently applied · ${applied.length}`}>
          <div className="text-[11px] text-muted-foreground space-y-1 max-h-40 overflow-y-auto">
            {applied.slice(-20).reverse().map((p, i) => (
              <div key={i} className="flex justify-between">
                <span className="truncate">+{p.newVariants.length}: {p.newVariants[0]}</span>
                <span>{new Date(p.proposedAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange, hint }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1 p-2 rounded border border-border bg-card/50 cursor-pointer hover:bg-muted/30">
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="accent-primary" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
    </label>
  );
}
