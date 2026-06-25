import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { format, isThisWeek, isThisMonth, isThisYear } from 'date-fns';
import { Label } from '@/components/ui/label';
import { BookOpen, Calendar as CalendarIcon, Tag, Clock, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TradeFilterBar from '@/components/TradeFilterBar';
import { useTradeFilter } from '@/hooks/useTradeFilter';
import { formatCurrency } from '@/utils/formatCurrency';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';

interface Trade {
  id: string;
  tradeDate: string;
  tradeTime: string;
  pair: string;
  direction: string;
  bias: string;
  setup: string;
  setupRelation?: { name: string };
  confidence: string;
  session: string;
  entryPrice: number;
  lotSize: number;
  rrRatio: number;
  riskAmount: number;
  status: string;
  account?: {
    currency: string;
    environment?: string;
  };
  profitAmount: number;
  preTradeNote: string;
  executionNote: string;
  mistakeNote: string;
  lessonNote: string;
  imageUrlBefore: string;
}

export default function TradeJournal() {
  const [trades, setTrades] = useState<Trade[]>([]);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { environment } = useEnvironmentStore();
  
  const { filterState, setFilterState, filteredTrades } = useTradeFilter(trades);

  useEffect(() => {
    fetchTrades();
  }, [environment]);

  const fetchTrades = async () => {
    try {
      const response = await api.get('/trades');
      const envTrades = response.data.filter((t: any) => (t.account?.environment || 'Live') === environment);
      setTrades(envTrades);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load journals.",
      });
    }
  };

  const openTrade = (trade: Trade) => {
    navigate(`/trades/${trade.id}`);
  };

  return (
    <div className="p-8 space-y-6 max-w-[1400px] mx-auto min-h-screen bg-background">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trading Journal</h2>
          <p className="text-muted-foreground">Review your past executions and notes.</p>
        </div>
        <div><span className="text-muted-foreground text-xs block">Setup</span><span className="font-semibold text-sm">{/* Example usage here */}</span></div>
        <div><span className="text-muted-foreground text-xs block">Session</span><span className="font-semibold text-sm"></span></div>
      </div>

      <TradeFilterBar filterState={filterState} setFilterState={setFilterState} />

      {/* Gallery Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTrades.map((trade, index) => (
          <Card 
            key={trade.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow border-border overflow-hidden bg-card" 
            onClick={() => openTrade(trade)}
          >
            {/* Top Half: Image */}
            <div className="h-[220px] w-full bg-muted flex items-center justify-center border-b relative">
              {trade.imageUrlBefore ? (
                <img 
                  src={trade.imageUrlBefore} 
                  alt={trade.pair} 
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <div className="text-muted-foreground/70 flex flex-col items-center">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs font-medium">No Chart Image</span>
                </div>
              )}
            </div>

            {/* Bottom Half: Details */}
            <CardContent className="p-5">
              <div className="flex items-center space-x-2 text-lg font-bold text-foreground mb-4">
                <ArrowRight className="w-5 h-5 text-muted-foreground/70" />
                <span>{(filteredTrades.length - index).toString().padStart(2, '0')}</span>
              </div>
              
              <div className="text-sm font-medium text-muted-foreground mb-4">
                {format(new Date(trade.tradeDate), 'MMMM d, yyyy')} {trade.tradeTime}
              </div>

              <div className="text-sm font-bold mb-4 text-foreground">
                {trade.profitAmount !== null && trade.profitAmount !== undefined ? (
                  <span className={trade.profitAmount >= 0 ? '' : ''}>
                    {trade.profitAmount < 0 ? '-' : ''}{formatCurrency(Math.abs(trade.profitAmount), trade.account?.currency || 'USD')}
                  </span>
                ) : (
                  '-'
                )}
              </div>

              <div className="flex items-center space-x-2">
                {trade.session && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[11px] font-bold rounded">
                    {trade.session}
                  </span>
                )}
                {(trade.setupRelation?.name || trade.setup) && (
                  <span className="px-2 py-0.5 bg-primary/20 text-primary text-[11px] font-bold rounded">
                    {trade.setupRelation?.name || trade.setup}
                  </span>
                )}
                <span className={`px-2 py-0.5 text-[11px] font-bold rounded ${trade.direction === 'Long' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                  {trade.direction}
                </span>
                <span className={`px-2 py-0.5 text-[11px] font-bold rounded ml-auto ${trade.status === 'Win' ? 'bg-green-100 text-green-700' : trade.status === 'Loss' ? 'bg-red-100 text-red-700' : 'bg-muted text-foreground/80'}`}>
                  {trade.status}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredTrades.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            No trades found for this period. Add a trade to see it in the gallery!
          </div>
        )}
      </div>
    </div>
  );
}
