import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Plus, X, ClipboardList, CheckSquare, GripVertical } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ChecklistItem {
  id: string;
  label: string;
}

interface Setup {
  id: string;
  name: string;
  description: string;
  rules: string;
  checklist: ChecklistItem[];
}

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11);
}

export default function Setups() {
  const [setups, setSetups] = useState<Setup[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentSetup, setCurrentSetup] = useState<Setup | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');

  const { toast } = useToast();

  const fetchSetups = async () => {
    try {
      const response = await api.get('/setups');
      setSetups(response.data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load setups.",
      });
    }
  };

  useEffect(() => {
    fetchSetups();
  }, []);

  const addChecklistItem = () => {
    if (!newItemText.trim()) return;
    setChecklist(prev => [...prev, { id: generateId(), label: newItemText.trim() }]);
    setNewItemText('');
  };

  const removeChecklistItem = (id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/setups', { name, description, rules, checklist });
      toast({ title: "Success", description: "Setup created successfully." });
      setIsAddOpen(false);
      resetForm();
      fetchSetups();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to create setup." });
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSetup) return;
    setLoading(true);
    try {
      await api.put(`/setups/${currentSetup.id}`, { name, description, rules, checklist });
      toast({ title: "Success", description: "Setup updated successfully." });
      setIsEditOpen(false);
      resetForm();
      fetchSetups();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to update setup." });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!currentSetup) return;
    setLoading(true);
    try {
      await api.delete(`/setups/${currentSetup.id}`);
      toast({ title: "Success", description: "Setup deleted successfully." });
      setIsDeleteOpen(false);
      resetForm();
      fetchSetups();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to delete setup." });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setRules('');
    setChecklist([]);
    setNewItemText('');
    setCurrentSetup(null);
  };

  const openEdit = (setup: Setup) => {
    setCurrentSetup(setup);
    setName(setup.name);
    setDescription(setup.description || '');
    setRules(setup.rules || '');
    setChecklist(Array.isArray(setup.checklist) ? setup.checklist : []);
    setNewItemText('');
    setIsEditOpen(true);
  };

  const openDelete = (setup: Setup) => {
    setCurrentSetup(setup);
    setIsDeleteOpen(true);
  };

  const ChecklistBuilder = () => (
    <div className="space-y-3">
      <Label className="flex items-center gap-2 text-sm font-bold">
        <ClipboardList className="w-4 h-4 text-primary" />
        Checklist Items
        <span className="text-xs text-muted-foreground font-normal ml-1">
          (Trade entry তে checkbox হিসেবে আসবে)
        </span>
      </Label>
      
      <div className="bg-muted/20 rounded-xl border border-border p-3 space-y-2">
        {checklist.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-4 italic">
            No checklist items yet. Add items below.
          </p>
        )}
        {checklist.map((item, index) => (
          <div 
            key={item.id} 
            className="flex items-center gap-2 bg-card rounded-lg px-3 py-2.5 border border-border shadow-sm group hover:border-primary/20 transition-colors"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
            <CheckSquare className="w-4 h-4 text-primary/50 shrink-0" />
            <span className="text-sm font-medium text-foreground/80 flex-1">{item.label}</span>
            <button
              type="button"
              onClick={() => removeChecklistItem(item.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        <div className="flex gap-2 pt-1">
          <Input
            placeholder="e.g. Liquidity swept before entry?"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }}
            className="flex-1 bg-card border-border text-sm"
          />
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={addChecklistItem}
            disabled={!newItemText.trim()}
            className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 shrink-0"
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Setups</h2>
          <p className="text-muted-foreground">Manage your trading strategies, setups, and checklists.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Setup</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add New Setup</DialogTitle></DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label>Setup Name</Label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Liquidity Sweep → OB Entry" />
              </div>
              <div className="grid gap-2">
                <Label>Description (Optional)</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. After liquidity sweep, impulsive move, trade from OB" />
              </div>
              <div className="grid gap-2">
                <Label>Setup Rules & Strategy</Label>
                <Textarea rows={4} value={rules} onChange={(e) => setRules(e.target.value)} placeholder="Enter the rules for this setup..." />
              </div>
              
              <ChecklistBuilder />
              
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Create Setup'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Setup Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {setups.map((setup) => {
          const checklistItems = Array.isArray(setup.checklist) ? setup.checklist : [];
          return (
            <div 
              key={setup.id} 
              className="bg-card/80 dark:bg-card/90 backdrop-blur-xl rounded-2xl border border-border shadow-sm dark:shadow-none p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-base text-foreground">{setup.name}</h3>
                  {setup.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{setup.description}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(setup)}>
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => openDelete(setup)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {checklistItems.length > 0 && (
                <div className="space-y-1.5 mt-3 pt-3 border-t border-border/50">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" />
                    Checklist ({checklistItems.length} items)
                  </span>
                  {checklistItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckSquare className="w-3.5 h-3.5 text-primary/40 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                  {checklistItems.length > 5 && (
                    <span className="text-xs text-muted-foreground pl-5">+{checklistItems.length - 5} more...</span>
                  )}
                </div>
              )}

              {checklistItems.length === 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <span className="text-xs text-muted-foreground italic">No checklist items</span>
                </div>
              )}
            </div>
          );
        })}
        {setups.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground bg-card/50 dark:bg-card/50 rounded-2xl border border-dashed">
            No setups found. Create one to get started.
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if(!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Setup</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label>Setup Name</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Description (Optional)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Setup Rules & Strategy</Label>
              <Textarea rows={4} value={rules} onChange={(e) => setRules(e.target.value)} placeholder="Enter the rules for this setup..." />
            </div>
            
            <ChecklistBuilder />
            
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Updating...' : 'Update Setup'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { setIsDeleteOpen(open); if(!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Setup</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-muted-foreground">Are you sure you want to delete the setup <strong className="text-foreground">{currentSetup?.name}</strong>? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteSubmit} disabled={loading}>{loading ? 'Deleting...' : 'Delete'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
