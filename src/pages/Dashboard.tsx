import React from 'react';
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  ArrowUpRight,
  MoreVertical,
  ChevronRight,
  Users
} from 'lucide-react';
import { Project, Meeting, Task, User } from '../types';
import { PROJECTS as ALL_PROJECTS } from '../constants';
import { formatDate, getInitials, getAvatarColor, formatRelativeTimeSp } from '../utils';

interface DashboardProps {
  projects: Project[];
  tasks: Task[];
  meetings: Meeting[];
  activities: any[];
  team: User[];
  currentUser: User | null;
  setActiveTab: (tab: string) => void;
  onProjectClick?: (projectId: string) => void;
  onTaskClick?: (taskId: string, projectId: string) => void;
  onStatClick?: (status: string) => void;
  onViewAllActivities?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ projects, tasks, meetings, activities, team, currentUser, setActiveTab, onProjectClick, onTaskClick, onStatClick, onViewAllActivities }) => {
  const stats = [
    { label: 'Total Projects', value: projects.length.toString(), icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+2 this month' },
    { label: 'Active', value: projects.filter(p => p.status === 'Active').length.toString(), icon: TrendingUp, color: 'text-brand-600', bg: 'bg-brand-50', trend: 'Starting up' },
    { label: 'In Progress', value: projects.filter(p => p.status === 'In Progress').length.toString(), icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'On track' },
    { label: 'Completed', value: projects.filter(p => p.status === 'Completed').length.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+5 this week' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
        <p className="text-slate-500">Welcome back, Alex. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            onClick={() => {
              if (onStatClick) {
                const statusMap: Record<string, string> = {
                  'Total Projects': 'All',
                  'Active': 'Active',
                  'In Progress': 'In Progress',
                  'Completed': 'Completed'
                };
                onStatClick(statusMap[stat.label] || 'All');
              } else {
                setActiveTab('projects');
              }
            }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <button 
                onClick={(e) => e.stopPropagation()}
                className="text-slate-400 hover:text-slate-600"
              >
                <MoreVertical size={18} />
              </button>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-800">{stat.value}</span>
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight size={12} />
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800">Actividad Reciente</h3>
          <button 
            onClick={onViewAllActivities || (() => setActiveTab('meetings'))}
            className="text-brand-600 text-sm font-medium hover:underline"
          >
            Ver Todo
          </button>
        </div>
        <div className="space-y-6">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">No se encontró actividad reciente.</p>
            </div>
          ) : (
            activities.slice(0, 5).map((activity) => {
              let member = team.find(
                m => m.email === activity.username || 
                     m.name === activity.username || 
                     m.email === activity.userName || 
                     m.name === activity.userName
              );
              
              const authorName = member ? member.name : (activity.userName || activity.username || 'Sistema');
              const avatarName = member ? member.name : authorName;

              return (
                <div key={activity.id} className="flex gap-4 items-start">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0 ${getAvatarColor(avatarName)}`}>
                    {getInitials(avatarName)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-800">
                      <span className="font-semibold">{authorName}</span>{' '}
                      <span>{activity.details}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-1">
                      <Clock size={12} />
                      <span>{formatRelativeTimeSp(activity.created_at)}</span>
                      {(() => {
                        let projectObj = null;
                        
                        if (activity.entity_type === 'task' && activity.entity_id) {
                          const taskObj = tasks.find(t => t.id === activity.entity_id.toString());
                          if (taskObj) {
                            projectObj = projects.find(p => p.id === taskObj.projectId);
                          }
                        } else if (activity.entity_type === 'project' && activity.entity_id) {
                          projectObj = projects.find(p => p.id === activity.entity_id.toString());
                        }
                        
                        if (!projectObj) return null;
                        
                        return (
                          <>
                            <span className="text-slate-300">|</span>
                            <span className="font-semibold text-slate-500">Proyecto:</span>
                            <span className="text-slate-600">{projectObj.name}</span>
                          </>
                        );
                      })()}
                      {activity.entity_type === 'project' && activity.entity_id && onProjectClick && (
                        <>
                          <span>•</span>
                          <button 
                            onClick={() => onProjectClick(activity.entity_id.toString())}
                            className="text-brand-600 hover:underline font-medium"
                          >
                            Ver Proyecto
                          </button>
                        </>
                      )}
                      {activity.entity_type === 'task' && activity.entity_id && onTaskClick && (
                        <>
                          <span>•</span>
                          <button 
                            onClick={() => {
                              const taskObj = tasks.find(t => t.id === activity.entity_id.toString());
                              if (taskObj) {
                                onTaskClick(activity.entity_id.toString(), taskObj.projectId);
                              } else {
                                setActiveTab('tasks');
                              }
                            }}
                            className="text-brand-600 hover:underline font-medium"
                          >
                            Ver Tarea
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Active Projects</h3>
          <button 
            onClick={() => setActiveTab('projects')}
            className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium"
          >
            See all projects <ChevronRight size={16} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Project Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Team</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.slice(0, 3).map((project) => (
                <tr 
                  key={project.id} 
                  onClick={() => onProjectClick ? onProjectClick(project.id) : setActiveTab('projects')}
                  className="hover:bg-slate-50/50 transition-all cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800">{project.name}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{project.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center text-xs font-medium ${
                      project.status === 'Active' ? 'text-brand-600' :
                      project.status === 'In Progress' ? 'text-blue-600' :
                      project.status === 'Completed' ? 'text-emerald-600' :
                      project.status === 'At Risk' ? 'text-rose-600' :
                      'text-slate-600'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex -space-x-2">
                      {project.team.slice(0, 3).map((member) => (
                        <div key={member.id} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold shadow-sm ${getAvatarColor(member.name)}`}>
                          {getInitials(member.name)}
                        </div>
                      ))}
                      {project.team.length > 3 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          +{project.team.length - 3}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const projectTasks = tasks.filter(t => t.projectId === project.id)
                                                .sort((a, b) => a.position - b.position);
                      const nextTask = projectTasks.find(t => t.status !== 'Completed');
                      return (
                        <div className="w-full max-w-[120px] flex flex-col gap-1">
                          {nextTask && (
                            <span className="text-[10px] text-slate-500 truncate max-w-[110px] font-medium" title={nextTask.name}>
                              {nextTask.name}
                            </span>
                          )}
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-medium text-slate-600">{project.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                project.status === 'At Risk' ? 'bg-rose-500' : 'bg-brand-500'
                              }`} 
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {formatDate(project.deadline)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
