/**
 * Ontology Manager — Manage hierarchical category structure
 * Add/edit/delete nodes, set parent-child relationships
 */
import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { getSharedIntel } from '../../lib/sharedIntel';

export default function OntologyTab() {
  const intel = getSharedIntel();
  const [newId, setNewId] = useState('');
  const [newParent, setNewParent] = useState('thing');
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editParent, setEditParent] = useState('');

  const nodes = intel.ontology.list();
  const filtered = useMemo(() => {
    if (!filter.trim()) return nodes;
    const t = filter.toLowerCase();
    return nodes.filter(n => n.id.toLowerCase().includes(t) || (n.parentId && n.parentId.toLowerCase().includes(t)));
  }, [nodes, filter]);

  function addNode() {
    const id = newId.trim().toLowerCase();
    if (!id) { toast.error('ID required'); return; }
    if (nodes.some(n => n.id === id)) { toast.error('ID already exists'); return; }
    try {
      intel.ontology.add({
        id,
        parentId: newParent || null,
        type: 'category',
      });
      setNewId('');
      setNewParent('thing');
      toast.success('Node added');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add');
    }
  }

  function deleteNode(id: string) {
    if (!confirm(`Delete "${id}"?`)) return;
    try {
      intel.ontology.remove(id);
      toast.success('Node deleted');
    } catch (e: any) {
      toast.error(e?.message);
    }
  }

  function saveEdit(id: string) {
    try {
      const node = intel.ontology.get(id);
      if (node) {
        intel.ontology.remove(id);
        intel.ontology.add({ ...node, parentId: editParent || null });
        setEditingId(null);
        toast.success('Saved');
      }
    } catch (e: any) {
      toast.error(e?.message);
    }
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h2 className="text-lg font-semibold mb-3">Ontology Manager</h2>
        <p className="text-sm text-muted-foreground mb-4">Manage hierarchical category structure. Parent-child relationships help Sofia understand category relationships.</p>
      </div>

      <div className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
        <div className="text-sm font-medium">Add New Node</div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
          <input
            value={newId}
            onChange={e => setNewId(e.target.value)}
            placeholder="Node ID (e.g. 'smartphone')"
            className="px-3 py-2 rounded-md bg-background border border-border text-sm"
          />
          <select
            value={newParent}
            onChange={e => setNewParent(e.target.value)}
            className="px-3 py-2 rounded-md bg-background border border-border text-sm"
          >
            <option value="">None (Root)</option>
            {nodes.map(n => (
              <option key={n.id} value={n.id}>{n.id}</option>
            ))}
          </select>
          <button
            onClick={addNode}
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
          placeholder="Filter by ID or parent…"
          className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm mb-3"
        />

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-border border border-border rounded-md">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">No nodes found.</div>
          ) : (
            filtered.map(node => {
              const isEditing = editingId === node.id;
              return (
                <div key={node.id} className="p-3 flex flex-col md:flex-row md:items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-semibold">{node.id}</div>
                    <div className="text-xs text-muted-foreground">
                      {node.parentId ? `Parent: ${node.parentId}` : 'Root node'}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="flex gap-1 md:flex-row flex-col">
                      <select
                        value={editParent}
                        onChange={e => setEditParent(e.target.value)}
                        className="px-2 py-1 rounded bg-background border border-border text-xs"
                      >
                        <option value="">None (Root)</option>
                        {nodes.filter(n => n.id !== node.id).map(n => (
                          <option key={n.id} value={n.id}>{n.id}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => saveEdit(node.id)}
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
                        onClick={() => { setEditingId(node.id); setEditParent(node.parentId || ''); }}
                        className="p-1.5 rounded hover:bg-muted"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteNode(node.id)}
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
        <div>• Create a hierarchy: "thing" → "animal" → "mammal" → "lion"</div>
        <div>• Use lowercase IDs for consistency</div>
        <div>• Parent-child relationships improve query understanding</div>
      </div>
    </div>
  );
}
