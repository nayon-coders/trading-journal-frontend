import { useState, useMemo } from 'react';
import { isThisWeek, isThisMonth, isToday, isWithinInterval } from 'date-fns';

export interface TradeFilterState {
  accountId: string;
  setupId: string;
  status: string;
  dateRange: string;
  startDate?: Date;
  endDate?: Date;
}

export function useTradeFilter(trades: any[]) {
  const [filterState, setFilterState] = useState<TradeFilterState>({
    accountId: 'All',
    setupId: 'All',
    status: 'All',
    dateRange: 'All',
  });

  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      // Filter by Account
      if (filterState.accountId !== 'All' && trade.accountId !== filterState.accountId) {
        return false;
      }

      // Filter by Setup
      if (filterState.setupId !== 'All' && trade.setupId !== filterState.setupId) {
        return false;
      }

      // Filter by Status
      if (filterState.status !== 'All' && trade.status !== filterState.status) {
        return false;
      }

      // Filter by Date
      const tDate = new Date(trade.tradeDate);
      if (filterState.dateRange === 'Today') {
        if (!isToday(tDate)) return false;
      } else if (filterState.dateRange === 'This Week') {
        if (!isThisWeek(tDate, { weekStartsOn: 1 })) return false;
      } else if (filterState.dateRange === 'This Month') {
        if (!isThisMonth(tDate)) return false;
      } else if (filterState.dateRange === 'Custom' && filterState.startDate && filterState.endDate) {
        if (!isWithinInterval(tDate, { start: filterState.startDate, end: filterState.endDate })) {
          return false;
        }
      }

      return true;
    });
  }, [trades, filterState]);

  return { filterState, setFilterState, filteredTrades };
}
