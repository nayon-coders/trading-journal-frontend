import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatCurrency';
import { ArrowLeft, Target, TrendingUp, TrendingDown, DollarSign, Activity, Flag, Crosshair } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  profitAmount: number;
  account: { accountName: string; currency: string };
  preTradeNote: string;
  executionNote: string;
  mistakeNote: string;
  lessonNote: string;
  imageUrlBefore: string;
}

export default function SingleTradeView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrade = async () => {
      try {
        const response = await api.get(`/trades/${id}`);
        setTrade(response.data);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load trade details.",
        });
        navigate('/journal');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchTrade();
    }
  }, [id, navigate, toast]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading trade details...</div>;
  }

  if (!trade) {
    return <div className="p-8 text-center text-muted-foreground">Trade not found.</div>;
  }

  const isWin = trade.status === 'Win';
  const isLoss = trade.status === 'Loss';
  const isBreakeven = trade.status === 'Breakeven';
  const isLong = trade.direction === 'Long';

  return (
    <div className="p-6 md:p-12 max-w-[1600px] mx-auto min-h-screen">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/journal')} 
        className="mb-6 hover:bg-transparent hover:text-primary transition-colors text-muted-foreground font-semibold"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Journal
      </Button>

      <div className="bg-card/80 dark:bg-card/90 backdrop-blur-xl p-8 md:p-10 rounded-2xl shadow-sm dark:shadow-none border border-border mb-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-8 mb-8 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {trade.pair}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-bold shadow-sm ${isLong ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                {isLong ? <TrendingUp className="inline w-4 h-4 mr-1"/> : <TrendingDown className="inline w-4 h-4 mr-1"/>}
                {trade.direction}
              </span>
            </div>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <span>{format(new Date(trade.tradeDate), 'EEEE, MMMM dd, yyyy')}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"></span>
              <span>{trade.tradeTime}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"></span>
              <span>{trade.session} Session</span>
            </p>
          </div>
          
          <div className={`flex flex-col items-end px-8 py-4 rounded-2xl border shadow-sm transition-all hover:shadow-md ${isWin ? 'bg-green-50 border-green-200' : isLoss ? 'bg-red-50 border-red-200' : isBreakeven ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
            <span className={`text-sm font-bold uppercase tracking-wider mb-1 ${isWin ? 'text-green-600' : isLoss ? 'text-red-600' : isBreakeven ? 'text-yellow-600' : 'text-blue-600'}`}>
              {trade.status}
            </span>
            <span className={`text-3xl font-extrabold ${isWin ? 'text-green-700' : isLoss ? 'text-red-700' : isBreakeven ? 'text-yellow-700' : 'text-blue-700'}`}>
              {trade.profitAmount !== null && trade.profitAmount !== undefined 
                ? `${trade.profitAmount >= 0 ? '+' : ''}${formatCurrency(Math.abs(trade.profitAmount), trade.account?.currency || 'USD')}` 
                : 'Pending'}
            </span>
          </div>
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-10">
          <MetricCard icon={<Target />} label="Setup" value={trade.setupRelation?.name || trade.setup || '-'} />
          <MetricCard icon={<Activity />} label="Bias" value={trade.bias || '-'} />
          <MetricCard icon={<Flag />} label="Confidence" value={trade.confidence || '-'} />
          <MetricCard icon={<Crosshair />} label="Entry Price" value={trade.entryPrice} />
          <MetricCard icon={<DollarSign />} label="Lot Size" value={trade.lotSize || '-'} />
          <MetricCard icon={<TrendingUp />} label="R:R Ratio" value={trade.rrRatio || '-'} />
          <MetricCard icon={<DollarSign />} label="Risk Amount" value={trade.riskAmount ? formatCurrency(trade.riskAmount, trade.account?.currency || 'USD') : '-'} highlight />
        </div>

        {/* Chart Image */}
        {trade.imageUrlBefore && (
          <div className="mb-10 rounded-2xl overflow-hidden border-2 border-border shadow-md max-h-[700px] flex justify-center bg-muted/30 group relative">
            <img 
              src={trade.imageUrlBefore} 
              alt="Trade Chart" 
              className="max-w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.02]" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        )}

        {/* Trading Notepad */}
        <div className="mt-8">
          <h3 className="text-2xl font-extrabold mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">📝</span>
            Trading Notepad
          </h3>
          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
            <Tabs defaultValue="pretrade" className="w-full">
              <div className="bg-muted/30 border-b p-2">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-card/50 dark:bg-card/50 backdrop-blur-sm rounded-xl">
                  <TabsTrigger value="pretrade" className="py-3 text-sm md:text-base font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">Trade Reason</TabsTrigger>
                  <TabsTrigger value="execution" className="py-3 text-sm md:text-base font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">Execution</TabsTrigger>
                  <TabsTrigger value="mistake" className="py-3 text-sm md:text-base font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">Mistakes</TabsTrigger>
                  <TabsTrigger value="lesson" className="py-3 text-sm md:text-base font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">Lessons</TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-8 min-h-[400px] bg-card">
                <TabsContent value="pretrade" className="m-0 focus-visible:outline-none">
                  {trade.preTradeNote ? (
                    <div className="prose prose-blue max-w-none" dangerouslySetInnerHTML={{ __html: trade.preTradeNote }} />
                  ) : <EmptyNote text="No Trade Reason note documented." />}
                </TabsContent>
                <TabsContent value="execution" className="m-0 focus-visible:outline-none">
                  {trade.executionNote ? (
                    <div className="prose prose-blue max-w-none" dangerouslySetInnerHTML={{ __html: trade.executionNote }} />
                  ) : <EmptyNote text="No Execution note documented." />}
                </TabsContent>
                <TabsContent value="mistake" className="m-0 focus-visible:outline-none">
                  {trade.mistakeNote ? (
                    <div className="prose prose-blue max-w-none" dangerouslySetInnerHTML={{ __html: trade.mistakeNote }} />
                  ) : <EmptyNote text="No Mistakes documented." />}
                </TabsContent>
                <TabsContent value="lesson" className="m-0 focus-visible:outline-none">
                  {trade.lessonNote ? (
                    <div className="prose prose-blue max-w-none" dangerouslySetInnerHTML={{ __html: trade.lessonNote }} />
                  ) : <EmptyNote text="No Lessons documented." />}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
        
      </div>
    </div>
  );
}

// Subcomponents for cleaner code
function MetricCard({ icon, label, value, highlight = false }: { icon: React.ReactNode, label: string, value: string | number, highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border flex flex-col gap-2 transition-all hover:shadow-md ${highlight ? 'bg-primary/5 border-primary/20' : 'bg-card hover:border-border'}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="w-4 h-4 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-lg font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/60 space-y-4">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
        <span className="text-2xl">📝</span>
      </div>
      <p className="italic font-medium">{text}</p>
    </div>
  );
}
