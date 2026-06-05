/**
 * Concepts Manager — Manage semantic concepts and their aliases
 * Concepts help Sofia understand related terms and expand queries
 */
import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { getSharedIntel } from '../../lib/sharedIntel';

export default function ConceptsTab() {
  const intel = getSharedIntel();
  const [newId, setNewId] = useState('');
  const [newAliases, setNewAliases] = useState('');
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAliases, setEditAliases] = useState('');

  const concepts = intel.concepts.list();
  const filtered = useMemo(() => {
    if (!filter.trim()) return concepts;
    const t = filter.toLowerCase();
    return concepts.filter(c =>
      c.id.toLowerCase().includes(t) ||
      c.aliases.some(a => a.toLowerCase().includes(t))
    );
  }, [concepts, filter]);

  function addConcept() {
    const id = newId.trim().toLowerCase();
    if (!id) { toast.error('Concept ID required'); return; }
    if (concepts.some(c => c.id === id)) { toast.error('Concept ID already exists'); return; }

    const aliases = newAliases
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);

    if (!aliases.length) { toast.error('At least one alias required'); return; }

    try {
      intel.concepts.add(id, aliases);
      setNewId('');
      setNewAliases('');
      toast.success('Concept added');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add');
    }
  }

  function deleteConcept(id: string) {
    if (!confirm(`Delete concept "${id}"?`)) return;
    try {
      intel.concepts.remove(id);
      toast.success('Concept deleted');
    } catch (e: any) {
      toast.error(e?.message);
    }
  }

  function saveEdit(id: string) {
    const aliases = editAliases
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);

    if (!aliases.length) { toast.error('At least one alias required'); return; }

    try {
      intel.concepts.remove(id);
      intel.concepts.add(id, aliases);
      setEditingId(null);
      toast.success('Saved');
    } catch (e: any) {
      toast.error(e?.message);
    }
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h2 className="text-lg font-semibold mb-3">Semantic Concepts Manager</h2>
        <p className="text-sm text-muted-foreground mb-4">Define semantic concepts with their aliases. Sofia uses these to expand queries and understand related terms.</p>
      </div>

      <div className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
        <div className="text-sm font-medium">Add New Concept</div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2">
          <input
            value={newId}
            onChange={e => setNewId(e.target.value)}
            placeholder="Concept ID (e.g. 'vehicle')"
            className="px-3 py-2 rounded-md bg-background border border-border text-sm"
          />
          <input
            value={newAliases}
            onChange={e => setNewAliases(e.target.value)}
            placeholder="Aliases (comma-separated: car, automobile, vehicle)"
            className="px-3 py-2 rounded-md bg-background border border-border text-sm"
          />
          <button
            onClick={addConcept}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card/40 p-4">
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter by concept or alias…"
          className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm mb-3"
        />

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-border border border-border rounded-md">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">No concepts found.</div>
          ) : (
            filtered.map(concept => {
              const isEditing = editingId === concept.id;
              return (
                <div key={concept.id} className="p-3 flex flex-col md:flex-row md:items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-semibold">{concept.id}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-1 mt-1">
                      {concept.aliases.map((a, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">{a}</span>
                      ))}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="flex gap-1 md:flex-row flex-col w-full md:w-auto">
                      <input
                        value={editAliases}
                        onChange={e => setEditAliases(e.target.value)}
                        className="flex-1 px-2 py-1 rounded bg-background border border-border text-xs"
                      />
                      <button
                        onClick={() => saveEdit(concept.id)}
                        className="p-1.5 rounded bg-primary text-primary-foreground"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded hover:bg-muted"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditingId(concept.id); setEditAliases(concept.aliases.join(', ')); }}
                        className="p-1.5 rounded hover:bg-muted"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteConcept(concept.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card/40 p-3 text-xs text-muted-foreground space-y-1">
        <div className="font-medium text-foreground">Tips:</div>
        <div>• Create concepts for semantic domains: "vehicle" → car, automobile, transport</div>
        <div>• Use lowercase IDs for consistency</div>
        <div>• Concepts are used in Phase 17 for query expansion</div>
        <div>• Multiple aliases help Sofia understand user intent better</div>
      </div>
    </div>
  );
}
