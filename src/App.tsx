import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

// Pages
import DashboardLayout from './layouts/DashboardLayout';
import Accounts from './pages/accounts/Accounts';
import Trades from './pages/trades/Trades';
import AddTrade from './pages/trades/AddTrade';
import EditTrade from './pages/trades/EditTrade';
import SingleTradeView from './pages/trades/SingleTradeView';
import Dashboard from './pages/dashboard/Dashboard';
import Calendar from './pages/calendar/Calendar';
import TradeJournal from './pages/journal/TradeJournal';
import Setups from './pages/setups/Setups';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="setups" element={<Setups />} />
          <Route path="trades" element={<Trades />} />
          <Route path="trades/new" element={<AddTrade />} />
          <Route path="trades/:id/edit" element={<EditTrade />} />
          <Route path="trades/:id" element={<SingleTradeView />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="journal" element={<TradeJournal />} />
        </Route>
        
        {/* Default route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
