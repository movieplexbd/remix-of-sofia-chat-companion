/**
 * Phase B — Admin Mind Dashboard
 * Inferred Facts • Knowledge Gaps • Hypotheses • Weak Domains • Learning Queue
 */
import { useMemo, useState } from 'react';
import { getSharedIntel } from '../../lib/sharedIntel';
import { generateHypothesis } from '../../engine/intelligence/hypothesisEngine';
import { Brain, AlertCircle, Lightbulb, Activity, BookOpen, RefreshCw, Zap, ShieldCheck, Search, MessageSquare } from 'lucide-react';
import { runImprovementNow, lastReport } from '../../engine/intelligence/autonomousImprovement';

export default function MindTab() {
  const intel = getSharedIntel();
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  const data = useMemo(() => {
    const inferred = intel.inference.list().slice(-50).reverse();
    const gaps = intel.curiosity.list().slice(-50).reverse();
    const weak = intel.meta.detectWeakAreas(0.7);
    const learned = intel.active.learnedList().slice(-30).reverse();
    const pending = intel.active.pendingList().slice(-30).reverse();
    const concepts = intel.concepts.list().slice(0, 30);
    const hyps = generateHypothesis(
      concepts.map(c => ({ key: `concept:${c.id}`, weight: c.aliases.length / 10 })),
    ).slice(0, 12);
    const traces = intel.getReasoningTraces();
    const stats = intel.getFeedbackStats();
    const goals = intel.getDiagnostics().memory.depth > 0 ? (intel as any).getPersistentGoals?.() || [] : [];
    return { inferred, gaps, weak, learned, pending, hyps, traces, stats, goals };
  }, [intel, tick]);

  const report = lastReport();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" /> Mind Dashboard
        </h2>
        <div className="flex gap-2">
          <button onClick={() => { runImprovementNow(intel); refresh(); }} className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3" /> Run Improvement
          </button>
          <button onClick={refresh} className="px-3 py-1.5 text-xs rounded-md bg-muted">Refresh</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card icon={<Brain className="w-4 h-4" />} title="Inferred Facts" count={data.inferred.length}>
          <List items={data.inferred.map(f => `${f.a} → ${f.b}  (${(f.confidence * 100 | 0)}%)`)} />
        </Card>

        <Card icon={<AlertCircle className="w-4 h-4 text-yellow-500" />} title="Knowledge Gaps" count={data.gaps.length}>
          <List items={data.gaps.map(g => `${g.topic}  · asked ${g.asked}×`)} />
        </Card>

        <Card icon={<Lightbulb className="w-4 h-4 text-amber-500" />} title="Hypotheses" count={data.hyps.length}>
          <List items={data.hyps.map(h => `${(h.probability * 100 | 0)}%  · ${h.statement}`)} />
        </Card>

        <Card icon={<Activity className="w-4 h-4 text-red-500" />} title="Weak Domains" count={data.weak.length}>
          <List items={data.weak.map(d => `${d.domain}  · ${(d.confidence * 100 | 0)}% (${d.samples} samples)`)} />
        </Card>

        <Card icon={<BookOpen className="w-4 h-4 text-emerald-500" />} title="Learning Queue (Pending)" count={data.pending.length}>
          <List items={data.pending.map(p => p.question)} />
        </Card>

        <Card icon={<BookOpen className="w-4 h-4 text-emerald-700" />} title="Learned Facts" count={data.learned.length}>
          <List items={data.learned.map(l => `${l.topic} → ${l.content}`)} />
        </Card>

        <Card icon={<Activity className="w-4 h-4 text-indigo-500" />} title="Reasoning Traces" count={data.traces.length}>
          <div className="space-y-2 p-1">
            {data.traces.map((t, i) => (
              <div key={i} className="p-2 rounded bg-background/40 border border-border/50 text-[10px] space-y-1">
                <div className="font-medium flex items-center gap-1"><Search className="w-3 h-3"/> {t.query}</div>
                <div className="text-muted-foreground flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500"/> Intent: {t.trace?.intent}</div>
                {t.trace?.decision && (
                  <div className="mt-1 pt-1 border-t border-border/30">
                    <div className="text-emerald-500 font-medium">Decision: {t.trace.decision.recommendation}</div>
                    <div className="text-muted-foreground italic">Conf: {(t.trace.decision.confidence * 100).toFixed(0)}%</div>
                  </div>
                )}
                {t.trace?.reflection && (
                  <div className="flex gap-1 flex-wrap mt-1">
                    {t.trace.reflection.warnings.map((w: string, j: number) => (
                      <span key={j} className="px-1 rounded bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">{w}</span>
                    ))}
                    {t.trace.reflection.issues.map((iss: string, j: number) => (
                      <span key={j} className="px-1 rounded bg-red-500/10 text-red-600 border border-red-500/20">{iss}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />} title="Active Goals" count={data.goals.length}>
          <div className="space-y-2 p-1">
            {data.goals.map((g: any, i: number) => (
              <div key={i} className="p-2 rounded bg-background/40 border border-border/50 text-[10px]">
                <div className="font-medium flex items-center gap-1"><Zap className="w-3 h-3 text-primary"/> {g.goal}</div>
                <div className="text-muted-foreground mt-1">
                  {g.milestones?.map((m: any, j: number) => (
                    <div key={j} className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${m.completed ? 'bg-emerald-500' : 'bg-muted'}`} />
                      {m.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card icon={<Zap className="w-4 h-4 text-blue-500" />} title="Feedback Loop" count={data.stats.total}>
          <div className="space-y-2 p-2">
            <div className="flex justify-between text-[10px] text-muted-foreground uppercase">
              <span>Success Rate</span>
              <span>{(data.stats.successRate * 100).toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${data.stats.successRate * 100}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-center">
                <div className="text-lg font-bold text-emerald-600">{data.stats.success}</div>
                <div className="text-[10px] text-muted-foreground">Helpful</div>
              </div>
              <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-center">
                <div className="text-lg font-bold text-red-600">{data.stats.failure}</div>
                <div className="text-[10px] text-muted-foreground">Not Helpful</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {report && (
        <div className="rounded-lg border border-border bg-card/40 p-3 text-xs">
          <div className="font-medium mb-1">Last Autonomous Improvement</div>
          <div className="text-muted-foreground">
            {new Date(report.ts).toLocaleString()} · inferred {report.inferred} · merged {report.duplicatesMerged} · stale {report.staleRemoved} · weak [{report.weakDomains.join(', ')}]
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ icon, title, count, children }: { icon: React.ReactNode; title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium flex items-center gap-1.5">{icon}{title}</div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{count}</span>
      </div>
      <div className="max-h-56 overflow-y-auto">{children}</div>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  if (!items.length) return <div className="text-xs text-muted-foreground italic">No data yet.</div>;
  return (
    <ul className="space-y-1 text-xs">
      {items.map((s, i) => <li key={i} className="px-2 py-1 rounded bg-background/40 border border-border/50">{s}</li>)}
    </ul>
  );
}
