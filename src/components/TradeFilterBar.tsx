import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import api from '@/services/api';
import type { TradeFilterState } from '@/hooks/useTradeFilter';
import { Filter } from 'lucide-react';

interface TradeFilterBarProps {
  filterState: TradeFilterState;
  setFilterState: (state: TradeFilterState | ((prev: TradeFilterState) => TradeFilterState)) => void;
}

export default function TradeFilterBar({ filterState, setFilterState }: TradeFilterBarProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [setups, setSetups] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/accounts').catch(console.error),
      api.get('/setups').catch(console.error)
    ]).then(([accRes, setupRes]) => {
      if (accRes && accRes.data) setAccounts(accRes.data);
      if (setupRes && setupRes.data) setSetups(setupRes.data);
    });
  }, []);

  return (
    <div className="bg-card/80 dark:bg-card/90 backdrop-blur-md p-4 rounded-xl border border-border shadow-sm flex flex-wrap items-end gap-4 mb-6">
      <div className="flex items-center gap-2 mr-2 text-primary font-bold">
        <Filter className="w-5 h-5" />
        <span className="hidden sm:inline">Filters</span>
      </div>

      {/* Account Filter */}
      <div className="flex-1 min-w-[150px] max-w-[200px]">
        <Label className="text-xs text-muted-foreground mb-1 block">Account</Label>
        <Select 
          value={filterState.accountId} 
          onValueChange={(val) => setFilterState(prev => ({ ...prev, accountId: val }))}
        >
          <SelectTrigger className="h-9 bg-card">
            <SelectValue placeholder="All Accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Accounts</SelectItem>
            {accounts.map(acc => (
              <SelectItem key={acc.id} value={acc.id}>{acc.accountName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Setup Filter */}
      <div className="flex-1 min-w-[150px] max-w-[200px]">
        <Label className="text-xs text-muted-foreground mb-1 block">Setup / Strategy</Label>
        <Select 
          value={filterState.setupId} 
          onValueChange={(val) => setFilterState(prev => ({ ...prev, setupId: val }))}
        >
          <SelectTrigger className="h-9 bg-card">
            <SelectValue placeholder="All Setups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Setups</SelectItem>
            {setups.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="flex-1 min-w-[150px] max-w-[200px]">
        <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
        <Select 
          value={filterState.status} 
          onValueChange={(val) => setFilterState(prev => ({ ...prev, status: val }))}
        >
          <SelectTrigger className="h-9 bg-card">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Win">Win</SelectItem>
            <SelectItem value="Loss">Loss</SelectItem>
            <SelectItem value="Breakeven">Breakeven</SelectItem>
            <SelectItem value="Running">Running</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Filter */}
      <div className="flex-1 min-w-[150px] max-w-[200px]">
        <Label className="text-xs text-muted-foreground mb-1 block">Date Range</Label>
        <Select 
          value={filterState.dateRange} 
          onValueChange={(val) => setFilterState(prev => ({ ...prev, dateRange: val }))}
        >
          <SelectTrigger className="h-9 bg-card">
            <SelectValue placeholder="All Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Time</SelectItem>
            <SelectItem value="Today">Today</SelectItem>
            <SelectItem value="This Week">This Week</SelectItem>
            <SelectItem value="This Month">This Month</SelectItem>
            <SelectItem value="Custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom Date Inputs (only show if Custom is selected) */}
      {filterState.dateRange === 'Custom' && (
        <div className="flex gap-2 items-end">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Start Date</Label>
            <Input 
              type="date" 
              className="h-9 bg-card"
              value={filterState.startDate ? filterState.startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setFilterState(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">End Date</Label>
            <Input 
              type="date" 
              className="h-9 bg-card"
              value={filterState.endDate ? filterState.endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setFilterState(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
