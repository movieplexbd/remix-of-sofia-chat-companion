/**
 * Phase G — Intelligence Test Panel
 * Runs the intelligence test suite and displays per-engine scores.
 */
import { useState } from 'react';
import { getSharedIntel } from '../../lib/sharedIntel';
import { runIntelligenceTests, type EngineTestResult } from '../../engine/intelligence/intelligenceTests';
import { CheckCircle2, XCircle, AlertCircle, Play } from 'lucide-react';

export default function TestsTab() {
  const [results, setResults] = useState<EngineTestResult[] | null>(null);
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    setTimeout(() => {
      try { setResults(runIntelligenceTests(getSharedIntel())); } finally { setRunning(false); }
    }, 50);
  };

  const overall = results ? results.reduce((a, b) => a + b.score, 0) / results.length : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Intelligence Test Suite</h2>
        <button onClick={run} disabled={running} className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground flex items-center gap-1.5 disabled:opacity-50">
          <Play className="w-3 h-3" /> {running ? 'Running…' : 'Run Tests'}
        </button>
      </div>

      {results && (
        <div className="rounded-lg border border-border bg-card/40 p-3">
          <div className="text-sm">
            Overall: <span className={`font-semibold ${overall >= 0.8 ? 'text-emerald-500' : overall >= 0.5 ? 'text-amber-500' : 'text-red-500'}`}>
              {(overall * 100 | 0)}%
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${overall * 100}%` }} />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {(results || []).map(r => (
          <div key={r.engine} className="rounded-lg border border-border bg-card/40 p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium flex items-center gap-1.5">
                {r.score >= 0.8 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                 : r.score >= 0.5 ? <AlertCircle className="w-4 h-4 text-amber-500" />
                 : <XCircle className="w-4 h-4 text-red-500" />}
                {r.engine}
              </div>
              <span className="text-xs text-muted-foreground">{r.passed}/{r.total}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1">
              <div className={`h-full ${r.score >= 0.8 ? 'bg-emerald-500' : r.score >= 0.5 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${r.score * 100}%` }} />
            </div>
            {r.notes.length > 0 && (
              <div className="text-[11px] text-muted-foreground mt-1">{r.notes.join(' · ')}</div>
            )}
          </div>
        ))}
      </div>

      {!results && !running && (
        <div className="text-sm text-muted-foreground italic">Click "Run Tests" to evaluate each intelligence engine.</div>
      )}
    </div>
  );
}
