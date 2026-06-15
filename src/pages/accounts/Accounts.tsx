import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

interface Account {
  id: string;
  accountName: string;
  brokerName: string;
  startingBalance: number;
  currentBalance: number;
  accountType: string;
  currency: string;
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  
  // Form state
  const [accountName, setAccountName] = useState('');
  const [brokerName, setBrokerName] = useState('');
  const [startingBalance, setStartingBalance] = useState('');
  const [accountType, setAccountType] = useState('Personal');
  const [currency, setCurrency] = useState('USD');

  const { toast } = useToast();

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching accounts",
        description: error.response?.data?.message || "Failed to load accounts",
      });
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/accounts', {
        accountName,
        brokerName,
        startingBalance: parseFloat(startingBalance),
        accountType,
        currency
      });
      toast({
        title: "Success",
        description: "Account created successfully",
      });
      setIsOpen(false);
      fetchAccounts();
      resetForm();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to create account",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccountId) return;
    setLoading(true);
    try {
      await api.put(`/accounts/${editingAccountId}`, {
        accountName,
        brokerName,
        startingBalance: parseFloat(startingBalance),
        accountType,
        currency
      });
      toast({
        title: "Success",
        description: "Account updated successfully",
      });
      setIsEditOpen(false);
      fetchAccounts();
      resetForm();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update account",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      await api.delete(`/accounts/${id}`);
      toast({ title: 'Success', description: 'Account deleted successfully' });
      fetchAccounts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting account",
        description: error.response?.data?.message || "Failed to delete account",
      });
    }
  };

  const openEditModal = (account: Account) => {
    setEditingAccountId(account.id);
    setAccountName(account.accountName);
    setBrokerName(account.brokerName || '');
    setStartingBalance(String(account.startingBalance));
    setAccountType(account.accountType || 'Personal');
    setCurrency(account.currency || 'USD');
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setAccountName('');
    setBrokerName('');
    setStartingBalance('');
    setAccountType('Personal');
    setCurrency('USD');
    setEditingAccountId(null);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trading Accounts</h2>
          <p className="text-muted-foreground">Manage your trading accounts here.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>Add New Account</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Trading Account</DialogTitle>
              <DialogDescription>
                Add a new account to start tracking its trades.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAccount}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input 
                    id="accountName" 
                    placeholder="e.g. FTMO 100K Challenge" 
                    required 
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="brokerName">Broker Name</Label>
                  <Input 
                    id="brokerName" 
                    placeholder="e.g. IC Markets" 
                    value={brokerName}
                    onChange={(e) => setBrokerName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startingBalance">Starting Balance</Label>
                  <Input 
                    id="startingBalance" 
                    type="number" 
                    placeholder="100000" 
                    required 
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select value={accountType} onValueChange={setAccountType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Personal">Personal</SelectItem>
                      <SelectItem value="Funded">Funded</SelectItem>
                      <SelectItem value="Prop Firm">Prop Firm Challenge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="AUD">AUD (A$)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                      <SelectItem value="BDT">BDT (৳)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Account'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Account Modal */}
        <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if(!open) resetForm(); }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Trading Account</DialogTitle>
              <DialogDescription>
                Update the details of your trading account.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateAccount}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-accountName">Account Name</Label>
                  <Input 
                    id="edit-accountName" 
                    placeholder="e.g. FTMO 100K Challenge" 
                    required 
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-brokerName">Broker Name</Label>
                  <Input 
                    id="edit-brokerName" 
                    placeholder="e.g. IC Markets" 
                    value={brokerName}
                    onChange={(e) => setBrokerName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-startingBalance">Starting Balance</Label>
                  <Input 
                    id="edit-startingBalance" 
                    type="number" 
                    placeholder="100000" 
                    required 
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-accountType">Account Type</Label>
                  <Select value={accountType} onValueChange={setAccountType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Personal">Personal</SelectItem>
                      <SelectItem value="Funded">Funded</SelectItem>
                      <SelectItem value="Prop Firm">Prop Firm Challenge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="AUD">AUD (A$)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                      <SelectItem value="BDT">BDT (৳)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Account'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold">
                {account.accountName}
              </CardTitle>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {account.accountType}
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(account.currentBalance, account.currency)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Current Balance (Started with {formatCurrency(account.startingBalance, account.currency)})
              </p>
              {account.brokerName && (
                <p className="text-sm mt-4 text-muted-foreground">
                  Broker: {account.brokerName}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" className="w-full flex-1" onClick={() => openEditModal(account)}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Button>
              <Button variant="outline" className="w-full flex-1 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteAccount(account.id)}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
        {accounts.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No accounts found. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
}
