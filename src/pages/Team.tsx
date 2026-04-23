import React from 'react';
import { 
  Search, 
  Plus, 
  Mail, 
  Trash2, 
  MapPin, 
  ExternalLink,
  Github,
  Twitter,
  Linkedin,
  Edit2
} from 'lucide-react';
import { User, Project } from '../types';
import { getInitials, getAvatarColor } from '../utils';

interface TeamProps {
  users: User[];
  projects: Project[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const Team: React.FC<TeamProps> = ({ users, projects, onEdit, onDelete, onAdd }) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Team Members</h2>
          <p className="text-slate-500">Manage your team and their project assignments.</p>
        </div>
        <button 
          onClick={onAdd}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition-all flex items-center gap-2 shadow-lg shadow-brand-200"
        >
          <Plus size={18} />
          Create Member
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search team members..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {['All', 'Management', 'Design', 'Development', 'QA'].map((dept) => (
            <button
              key={dept}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                dept === 'All' 
                  ? 'bg-brand-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {users.map((user) => {
          const userProjects = projects.filter(p => p.team.some(m => m.id === user.id));
          
          return (
            <div key={user.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm group-hover:scale-105 transition-transform duration-300 ${getAvatarColor(user.name)}`}>
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{user.name}</h3>
                      <p className="text-sm text-brand-600 font-medium">{user.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => onEdit(user)}
                      className="text-slate-400 hover:text-brand-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all"
                      title="Edit Member"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this member?')) {
                          onDelete(user.id);
                        }
                      }}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                      title="Delete Member"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <Mail size={16} className="text-slate-400" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <MapPin size={16} className="text-slate-400" />
                    San Francisco, CA
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Active Projects</p>
                  <div className="flex flex-wrap gap-2">
                    {userProjects.slice(0, 3).map(p => (
                      <span key={p.id} className="px-2 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-md border border-slate-100">
                        {p.name}
                      </span>
                    ))}
                    {userProjects.length > 3 && (
                      <span className="px-2 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-md border border-slate-100">
                        +{userProjects.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button className="text-slate-400 hover:text-slate-900 transition-colors">
                    <Github size={16} />
                  </button>
                  <button className="text-slate-400 hover:text-brand-500 transition-colors">
                    <Twitter size={16} />
                  </button>
                  <button className="text-slate-400 hover:text-blue-700 transition-colors">
                    <Linkedin size={16} />
                  </button>
                </div>
                <button className="text-brand-600 text-xs font-bold flex items-center gap-1 hover:underline">
                  View Profile <ExternalLink size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Team;
