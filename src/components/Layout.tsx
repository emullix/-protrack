import React from 'react';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  Calendar, 
  MapPin, 
  Settings, 
  LogOut 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  currentUser: User | null;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout, currentUser }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'meetings', label: 'Activity', icon: MapPin },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} currentUser={currentUser} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-20 shadow-sm">
          <h1 className="text-lg font-bold text-slate-800 capitalize leading-none">
            {activeTab === 'meetings' ? 'Activity' : activeTab.replace('-', ' ')}
          </h1>
          <button 
            onClick={onLogout}
            className="text-slate-500 hover:text-red-600 p-2 rounded-lg hover:bg-slate-50 transition-all"
          >
            <LogOut size={18} />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 pb-28 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Bottom Navigation Bar (iOS Safe Area support) */}
        <nav 
          style={{ 
            height: 'calc(60px + env(safe-area-inset-bottom))', 
            paddingBottom: 'env(safe-area-inset-bottom)' 
          }}
          className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200/80 flex items-center justify-around px-2 z-20 shadow-lg"
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${isActive ? "text-brand-600 font-semibold" : "text-slate-400 hover:text-slate-600"}`}
              >
                <Icon size={20} className={isActive ? "text-brand-600" : "text-slate-400"} />
                <span className="text-[10px] mt-1 leading-none">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
