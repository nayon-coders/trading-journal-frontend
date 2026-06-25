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
import { ChevronLeft, ChevronRight, Moon, RefreshCw, Target, DollarSign, Percent, Activity, Trophy, AlertTriangle, TrendingUp, BarChart2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TradeFilterBar from '@/components/TradeFilterBar';
import { useTradeFilter } from '@/hooks/useTradeFilter';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';
import { formatCurrency } from '@/utils/formatCurrency';

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
  account?: {
    currency: string;
    environment?: string;
  };
}

export default function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { environment } = useEnvironmentStore();

  const { filterState, setFilterState, filteredTrades } = useTradeFilter(trades);

  const fetchData = async () => {
    try {
      const tradesRes = await api.get('/trades');
      // Filter trades globally based on selected environment
      const envTrades = tradesRes.data.filter((t: any) => (t.account?.environment || 'Live') === environment);
      setTrades(envTrades);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to load data",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [environment]); // Re-fetch or re-filter when environment changes

  // Calculate dynamic stats from filteredTrades
  const totalTrades = filteredTrades.length;
  const winningTrades = filteredTrades.filter(t => t.status === 'Win');
  const losingTrades = filteredTrades.filter(t => t.status === 'Loss');
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
  const totalPnL = filteredTrades.reduce((sum, t) => sum + (t.profitAmount || 0), 0);
  const grossProfit = winningTrades.reduce((sum, t) => sum + (t.profitAmount || 0), 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profitAmount || 0), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? grossProfit : 0);
  
  const defaultCurrency = filteredTrades.length > 0 && filteredTrades[0].account ? filteredTrades[0].account.currency : 'USD';
  
  const stats = {
    winRate,
    totalPnL,
    profitFactor,
    totalTrades,
    returns: 18.0
  };

  // Setup Analytics Calculations
  const getGroupStats = (tradeList: any[], keyFn: (t: any) => string) => {
    const groups: Record<string, { wins: number, losses: number, total: number, pnl: number, rr: number }> = {};
    tradeList.forEach(t => {
      const isClosed = t.status === 'Win' || t.status === 'Loss';
      if (!isClosed) return;
      const key = keyFn(t) || 'N/A';
      if (!groups[key]) groups[key] = { wins: 0, losses: 0, total: 0, pnl: 0, rr: 0 };
      
      groups[key].total++;
      if (t.status === 'Win') groups[key].wins++;
      else if (t.status === 'Loss') groups[key].losses++;
      
      groups[key].pnl += (t.profitAmount || 0);
      groups[key].rr += (t.rrRatio || 0);
    });
    return Object.entries(groups).map(([name, s]) => ({
      name,
      winRate: s.total > 0 ? (s.wins / s.total) * 100 : 0,
      pnl: s.pnl,
      avgRr: s.total > 0 ? s.rr / s.total : 0,
      total: s.total
    })).sort((a, b) => b.total - a.total);
  };

  const msbStats = getGroupStats(filteredTrades, t => t.msbDirection);
  const entrySourceStats = getGroupStats(filteredTrades, t => t.entrySource);
  const htfBiasStats = getGroupStats(filteredTrades, t => t.htfBias);
  const setupQualityStats = getGroupStats(filteredTrades, t => t.setupQuality);
  const setupTypeStats = getGroupStats(filteredTrades, t => t.setupRelation?.name || t.entrySource || 'Other');

  const bestSetup = [...setupTypeStats].sort((a, b) => b.pnl - a.pnl)[0];
  const worstSetup = [...setupTypeStats].sort((a, b) => a.pnl - b.pnl)[0];
  const highestWinRateSetup = [...setupTypeStats].filter(s => s.total >= 1).sort((a, b) => b.winRate - a.winRate)[0];
  const mostUsedSetup = setupTypeStats[0];

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
        <Card className="shadow-sm border-border">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Win Rate</span>
              <Target className="h-4 w-4 text-muted-foreground/70" />
            </div>
            <div className="text-2xl font-bold">
              {stats ? `${stats.winRate.toFixed(1)}%` : '0.0%'}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Total P&L</span>
              <DollarSign className="h-4 w-4 text-green-500" />
            </div>
            <div className={`text-2xl font-bold ${stats?.totalPnL && stats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats?.totalPnL !== undefined ? formatCurrency(stats.totalPnL, defaultCurrency) : formatCurrency(0, defaultCurrency)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
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

        <Card className="shadow-sm border-border">
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

      {/* Setup Analytics Widgets */}
      <div className="grid gap-4 md:grid-cols-4 mt-8">
        <Card className="shadow-sm border-border bg-gradient-to-br from-green-50 to-white dark:from-green-500/10 dark:to-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Trophy className="h-4 w-4 text-green-600 dark:text-green-500" />
              <span className="text-sm font-semibold text-green-800 dark:text-green-400">Best Setup (P&L)</span>
            </div>
            <div className="text-lg font-bold text-foreground truncate" title={bestSetup?.name || 'N/A'}>{bestSetup?.name || 'N/A'}</div>
            <div className="text-sm font-medium text-green-600 dark:text-green-500 mt-1">{bestSetup ? formatCurrency(bestSetup.pnl, defaultCurrency) : '-'}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border bg-gradient-to-br from-red-50 to-white dark:from-red-500/10 dark:to-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-500" />
              <span className="text-sm font-semibold text-red-800 dark:text-red-400">Worst Setup (P&L)</span>
            </div>
            <div className="text-lg font-bold text-foreground truncate" title={worstSetup?.name || 'N/A'}>{worstSetup?.name || 'N/A'}</div>
            <div className="text-sm font-medium text-red-600 dark:text-red-500 mt-1">{worstSetup ? formatCurrency(worstSetup.pnl, defaultCurrency) : '-'}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border bg-gradient-to-br from-blue-50 to-white dark:from-blue-500/10 dark:to-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-500" />
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-400">Highest Win Rate</span>
            </div>
            <div className="text-lg font-bold text-foreground truncate" title={highestWinRateSetup?.name || 'N/A'}>{highestWinRateSetup?.name || 'N/A'}</div>
            <div className="text-sm font-medium text-blue-600 dark:text-blue-500 mt-1">{highestWinRateSetup ? `${highestWinRateSetup.winRate.toFixed(1)}%` : '-'}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border bg-gradient-to-br from-purple-50 to-white dark:from-purple-500/10 dark:to-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart2 className="h-4 w-4 text-purple-600 dark:text-purple-500" />
              <span className="text-sm font-semibold text-purple-800 dark:text-purple-400">Most Used Setup</span>
            </div>
            <div className="text-lg font-bold text-foreground truncate" title={mostUsedSetup?.name || 'N/A'}>{mostUsedSetup?.name || 'N/A'}</div>
            <div className="text-sm font-medium text-purple-600 dark:text-purple-500 mt-1">{mostUsedSetup ? `${mostUsedSetup.total} trades` : '-'}</div>
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
      <div className="border rounded-md bg-card overflow-hidden shadow-sm">
        {/* Header */}
        <div className="grid grid-cols-6 border-b divide-x">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Summary'].map((day) => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-muted-foreground bg-muted/30">
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
                  
                  let bgColorClass = "bg-card";
                  if (!isCurrentMonth) bgColorClass = "bg-muted/50";
                  else if (dailyPnL > 0) bgColorClass = "bg-green-50/50";
                  else if (dailyPnL < 0) bgColorClass = "bg-red-50/50";

                  return (
                    <div 
                      key={dayIdx} 
                      className={`p-3 flex flex-col relative cursor-pointer transition-all border-r border-b ${isCurrentMonth ? 'hover:bg-primary/5 hover:shadow-inner' : ''} ${bgColorClass}`}
                      onClick={() => handleDayClick(day)}
                    >
                      <span className={`text-sm font-bold ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/70'}`}>
                        {format(day, 'd')}
                      </span>
                      
                      {dayTrades.length > 0 && (
                        <div className="mt-auto flex flex-col gap-1.5 pt-2">
                          <div className={`px-2 py-1 rounded-md text-xs font-bold flex items-center justify-between ${dailyPnL >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            <span>P&L</span>
                            <span>{dailyPnL >= 0 ? '+' : ''}{formatCurrency(Math.abs(dailyPnL), defaultCurrency)}</span>
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
                <div className="p-2 flex flex-col items-center justify-center bg-muted/20">
                  {weekTrades > 0 && (
                    <div className="text-center space-y-1">
                      <div className="text-xs text-muted-foreground">{weekTrades} trades</div>
                      <div className={`text-xs font-bold ${weekPnL >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {weekPnL >= 0 ? '+' : ''}{formatCurrency(Math.abs(weekPnL), defaultCurrency)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Setup Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        <Card className="shadow-sm border-border">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b bg-muted/30">
              <h3 className="font-semibold text-sm text-primary">Win Rate By Entry Source</h3>
            </div>
            <div className="divide-y">
              {entrySourceStats.map(stat => (
                <div key={stat.name} className="flex justify-between items-center p-4">
                  <span className="font-medium text-sm w-1/3">{stat.name}</span>
                  <div className="w-1/3 px-2">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${stat.winRate > 50 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${stat.winRate}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold w-1/4 text-right">{stat.winRate.toFixed(1)}% ({stat.total})</span>
                </div>
              ))}
              {entrySourceStats.length === 0 && <div className="p-4 text-sm text-muted-foreground text-center">No data available</div>}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b bg-muted/30">
              <h3 className="font-semibold text-sm text-primary">Win Rate By Setup Quality</h3>
            </div>
            <div className="divide-y">
              {setupQualityStats.map(stat => (
                <div key={stat.name} className="flex justify-between items-center p-4">
                  <span className="font-medium text-sm w-1/3">{stat.name}</span>
                  <div className="w-1/3 px-2">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${stat.winRate > 50 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${stat.winRate}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold w-1/4 text-right">{stat.winRate.toFixed(1)}% ({stat.total})</span>
                </div>
              ))}
              {setupQualityStats.length === 0 && <div className="p-4 text-sm text-muted-foreground text-center">No data available</div>}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b bg-muted/30">
              <h3 className="font-semibold text-sm text-primary">Profit By Setup Type</h3>
            </div>
            <div className="divide-y">
              {setupTypeStats.map(stat => (
                <div key={stat.name} className="flex justify-between items-center p-4">
                  <span className="font-medium text-sm w-1/2">{stat.name}</span>
                  <span className={`text-sm font-bold w-1/2 text-right ${stat.pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {stat.pnl >= 0 ? '+' : ''}{formatCurrency(stat.pnl, defaultCurrency)}
                  </span>
                </div>
              ))}
              {setupTypeStats.length === 0 && <div className="p-4 text-sm text-muted-foreground text-center">No data available</div>}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b bg-muted/30">
              <h3 className="font-semibold text-sm text-primary">Win Rate By MSB Direction</h3>
            </div>
            <div className="divide-y">
              {msbStats.map(stat => (
                <div key={stat.name} className="flex justify-between items-center p-4">
                  <span className="font-medium text-sm w-1/3">{stat.name}</span>
                  <div className="w-1/3 px-2">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${stat.winRate > 50 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${stat.winRate}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold w-1/4 text-right">{stat.winRate.toFixed(1)}% ({stat.total})</span>
                </div>
              ))}
              {msbStats.length === 0 && <div className="p-4 text-sm text-muted-foreground text-center">No data available</div>}
            </div>
          </CardContent>
        </Card>

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
                        {trade.profitAmount ? formatCurrency(trade.profitAmount, trade.account?.currency || defaultCurrency) : '-'}
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
