import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  startOfWeek, 
  endOfWeek 
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Trade {
  id: string;
  tradeDate: string;
  pair: string;
  profitAmount: number | null;
  status: string;
}

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await api.get('/trades');
        setTrades(response.data);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error fetching trades",
          description: error.message,
        });
      }
    };
    fetchTrades();
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const today = () => setCurrentMonth(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayTrades = (day: Date) => {
    return trades.filter(trade => isSameDay(new Date(trade.tradeDate), day));
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsDialogOpen(true);
  };

  const selectedDayTrades = selectedDate ? getDayTrades(selectedDate) : [];

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trading Calendar</h2>
          <p className="text-muted-foreground">Review your trading activity over time.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={today}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="bg-muted p-2 text-center text-sm font-semibold">
                {d}
              </div>
            ))}
            
            {days.map((day, idx) => {
              const dayTrades = getDayTrades(day);
              const totalPnL = dayTrades.reduce((sum, t) => sum + (t.profitAmount || 0), 0);
              
              return (
                <div 
                  key={idx} 
                  className={`min-h-[120px] bg-card p-2 cursor-pointer hover:bg-accent/50 transition-colors ${
                    !isSameMonth(day, monthStart) ? 'text-muted-foreground opacity-50 bg-muted/20' : ''
                  } ${isSameDay(day, new Date()) ? 'border-2 border-primary' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-semibold ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>
                      {format(day, dateFormat)}
                    </span>
                    {dayTrades.length > 0 && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded-md">
                        {dayTrades.length} trades
                      </span>
                    )}
                  </div>
                  
                  {dayTrades.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className={`text-sm font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                      </div>
                      <div className="space-y-1">
                        {dayTrades.slice(0, 2).map((trade) => (
                          <div key={trade.id} className="text-xs truncate flex justify-between">
                            <span>{trade.pair}</span>
                            <span className={trade.profitAmount && trade.profitAmount > 0 ? 'text-green-500' : trade.profitAmount && trade.profitAmount < 0 ? 'text-red-500' : ''}>
                              {trade.status === 'Win' ? 'W' : trade.status === 'Loss' ? 'L' : 'BE'}
                            </span>
                          </div>
                        ))}
                        {dayTrades.length > 2 && (
                          <div className="text-xs text-muted-foreground">+{dayTrades.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
                  <div key={trade.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-semibold">Trade {idx + 1} - {trade.pair}</p>
                      <p className="text-sm text-muted-foreground">Status: {trade.status}</p>
                    </div>
                    <div className={`font-bold ${trade.profitAmount && trade.profitAmount > 0 ? 'text-green-500' : trade.profitAmount && trade.profitAmount < 0 ? 'text-red-500' : ''}`}>
                      {trade.profitAmount ? `$${trade.profitAmount.toFixed(2)}` : '-'}
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
