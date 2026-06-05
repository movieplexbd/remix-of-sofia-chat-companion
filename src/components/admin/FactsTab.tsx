/**
 * Facts Manager — Manage facts and detect contradictions
 * Phase 22 — Contradiction Detector
 */
import { useState, useMemo } from 'react';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getSharedIntel } from '../../lib/sharedIntel';

export default function FactsTab() {
  const intel = getSharedIntel();
  const [newEntity, setNewEntity] = useState('');
  const [newAttribute, setNewAttribute] = useState('');
  const [newValue, setNewValue] = useState('');
  const [filter, setFilter] = useState('');
  const [showConflicts, setShowConflicts] = useState(false);

  const facts = intel.facts.list();
  const conflicts = intel.facts.conflicts();

  const filtered = useMemo(() => {
    if (!filter.trim()) return facts;
    const t = filter.toLowerCase();
    return facts.filter(f =>
      f.entity.toLowerCase().includes(t) ||
      f.attribute.toLowerCase().includes(t) ||
      f.value.toLowerCase().includes(t)
    );
  }, [facts, filter]);

  function addFact() {
    const entity = newEntity.trim();
    const attribute = newAttribute.trim();
    const value = newValue.trim();

    if (!entity || !attribute || !value) {
      toast.error('All fields required');
      return;
    }

    try {
      intel.addFact(entity, attribute, value, 'manual', 0.9);
      setNewEntity('');
      setNewAttribute('');
      setNewValue('');
      toast.success('Fact added');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add');
    }
  }

  function deleteFact(id: string) {
    if (!confirm('Delete this fact?')) return;
    try {
      // Note: ContradictionStore doesn't have a delete method, so we mark as resolved
      intel.facts.resolve(id);
      toast.success('Fact resolved');
    } catch (e: any) {
      toast.error(e?.message);
    }
  }

  function resolveConflict(factId: string) {
    try {
      intel.facts.resolve(factId);
      toast.success('Conflict resolved');
    } catch (e: any) {
      toast.error(e?.message);
    }
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h2 className="text-lg font-semibold mb-3">Facts & Contradictions Manager</h2>
        <p className="text-sm text-muted-foreground mb-4">Manage facts and detect contradictions. Sofia uses these to maintain knowledge consistency.</p>
      </div>

      <div className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
        <div className="text-sm font-medium">Add New Fact</div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2">
          <input
            value={newEntity}
            onChange={e => setNewEntity(e.target.value)}
            placeholder="Entity (e.g. 'Bangladesh')"
            className="px-3 py-2 rounded-md bg-background border border-border text-sm"
          />
          <input
            value={newAttribute}
            onChange={e => setNewAttribute(e.target.value)}
            placeholder="Attribute (e.g. 'capital')"
            className="px-3 py-2 rounded-md bg-background border border-border text-sm"
          />
          <input
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            placeholder="Value (e.g. 'Dhaka')"
            className="px-3 py-2 rounded-md bg-background border border-border text-sm"
          />
          <button
            onClick={addFact}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm whitespace-nowrap"
          >
            Add Fact
          </button>
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-destructive font-medium">
            <AlertTriangle className="w-4 h-4" />
            {conflicts.length} Contradiction{conflicts.length !== 1 ? 's' : ''} Detected
          </div>
          <div className="space-y-2 max-h-[40vh] overflow-y-auto">
            {conflicts.map((conflict, i) => (
              <div key={i} className="rounded bg-background/50 p-2 text-xs space-y-1">
                <div className="font-semibold">{conflict.entity} → {conflict.attribute}</div>
                <div className="space-y-1">
                  {conflict.facts.map(f => (
                    <div key={f.id} className="flex items-center justify-between px-2 py-1 bg-background rounded border border-border/50">
                      <span>
                        <span className="font-mono">{f.value}</span>
                        <span className="text-muted-foreground ml-2">({(f.confidence * 100 | 0)}% · {f.source})</span>
                      </span>
                      <button
                        onClick={() => resolveConflict(f.id)}
                        className="p-1 rounded hover:bg-destructive/10 text-destructive"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter by entity, attribute, or value…"
            className="flex-1 px-3 py-2 rounded-md bg-background border border-border text-sm"
          />
          <button
            onClick={() => setShowConflicts(!showConflicts)}
            className="ml-2 px-3 py-2 rounded-md bg-muted text-sm text-xs"
          >
            {showConflicts ? 'All' : 'Conflicts Only'}
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-border border border-border rounded-md">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">No facts found.</div>
          ) : (
            filtered
              .filter(f => !showConflicts || !f.resolved)
              .map(fact => (
                <div key={fact.id} className="p-3 flex flex-col md:flex-row md:items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-semibold">{fact.entity}</span>
                      <span className="text-muted-foreground"> → </span>
                      <span className="font-semibold">{fact.attribute}</span>
                      <span className="text-muted-foreground"> = </span>
                      <span className="font-mono">{fact.value}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {fact.source} · {(fact.confidence * 100 | 0)}% · {new Date(fact.ts).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteFact(fact.id)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card/40 p-3 text-xs text-muted-foreground space-y-1">
        <div className="font-medium text-foreground">Tips:</div>
        <div>• Facts are stored in localStorage (Phase 22 — Contradiction Detector)</div>
        <div>• Conflicts are automatically detected when same (entity, attribute) has different values</div>
        <div>• Mark facts as resolved to dismiss contradictions</div>
        <div>• Confidence scores (0-1) indicate how certain Sofia is about the fact</div>
      </div>
    </div>
  );
}
