import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { LayoutDashboard, Wallet, CalendarDays, LineChart, LogOut, FileText, BookOpen, Sun, Moon, Activity, TestTube2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useEnvironmentStore } from '@/store/useEnvironmentStore';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { environment, setEnvironment } = useEnvironmentStore();

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
      <aside className="w-64 border-r bg-card flex flex-col theme-transition">
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
        
        <div className="p-4 border-t mt-auto space-y-3">
          {/* Environment Toggle */}
          <button
            onClick={() => setEnvironment(environment === 'Live' ? 'Backtesting' : 'Live')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 group border
              ${environment === 'Live' 
                ? 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-500/30' 
                : 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-500/30'
              }`}
          >
            <div className="relative w-5 h-5 shrink-0">
              <Activity className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${
                environment === 'Live' ? 'opacity-100 scale-100 text-blue-600' : 'opacity-0 scale-0'
              }`} />
              <TestTube2 className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${
                environment === 'Backtesting' ? 'opacity-100 scale-100 text-purple-600' : 'opacity-0 scale-0'
              }`} />
            </div>
            <span>{environment} Mode</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              bg-secondary/50 hover:bg-secondary text-secondary-foreground
              transition-all duration-200 group"
          >
            <div className="relative w-5 h-5 shrink-0">
              <Sun className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${
                resolvedTheme === 'dark' 
                  ? 'opacity-0 rotate-90 scale-0' 
                  : 'opacity-100 rotate-0 scale-100 text-amber-500'
              }`} />
              <Moon className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${
                resolvedTheme === 'dark' 
                  ? 'opacity-100 rotate-0 scale-100 text-blue-400' 
                  : 'opacity-0 -rotate-90 scale-0'
              }`} />
            </div>
            <span>{resolvedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            <div className={`ml-auto w-9 h-5 rounded-full relative transition-colors duration-300 ${
              resolvedTheme === 'dark' ? 'bg-blue-500/30' : 'bg-amber-200'
            }`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 shadow-sm ${
                resolvedTheme === 'dark' 
                  ? 'left-[18px] bg-blue-400' 
                  : 'left-0.5 bg-amber-500'
              }`} />
            </div>
          </button>

          <div className="flex items-center px-2">
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
