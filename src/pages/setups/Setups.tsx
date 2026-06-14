import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2 } from 'lucide-react';

import { Textarea } from '@/components/ui/textarea';

interface Setup {
  id: string;
  name: string;
  description: string;
  rules: string;
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

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/setups', { name, description, rules });
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
      await api.put(`/setups/${currentSetup.id}`, { name, description, rules });
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
    setCurrentSetup(null);
  };

  const openEdit = (setup: Setup) => {
    setCurrentSetup(setup);
    setName(setup.name);
    setDescription(setup.description || '');
    setRules(setup.rules || '');
    setIsEditOpen(true);
  };

  const openDelete = (setup: Setup) => {
    setCurrentSetup(setup);
    setIsDeleteOpen(true);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Setups</h2>
          <p className="text-muted-foreground">Manage your trading strategies and setups.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>+ Add Setup</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Setup</DialogTitle></DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label>Setup Name</Label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. SMC Concept" />
              </div>
              <div className="grid gap-2">
                <Label>Description (Optional)</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Break of structure & order block" />
              </div>
              <div className="grid gap-2">
                <Label>Setup Rules & Strategy</Label>
                <Textarea rows={6} value={rules} onChange={(e) => setRules(e.target.value)} placeholder="Enter the rules for this setup. When should you take the trade? What are the entry/exit conditions?" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Create Setup'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Setup Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {setups.map((setup) => (
              <TableRow key={setup.id}>
                <TableCell className="font-medium text-primary">{setup.name}</TableCell>
                <TableCell className="text-muted-foreground">{setup.description || '-'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="icon" onClick={() => openEdit(setup)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => openDelete(setup)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {setups.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">No setups found. Create one to get started.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if(!open) resetForm(); }}>
        <DialogContent>
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
              <Textarea rows={6} value={rules} onChange={(e) => setRules(e.target.value)} placeholder="Enter the rules for this setup. When should you take the trade? What are the entry/exit conditions?" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Updating...' : 'Update Setup'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { setIsDeleteOpen(open); if(!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Setup</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-muted-foreground">Are you sure you want to delete the setup <strong className="text-black">{currentSetup?.name}</strong>? This action cannot be undone.</p>
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
