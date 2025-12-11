
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Car, CalendarRange, Users, Wallet, Menu, X, UserCog, CalendarClock, Settings, LogOut, MapPin, Receipt, PieChart, UserCircle } from 'lucide-react';
import { initializeData, getStoredData, DEFAULT_SETTINGS } from './services/dataService';
import { getCurrentUser, logout } from './services/authService';
import { User, AppSettings } from './types';
import { Logo, LogoText } from './components/Logo';
import Dashboard from './pages/Dashboard';
import BookingPage from './pages/BookingPage';
import FleetPage from './pages/FleetPage';
import PartnersPage from './pages/PartnersPage';
import DriversPage from './pages/DriversPage';
import HighSeasonPage from './pages/HighSeasonPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import CustomersPage from './pages/CustomersPage';
import DriverTrackingPage from './pages/DriverTrackingPage';
import ExpensesPage from './pages/ExpensesPage';
import StatisticsPage from './pages/StatisticsPage';

// Initialize mock data
initializeData();

// --- THEME ENGINE ---
const THEME_COLORS: {[key: string]: {main: string, hover: string, light: string, text: string}} = {
    red: { main: '#DC2626', hover: '#B91C1C', light: '#FEF2F2', text: '#DC2626' },
    blue: { main: '#2563EB', hover: '#1D4ED8', light: '#EFF6FF', text: '#2563EB' },
    green: { main: '#16A34A', hover: '#15803D', light: '#F0FDF4', text: '#16A34A' },
    purple: { main: '#7C3AED', hover: '#6D28D9', light: '#F5F3FF', text: '#7C3AED' },
    orange: { main: '#EA580C', hover: '#C2410C', light: '#FFF7ED', text: '#EA580C' },
    black: { main: '#1F2937', hover: '#111827', light: '#F3F4F6', text: '#1F2937' },
};

const ThemeEngine = ({ settings }: { settings: AppSettings }) => {
    useEffect(() => {
        // 1. Handle Dark Mode
        if (settings.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // 2. Handle Color Theme Injection
        // We override the standard 'red' and 'indigo' classes used in the app to match the selected theme
        const color = THEME_COLORS[settings.themeColor || 'red'] || THEME_COLORS['red'];
        
        const styleId = 'brc-theme-styles';
        let styleTag = document.getElementById(styleId);
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }

        styleTag.innerHTML = `
            /* OVERRIDE RED BUTTONS/TEXT */
            .bg-red-600, .bg-indigo-600 { background-color: ${color.main} !important; }
            .hover\\:bg-red-700:hover, .hover\\:bg-indigo-700:hover { background-color: ${color.hover} !important; }
            .text-red-600, .text-indigo-600, .text-indigo-700 { color: ${color.text} !important; }
            .bg-red-50, .bg-indigo-50 { background-color: ${color.light} !important; }
            .border-red-600, .focus\\:border-red-600:focus, .focus\\:ring-red-600:focus { border-color: ${color.main} !important; --tw-ring-color: ${color.main} !important; }
            .border-indigo-600 { border-color: ${color.main} !important; }
            
            /* Specific fix for Sidebar Active State */
            .bg-red-600.text-white { background-color: ${color.main} !important; }
            
            /* Dark Mode Overrides for Layout */
            .dark body { background-color: #0F172A !important; color: #F8FAFC !important; }
            .dark .bg-white { background-color: #1E293B !important; color: #F8FAFC !important; border-color: #334155 !important; }
            .dark .bg-slate-50, .dark .bg-slate-100 { background-color: #334155 !important; border-color: #475569 !important; color: #F1F5F9 !important; }
            .dark .text-slate-800, .dark .text-slate-900 { color: #F8FAFC !important; }
            .dark .text-slate-500, .dark .text-slate-600, .dark .text-slate-700 { color: #94A3B8 !important; }
            .dark .border-slate-200, .dark .border-slate-100 { border-color: #334155 !important; }
            .dark input, .dark select, .dark textarea { background-color: #0F172A !important; border-color: #475569 !important; color: white !important; }
        `;
    }, [settings.themeColor, settings.darkMode]);

    return null;
};

const SidebarItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'}`}>
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const BottomNavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link to={to} className={`flex flex-col items-center justify-center p-2 flex-1 transition-colors ${isActive ? 'text-red-600' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}>
      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[10px] font-medium mt-1">{label}</span>
    </Link>
  );
};

// Layout Component to wrap protected routes
const AppLayout = ({ children, user, onLogout }: { children: React.ReactNode, user: User, onLogout: () => void }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  // Role Helpers
  const isSuperAdmin = user.role === 'superadmin';
  const isStaff = user.role === 'admin';
  const isDriver = user.role === 'driver';
  const isPartner = user.role === 'partner';
  
  // Admin & SuperAdmin share most operational views
  const isOperational = isStaff || isSuperAdmin;

  useEffect(() => {
    const loadedSettings = getStoredData<AppSettings>('appSettings', DEFAULT_SETTINGS);
    setSettings(loadedSettings);
  }, []);

  const UserProfile = ({ showName = true }) => (
      <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold border border-slate-200 overflow-hidden bg-slate-100 dark:bg-slate-700 dark:border-slate-600">
             {user.image ? (
                 <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
             ) : (
                 <span className={`${isSuperAdmin ? 'text-purple-700' : 'text-slate-700'} dark:text-slate-200`}>{user.name.charAt(0)}</span>
             )}
          </div>
          {showName && (
             <div className="overflow-hidden">
                 <p className="text-sm font-bold text-slate-700 truncate max-w-[120px] dark:text-slate-200">{user.name}</p>
                 <p className="text-xs text-slate-500 capitalize dark:text-slate-400">{user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Staff' : user.role}</p>
             </div>
          )}
      </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100">
      <ThemeEngine settings={settings} />

      {/* Sidebar (Desktop) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-200 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 shadow-lg md:shadow-none hidden md:block`}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo className="w-12 h-12" src={settings.logoUrl} />
            <LogoText title={settings.companyName} />
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">
          {!isDriver && !isPartner && (
            <>
              <div className="px-4 py-2 mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase">Operasional</p>
              </div>
              <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
              <SidebarItem to="/booking" icon={CalendarRange} label="Booking & Jadwal" />
              <SidebarItem to="/fleet" icon={Car} label="Armada Mobil" />
              <SidebarItem to="/customers" icon={UserCircle} label="Pelanggan" />
              <SidebarItem to="/tracking" icon={MapPin} label="Tracking" />
            </>
          )}

          {isDriver && (
             <>
               <div className="px-4 py-2 mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase">Menu Driver</p>
               </div>
               <SidebarItem to="/tracking" icon={CalendarRange} label="Tugas Saya" />
               <SidebarItem to="/expenses" icon={Receipt} label="Reimbursement" />
             </>
          )}

          {isPartner && (
              <>
                <div className="px-4 py-2 mb-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Menu Mitra</p>
                </div>
                <SidebarItem to="/partners" icon={Users} label="Pendapatan Saya" />
                <SidebarItem to="/fleet" icon={Car} label="Unit Saya" />
                <SidebarItem to="/expenses" icon={Receipt} label="Riwayat Setoran" />
              </>
          )}
          
          {isOperational && (
            <>
               <div className="px-4 py-2 mt-4 mb-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Manajemen</p>
              </div>
              <SidebarItem to="/expenses" icon={Receipt} label="Pengeluaran" />
              <SidebarItem to="/statistics" icon={PieChart} label="Statistik" />
              <SidebarItem to="/drivers" icon={UserCog} label="Data Driver" />
              <SidebarItem to="/partners" icon={Users} label="Mitra & Rekanan" />
              <SidebarItem to="/high-season" icon={CalendarClock} label="High Season" />
            </>
          )}

          {/* Settings available for everyone (Help Menu) */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
            <SidebarItem to="/settings" icon={Settings} label="Pengaturan" />
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <div className="mb-3">
             <UserProfile />
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 p-2 rounded transition-colors">
              <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar (Slide-over) */}
       <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-200 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden shadow-2xl flex flex-col`}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Logo className="w-10 h-10" src={settings.logoUrl} />
            <LogoText title={settings.companyName} />
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto flex-1">
          {!isDriver && !isPartner && (
              <>
                <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
                <SidebarItem to="/booking" icon={CalendarRange} label="Booking" />
                <SidebarItem to="/fleet" icon={Car} label="Armada" />
                <SidebarItem to="/customers" icon={UserCircle} label="Pelanggan" />
                <SidebarItem to="/tracking" icon={MapPin} label="Tracking" />
              </>
          )}
          
          {isDriver && (
              <>
                <SidebarItem to="/tracking" icon={CalendarRange} label="Tugas Saya" />
                <SidebarItem to="/expenses" icon={Receipt} label="Reimbursement" />
              </>
          )}

          {isPartner && (
              <>
                <SidebarItem to="/partners" icon={Users} label="Pendapatan" />
                <SidebarItem to="/fleet" icon={Car} label="Unit Saya" />
                <SidebarItem to="/expenses" icon={Receipt} label="Setoran" />
              </>
          )}
          
          {isOperational && (
            <>
              <div className="my-2 border-t border-slate-100 dark:border-slate-700"></div>
              <SidebarItem to="/expenses" icon={Receipt} label="Pengeluaran" />
              <SidebarItem to="/statistics" icon={PieChart} label="Statistik" />
              <SidebarItem to="/drivers" icon={UserCog} label="Driver" />
              <SidebarItem to="/partners" icon={Users} label="Mitra" />
              <SidebarItem to="/high-season" icon={CalendarClock} label="High Season" />
            </>
          )}
          <div className="my-2 border-t border-slate-100 dark:border-slate-700"></div>
          <SidebarItem to="/settings" icon={Settings} label="Pengaturan" />
        </nav>
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
           <div className="mb-4">
               <UserProfile />
           </div>
           <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 text-sm text-red-600 font-bold border border-red-100 rounded-lg py-2 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20">
              <LogOut size={16} /> Keluar
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto h-screen relative pb-20 md:pb-0">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 px-6 py-4 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2">
             <Logo className="w-8 h-8" src={settings.logoUrl} />
             <LogoText title={settings.companyName} />
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-600 dark:text-slate-300">
            <Menu size={24} />
          </button>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
           {children}
        </div>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-50 flex justify-around items-center pb-safe md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {isDriver ? (
              <>
                <BottomNavItem to="/tracking" icon={CalendarRange} label="Tugas" />
                <BottomNavItem to="/expenses" icon={Receipt} label="Reimburse" />
              </>
          ) : isPartner ? (
              <>
                 <BottomNavItem to="/partners" icon={Users} label="Pendapatan" />
                 <BottomNavItem to="/fleet" icon={Car} label="Unit" />
              </>
          ) : (
              <>
                <BottomNavItem to="/" icon={LayoutDashboard} label="Home" />
                <BottomNavItem to="/booking" icon={CalendarRange} label="Booking" />
                <BottomNavItem to="/tracking" icon={MapPin} label="Tracking" />
                {isOperational && <BottomNavItem to="/statistics" icon={PieChart} label="Statistik" />}
              </>
          )}
          <BottomNavItem to="/settings" icon={Settings} label="Setting" />
      </div>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setUser(getCurrentUser());
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  if (loading) return null;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        
        {/* Protected Routes */}
        <Route path="*" element={
          user ? (
            <AppLayout user={user} onLogout={handleLogout}>
               <Routes>
                  {/* Driver Role Limited Access */}
                  {user.role === 'driver' && (
                      <>
                        <Route path="/tracking" element={<DriverTrackingPage isDriverView={true} driverId={user.linkedDriverId} />} />
                        <Route path="/expenses" element={<ExpensesPage isDriverView={true} />} />
                        <Route path="/settings" element={<SettingsPage currentUser={user} />} />
                        <Route path="*" element={<Navigate to="/tracking" replace />} />
                      </>
                  )}

                   {/* Partner Role Limited Access */}
                   {user.role === 'partner' && (
                      <>
                        <Route path="/partners" element={<PartnersPage currentUser={user} />} />
                        <Route path="/fleet" element={<FleetPage currentUser={user} />} />
                        <Route path="/expenses" element={<ExpensesPage isPartnerView={true} />} />
                        <Route path="/settings" element={<SettingsPage currentUser={user} />} />
                        <Route path="*" element={<Navigate to="/partners" replace />} />
                      </>
                   )}
                  
                  {/* Admin/SuperAdmin Routes */}
                  {(user.role === 'admin' || user.role === 'superadmin') && (
                      <>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/booking" element={<BookingPage currentUser={user} />} />
                        <Route path="/fleet" element={<FleetPage currentUser={user} />} />
                        <Route path="/customers" element={<CustomersPage currentUser={user} />} />
                        <Route path="/tracking" element={<DriverTrackingPage />} />
                        
                        {/* Operational Routes */}
                        <Route path="/drivers" element={<DriversPage currentUser={user} />} />
                        <Route path="/partners" element={<PartnersPage currentUser={user} />} />
                        <Route path="/high-season" element={<HighSeasonPage currentUser={user} />} />
                        <Route path="/expenses" element={<ExpensesPage />} />
                        <Route path="/statistics" element={<StatisticsPage />} />
                        
                        <Route path="/settings" element={<SettingsPage currentUser={user} />} />
                      </>
                  )}
               </Routes>
            </AppLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </Router>
  );
};

export default App;
