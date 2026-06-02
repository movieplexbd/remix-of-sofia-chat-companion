import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function SlidesTab({ admin }: { admin: any }) {
  const [formData, setFormData] = useState({
    heading: '',
    image1: '',
    image2: '',
    memoryData: ''
  });
  const slides = admin.all.slides || {};

  const handleAdd = async () => {
    if (!formData.heading || !formData.image1 || !formData.image2) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      await admin.updatePath('slides', {
        ...slides,
        [Date.now().toString()]: formData
      });
      setFormData({ heading: '', image1: '', image2: '', memoryData: '' });
      toast.success('Slide added');
    } catch (e) {
      toast.error('Failed to add slide');
    }
  };

  const handleDelete = async (id: string) => {
    const next = { ...slides };
    delete next[id];
    try {
      await admin.updatePath('slides', next);
      toast.success('Slide removed');
    } catch (e) {
      toast.error('Failed to remove slide');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Slide Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input 
            placeholder="Heading (e.g. Choose Your Vibe)" 
            value={formData.heading}
            onChange={e => setFormData({...formData, heading: e.target.value})}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              placeholder="Image 1 URL" 
              value={formData.image1}
              onChange={e => setFormData({...formData, image1: e.target.value})}
            />
            <Input 
              placeholder="Image 2 URL" 
              value={formData.image2}
              onChange={e => setFormData({...formData, image2: e.target.value})}
            />
          </div>
          <Textarea 
            placeholder="Memory Data (What the bot should remember when this is selected)" 
            value={formData.memoryData}
            onChange={e => setFormData({...formData, memoryData: e.target.value})}
          />
          <Button onClick={handleAdd} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add Slide Section</Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(slides).map(([id, slide]: [string, any]) => (
          <Card key={id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold">{slide.heading}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(id)} className="text-destructive h-8 w-8">
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <img src={slide.image1} alt="Preview 1" className="h-20 w-full object-cover rounded" />
                <img src={slide.image2} alt="Preview 2" className="h-20 w-full object-cover rounded" />
              </div>
              <p className="text-xs text-muted-foreground truncate">Memory: {slide.memoryData}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
