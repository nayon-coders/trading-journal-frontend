import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Moon, RefreshCw, Target, DollarSign, Percent, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TradeFilterBar from '@/components/TradeFilterBar';
import { useTradeFilter } from '@/hooks/useTradeFilter';

interface DashboardStats {
  totalPnL: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  returns: number; // For demo purposes, we will mock returns if not available
}

interface Trade {
  id: string;
  tradeDate: string;
  pair: string;
  profitAmount: number | null;
  status: string;
}

export default function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { filterState, setFilterState, filteredTrades } = useTradeFilter(trades);

  const fetchData = async () => {
    try {
      const tradesRes = await api.get('/trades');
      setTrades(tradesRes.data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to load data",
      });
    }
  };

  // Calculate dynamic stats from filteredTrades
  const totalTrades = filteredTrades.length;
  const winningTrades = filteredTrades.filter(t => t.status === 'Win');
  const losingTrades = filteredTrades.filter(t => t.status === 'Loss');
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
  const totalPnL = filteredTrades.reduce((sum, t) => sum + (t.profitAmount || 0), 0);
  const grossProfit = winningTrades.reduce((sum, t) => sum + (t.profitAmount || 0), 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profitAmount || 0), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? grossProfit : 0);
  
  const stats = {
    winRate,
    totalPnL,
    profitFactor,
    totalTrades,
    returns: 18.0
  };

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Group days into weeks starting on Monday
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  days.forEach(day => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getDayTrades = (day: Date) => {
    const formattedDay = format(day, 'yyyy-MM-dd');
    return filteredTrades.filter(trade => {
      // tradeDate is a UTC string like "2026-06-14T00:00:00.000Z"
      const tradeDayString = new Date(trade.tradeDate).toISOString().split('T')[0];
      return tradeDayString === formattedDay;
    });
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsDialogOpen(true);
  };

  const selectedDayTrades = selectedDate ? getDayTrades(selectedDate) : [];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      
      <TradeFilterBar filterState={filterState} setFilterState={setFilterState} />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Win Rate</span>
              <Target className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold">
              {stats ? `${stats.winRate.toFixed(1)}%` : '0.0%'}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Total P&L</span>
              <DollarSign className="h-4 w-4 text-green-500" />
            </div>
            <div className={`text-2xl font-bold ${stats?.totalPnL && stats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats?.totalPnL !== undefined ? `$${stats.totalPnL > 1000 ? (stats.totalPnL/1000).toFixed(1) + 'K' : stats.totalPnL.toFixed(1)}` : '$0.0'}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Returns</span>
              <Percent className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-500">
              {stats ? `${stats.returns.toFixed(1)}%` : '0.0%'}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Profit Factor</span>
              <Activity className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-500">
              {stats ? stats.profitFactor.toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center pt-4 pb-2 border-b border-t mt-8">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-bold text-sm w-32 text-center">
              {format(currentMonth, 'MMMM-yyyy')}
            </span>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-1 border-l pl-4">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Moon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-6 text-sm">
          <div>
            <span className="text-muted-foreground mr-2">P/L:</span>
            <span className="font-bold text-green-500">{stats?.totalPnL ? (stats.totalPnL/1000).toFixed(1) + 'K' : '0'}</span>
          </div>
          <div>
            <span className="text-muted-foreground mr-2">Trades:</span>
            <span className="font-bold">{stats?.totalTrades || 0}</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-md bg-white overflow-hidden shadow-sm">
        {/* Header */}
        <div className="grid grid-cols-6 border-b divide-x">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Summary'].map((day) => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-muted-foreground bg-gray-50/50">
              {day}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y">
          {weeks.map((week, weekIdx) => {
            const weekdays = week.slice(0, 5); // Mon-Fri
            let weekPnL = 0;
            let weekTrades = 0;

            return (
              <div key={weekIdx} className="grid grid-cols-6 divide-x min-h-[140px]">
                {/* Days */}
                {weekdays.map((day, dayIdx) => {
                  const dayTrades = getDayTrades(day);
                  const dailyPnL = dayTrades.reduce((sum, t) => sum + (t.profitAmount || 0), 0);
                  weekPnL += dailyPnL;
                  weekTrades += dayTrades.length;
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  
                  let bgColorClass = "bg-white";
                  if (!isCurrentMonth) bgColorClass = "bg-gray-50";
                  else if (dailyPnL > 0) bgColorClass = "bg-green-50/50";
                  else if (dailyPnL < 0) bgColorClass = "bg-red-50/50";

                  return (
                    <div 
                      key={dayIdx} 
                      className={`p-3 flex flex-col relative cursor-pointer transition-all border-r border-b ${isCurrentMonth ? 'hover:bg-primary/5 hover:shadow-inner' : ''} ${bgColorClass}`}
                      onClick={() => handleDayClick(day)}
                    >
                      <span className={`text-sm font-bold ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                        {format(day, 'd')}
                      </span>
                      
                      {dayTrades.length > 0 && (
                        <div className="mt-auto flex flex-col gap-1.5 pt-2">
                          <div className={`px-2 py-1 rounded-md text-xs font-bold flex items-center justify-between ${dailyPnL >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            <span>P&L</span>
                            <span>{dailyPnL >= 0 ? '+' : ''}${Math.abs(dailyPnL).toFixed(2)}</span>
                          </div>
                          <div className="px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-[11px] font-semibold flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {dayTrades.length} Trade{dayTrades.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Summary Cell */}
                <div className="p-2 flex flex-col items-center justify-center bg-gray-50/30">
                  {weekTrades > 0 && (
                    <div className="text-center space-y-1">
                      <div className="text-xs text-muted-foreground">{weekTrades} trades</div>
                      <div className={`text-xs font-bold ${weekPnL >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {weekPnL >= 0 ? '+' : ''}{weekPnL.toFixed(1)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedDate && format(selectedDate, 'MMMM d, yyyy')} Summary</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedDayTrades.length === 0 ? (
              <p className="text-muted-foreground text-center">No trades recorded on this day.</p>
            ) : (
              <div className="space-y-4">
                {selectedDayTrades.map((trade, idx) => (
                  <div key={trade.id} className="flex justify-between items-center border-b pb-3 group cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors" onClick={() => navigate(`/trades/${trade.id}`)}>
                    <div>
                      <p className="font-semibold text-primary group-hover:underline">Trade {idx + 1} - {trade.pair}</p>
                      <p className="text-sm text-muted-foreground">Status: {trade.status}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className={`font-bold ${trade.profitAmount && trade.profitAmount > 0 ? 'text-green-500' : trade.profitAmount && trade.profitAmount < 0 ? 'text-red-500' : ''}`}>
                        {trade.profitAmount ? `$${trade.profitAmount.toFixed(2)}` : '-'}
                      </div>
                      <span className="text-[10px] text-muted-foreground">Click to view</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
