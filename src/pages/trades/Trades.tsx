import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatCurrency';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { Edit, Trash2 } from 'lucide-react';
import TradeFilterBar from '@/components/TradeFilterBar';
import { useTradeFilter } from '@/hooks/useTradeFilter';

interface Trade {
  id: string;
  tradeDate: string;
  pair: string;
  direction: string;
  status: string;
  profitAmount: number;
  rrRatio: number;
  setup: string;
  setupRelation?: { name: string };
  session: string;
  account: { accountName: string; currency: string };
}

export default function Trades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { environment } = useEnvironmentStore();
  
  const { filterState, setFilterState, filteredTrades } = useTradeFilter(trades);

  const fetchData = async () => {
    try {
      const response = await api.get('/trades');
      const envTrades = response.data.filter((t: any) => (t.account?.environment || 'Live') === environment);
      setTrades(envTrades);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching data",
        description: error.message,
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [environment]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this trade?')) return;
    
    try {
      await api.delete(`/trades/${id}`);
      toast({ title: 'Success', description: 'Trade deleted successfully' });
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting trade",
        description: error.message,
      });
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trade List</h2>
          <p className="text-muted-foreground">Log your new trades and journal your thoughts.</p>
        </div>
        
        <Button onClick={() => navigate('/trades/new')}>+ Add Trade</Button>
      </div>

      <TradeFilterBar filterState={filterState} setFilterState={setFilterState} />

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Setup</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">P&L</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrades.map((trade) => (
              <TableRow key={trade.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/trades/${trade.id}`)}>
                <TableCell>{new Date(trade.tradeDate).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{trade.pair}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${trade.direction === 'Long' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {trade.direction}
                  </span>
                </TableCell>
                <TableCell>{trade.setupRelation?.name || trade.setup || '-'}</TableCell>
                <TableCell>{trade.session || '-'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    trade.status === 'Win' ? 'bg-green-100 text-green-800' : 
                    trade.status === 'Loss' ? 'bg-red-100 text-red-800' : 
                    trade.status === 'Breakeven' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {trade.status}
                  </span>
                </TableCell>
                <TableCell className={`text-right font-bold ${trade.profitAmount && trade.profitAmount > 0 ? 'text-green-500' : trade.profitAmount && trade.profitAmount < 0 ? 'text-red-500' : ''}`}>
                  {trade.profitAmount ? formatCurrency(trade.profitAmount, trade.account?.currency || 'USD') : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      onClick={(e) => { e.stopPropagation(); navigate(`/trades/${trade.id}/edit`); }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => handleDelete(e, trade.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredTrades.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No trades found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
