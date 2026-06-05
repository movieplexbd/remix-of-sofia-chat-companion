import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function CharactersTab({ admin }: { admin: any }) {
  const [newName, setNewName] = useState('');
  const chars = admin.all.characters || {};

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await admin.updatePath('characters', {
        ...chars,
        [Date.now().toString()]: { name: newName.trim() }
      });
      setNewName('');
      toast.success('Character added');
    } catch (e) {
      toast.error('Failed to add character');
    }
  };

  const handleDelete = async (id: string) => {
    const next = { ...chars };
    delete next[id];
    try {
      await admin.updatePath('characters', next);
      toast.success('Character removed');
    } catch (e) {
      toast.error('Failed to remove character');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Character</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              placeholder="e.g. গার্লফেন্ড" 
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <Button onClick={handleAdd}><Plus className="w-4 h-4 mr-2" /> Add</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(chars).map(([id, char]: [string, any]) => (
          <Card key={id}>
            <CardContent className="pt-6 flex justify-between items-center">
              <Input 
                value={char.name} 
                onChange={async (e) => {
                  const val = e.target.value;
                  await admin.updatePath(`characters/${id}`, { name: val });
                }}
                className="border-none bg-transparent font-medium focus-visible:ring-0 shadow-none"
              />
              <Button variant="ghost" size="icon" onClick={() => handleDelete(id)} className="text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
