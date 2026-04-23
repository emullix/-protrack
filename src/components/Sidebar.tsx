import React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  Calendar, 
  Users, 
  Settings, 
  LogOut,
  PlusCircle,
  Bell,
  MapPin,
  BarChart2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'meetings', label: 'Activity', icon: MapPin },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
    { id: 'team', label: 'Team', icon: Users },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-200">
          <Briefcase size={24} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800">ProTrack</h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Main Menu</div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              activeTab === item.id 
                ? "bg-brand-50 text-brand-600 font-medium" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon size={20} className={cn(
              activeTab === item.id ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
            )} />
            {item.label}
          </button>
        ))}

        <div className="pt-8 text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Actions</div>
        <button 
          onClick={() => setActiveTab('new-project')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all group"
        >
          <PlusCircle size={20} className="text-slate-400 group-hover:text-slate-600" />
          New Project
        </button>
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={() => setActiveTab('settings')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group mb-1",
            activeTab === 'settings' ? "bg-brand-50 text-brand-600 font-medium" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Settings size={20} className={cn(
            activeTab === 'settings' ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
          )} />
          Settings
        </button>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group"
        >
          <LogOut size={20} className="text-slate-400 group-hover:text-red-500" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
