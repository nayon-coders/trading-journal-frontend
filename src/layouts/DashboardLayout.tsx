import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { LayoutDashboard, Wallet, CalendarDays, LineChart, LogOut, FileText, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Accounts', path: '/accounts', icon: Wallet },
    { name: 'Setups', path: '/setups', icon: LayoutDashboard },
    { name: 'Trades', path: '/trades', icon: FileText },
    { name: 'Trade Journal', path: '/journal', icon: BookOpen },
    { name: 'Calendar', path: '/calendar', icon: CalendarDays },
    { name: 'Analytics', path: '/analytics', icon: LineChart },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">TradeJournal</h1>
        </div>
        
        <div className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            
            return (
              <Link key={item.name} to={item.path}>
                <Button 
                  variant={isActive ? "secondary" : "ghost"} 
                  className="w-full justify-start mt-2"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </div>
        
        <div className="p-4 border-t mt-auto">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold mr-3">
              U
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">Trader</p>
              <p className="text-xs text-muted-foreground truncate">trader@example.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
