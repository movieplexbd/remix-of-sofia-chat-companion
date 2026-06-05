/**
 * Phase C — Knowledge Graph Visualizer
 * Search entity, expand relations, inspect categories & attributes.
 */
import { useMemo, useState } from 'react';
import { getSharedIntel } from '../../lib/sharedIntel';
import { Search, ChevronRight, Network } from 'lucide-react';

export default function GraphTab() {
  const intel = getSharedIntel();
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const nodes = intel.graph.serialize();
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return nodes.slice(0, 60);
    return nodes.filter(n =>
      n.name.toLowerCase().includes(t) ||
      n.categories.some(c => c.toLowerCase().includes(t)) ||
      n.relations.some(r => r.toLowerCase().includes(t))
    ).slice(0, 60);
  }, [q, nodes]);

  const node = selected ? intel.graph.get(selected) : null;
  const reach = selected ? intel.graph.traverse(selected, 2) : [];
  const inferredLinks = selected ? intel.inference.createIndirectLinks(selected) : [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Network className="w-5 h-5 text-primary" /> Knowledge Graph Explorer
      </h2>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search entity, category, relation…"
          className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background text-sm"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card/40 p-2 max-h-[60vh] overflow-y-auto">
          <div className="text-xs font-medium mb-2 px-1 text-muted-foreground">
            Entities ({filtered.length}/{nodes.length})
          </div>
          <ul className="space-y-0.5">
            {filtered.map(n => (
              <li key={n.name}>
                <button
                  onClick={() => setSelected(n.name)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs text-left hover:bg-muted ${selected === n.name ? 'bg-primary/10 text-primary' : ''}`}
                >
                  <span>{n.name}</span>
                  <span className="text-[10px] text-muted-foreground">{n.relations.length}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 rounded-lg border border-border bg-card/40 p-3">
          {!node ? (
            <div className="text-sm text-muted-foreground italic">Select an entity to inspect.</div>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs uppercase text-muted-foreground">Entity</div>
                <div className="text-lg font-semibold">{node.name}</div>
              </div>
              <Field label="Categories" items={node.categories} />
              <Field label="Direct Relations" items={node.relations} onClick={setSelected} />
              <Field label="Attributes" items={Object.entries(node.attributes).map(([k, v]) => `${k}: ${v}`)} />

              <div>
                <div className="text-xs uppercase text-muted-foreground mb-1">2-Hop Reach</div>
                <div className="flex flex-wrap gap-1">
                  {reach.slice(1).map(n2 => (
                    <button key={n2.name} onClick={() => setSelected(n2.name)} className="px-2 py-0.5 rounded-full bg-muted text-[11px] flex items-center gap-1 hover:bg-primary/10">
                      <ChevronRight className="w-3 h-3" /> {n2.name}
                    </button>
                  ))}
                  {reach.length <= 1 && <span className="text-xs text-muted-foreground italic">No reachable nodes.</span>}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase text-muted-foreground mb-1">Inferred (Indirect) Links</div>
                <div className="flex flex-wrap gap-1">
                  {inferredLinks.map(l => (
                    <span key={l} className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[11px]">{l}</span>
                  ))}
                  {!inferredLinks.length && <span className="text-xs text-muted-foreground italic">No inferences yet — run "Run Improvement" on Mind tab.</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, items, onClick }: { label: string; items: string[]; onClick?: (s: string) => void }) {
  return (
    <div>
      <div className="text-xs uppercase text-muted-foreground mb-1">{label}</div>
      <div className="flex flex-wrap gap-1">
        {items.length ? items.map((x, i) => (
          onClick
            ? <button key={i} onClick={() => onClick(x)} className="px-2 py-0.5 rounded-full bg-muted text-[11px] hover:bg-primary/10">{x}</button>
            : <span key={i} className="px-2 py-0.5 rounded-full bg-muted text-[11px]">{x}</span>
        )) : <span className="text-xs text-muted-foreground italic">—</span>}
      </div>
    </div>
  );
}
