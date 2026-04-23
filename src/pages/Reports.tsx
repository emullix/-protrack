import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Project, Task, User, ProjectStatus, Priority } from '../types';
import { 
  BarChart2, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Briefcase,
  ArrowRight,
  Search,
  Filter,
  ChevronDown,
  FileDown
} from 'lucide-react';


interface ReportsProps {
  projects: Project[];
  tasks: Task[];
  team: User[];
  filters: {
    status: ProjectStatus | 'All';
    priority: Priority | 'All';
    search: string;
    tag: string;
    memberId: string;
    showCompleted: boolean;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    status: ProjectStatus | 'All';
    priority: Priority | 'All';
    search: string;
    tag: string;
    memberId: string;
    showCompleted: boolean;
  }>>;
  onProjectClick: (projectId: string) => void;
}

const COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
    </div>
    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
    <p className="text-2xl font-bold text-slate-800">{value}</p>
  </div>
);

const Reports: React.FC<ReportsProps> = ({ projects, tasks, team, filters, setFilters, onProjectClick }) => {
  const { status: filterStatus, priority: filterPriority, search: searchQuery, tag: filterTag, showCompleted, memberId: filterMemberId } = filters;

  const setFilterStatus = (status: ProjectStatus | 'All') => setFilters(prev => ({ ...prev, status }));
  const setFilterPriority = (priority: Priority | 'All') => setFilters(prev => ({ ...prev, priority }));
  const setSearchQuery = (search: string) => setFilters(prev => ({ ...prev, search }));
  const setFilterTag = (tag: string) => setFilters(prev => ({ ...prev, tag }));
  const setFilterMemberId = (memberId: string) => setFilters(prev => ({ ...prev, memberId }));
  const setShowCompleted = (show: boolean) => setFilters(prev => ({ ...prev, showCompleted: show }));

  // Filtered projects for the assignments section
  const filteredProjects = projects.filter(p => {
    const statusMatch = filterStatus === 'All' ? (!showCompleted ? p.status !== 'Completed' : true) : p.status === filterStatus;
    const priorityMatch = filterPriority === 'All' || p.priority === filterPriority;
    const searchMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const tagMatch = !filterTag || (p.tags && p.tags.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase())));
    const memberMatch = filterMemberId === 'All' || (p.team && p.team.some(m => m.id === filterMemberId));
    return statusMatch && searchMatch && priorityMatch && tagMatch && memberMatch;
  });

  // 1. Project Status Distribution
  const statusData = [
    { name: 'Active', value: projects.filter(p => p.status === 'Active').length },
    { name: 'In Progress', value: projects.filter(p => p.status === 'In Progress').length },
    { name: 'Completed', value: projects.filter(p => p.status === 'Completed').length },
    { name: 'At Risk', value: projects.filter(p => p.status === 'At Risk').length },
    { name: 'On Hold', value: projects.filter(p => p.status === 'On Hold').length },
  ].filter(item => item.value > 0);

  // 2. Task Progress by Project (Top 6)
  const projectProgressData = projects
    .slice(0, 6)
    .map(p => ({
      name: p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name,
      completed: p.completedTasksCount,
      remaining: p.tasksCount - p.completedTasksCount,
      total: p.tasksCount
    }));

  // 3. Team Workload (Tasks per member)
  const teamWorkloadData = team.map(member => ({
    name: (member.name || 'Unknown').split(' ')[0],
    tasks: tasks.filter(t => t.assignee && t.assignee.id === member.id).length,
    completed: tasks.filter(t => t.assignee && t.assignee.id === member.id && t.status === 'Completed').length
  })).sort((a, b) => b.tasks - a.tasks).slice(0, 6);

  // 4. Global Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const globalProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 5. Team Assignments Data
  const memberAssignments = team.map(member => {
    const memberProjects = filteredProjects.filter(p => {
      const inTeam = p.team && p.team.some(m => m.id === member.id);
      const hasTasks = tasks.some(t => t.projectId === p.id && t.assignee && t.assignee.id === member.id);
      return inTeam || hasTasks;
    });
    const assignments = memberProjects.map(project => {
      const memberTasks = tasks.filter(t => t.assignee && t.assignee.id === member.id && t.projectId === project.id);
      const inProgressTask = memberTasks.find(t => t.status === 'In Progress');
      const nextTask = memberTasks
        .filter(t => t.status !== 'Completed' && t.status !== 'In Progress')
        .sort((a, b) => a.position - b.position)[0];
      return { project, inProgressTask, nextTask };
    });
    return { member, assignments };
  }).filter(ma => ma.assignments.length > 0);
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 print:p-0">
      {/* Print-only Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-break-inside-avoid {
            break-inside: avoid;
          }
          @page {
            margin: 15mm;
            size: auto;
          }
        }
      `}} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reports & Analytics</h2>
          <p className="text-slate-500">Insights and performance metrics for your workspace.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Global Progress</p>
              <p className="text-sm font-bold text-slate-800">{globalProgress}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Projects" 
          value={projects.length} 
          icon={<BarChart2 className="text-blue-600" size={20} />}
          color="bg-blue-50"
        />
        <StatCard 
          title="Completed Tasks" 
          value={completedTasks} 
          icon={<CheckCircle2 className="text-emerald-600" size={20} />}
          color="bg-emerald-50"
        />
        <StatCard 
          title="Team Members" 
          value={team.length} 
          icon={<Users className="text-brand-600" size={20} />}
          color="bg-brand-50"
        />
        <StatCard 
          title="Active Issues" 
          value={projects.filter(p => p.status === 'At Risk').length} 
          icon={<AlertCircle className="text-rose-600" size={20} />}
          color="bg-rose-50"
        />
      </div>


      {/* Reports Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter assignments by project..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="relative group min-w-[130px]">
            <select 
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
            >
              <option value="All">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative group min-w-[150px]">
            <select 
              value={filterMemberId}
              onChange={(e) => setFilterMemberId(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
            >
              <option value="All">All Members</option>
              {team.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative group min-w-[130px]">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="At Risk">At Risk</option>
              <option value="On Hold">On Hold</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
            <input 
              type="checkbox" 
              id="showCompletedReports"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-slate-300"
            />
            <label htmlFor="showCompletedReports" className="text-xs font-medium text-slate-600 cursor-pointer select-none">
              Show Completed
            </label>
          </div>
        </div>
      </div>

      {/* Team Assignments & Next Steps */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-brand-600" />
            <h3 className="text-xl font-bold text-slate-800">Team Assignments & Next Steps</h3>
          </div>
          
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm no-print"
          >
            <FileDown size={16} />
            Export PDF
          </button>
        </div>
        
        <div id="printable-report" className="p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memberAssignments.map(({ member, assignments }) => (
            <div key={member.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col print-break-inside-avoid">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold border-2 border-white">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 leading-none">{member.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{assignments.length} Projects assigned</p>
                </div>
              </div>
              
              <div className="p-4 flex-1 space-y-5">
                {assignments.map(({ project, inProgressTask, nextTask }) => (
                  <div key={project.id} className="space-y-3">
                    <div 
                      onClick={() => onProjectClick(project.id)}
                      className="flex items-center gap-2 cursor-pointer group/proj hover:translate-x-1 transition-transform"
                    >
                      <Briefcase size={14} className="text-slate-400 group-hover/proj:text-brand-500 transition-colors" />
                      <span className="text-sm font-semibold text-slate-700 truncate group-hover/proj:text-brand-600 transition-colors underline-offset-4 decoration-brand-200 decoration-2 group-hover/proj:underline">
                        {project.name}
                      </span>
                    </div>
                    
                    <div className="ml-6 space-y-2">
                      {inProgressTask && (
                        <div className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100/50 flex items-start gap-2 group hover:bg-emerald-50 transition-colors">
                          <CheckCircle2 size={14} className="text-emerald-500 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">In Progress</p>
                            <p className="text-xs text-slate-700 font-medium line-clamp-1">{inProgressTask.title || inProgressTask.name}</p>
                          </div>
                        </div>
                      )}
                      
                      {nextTask ? (
                        <div className="p-2.5 bg-brand-50/50 rounded-lg border border-brand-100/50 flex items-start gap-2 group hover:bg-brand-50 transition-colors">
                          <ArrowRight size={14} className="text-brand-500 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider mb-0.5">Next Task</p>
                            <p className="text-xs text-slate-700 font-medium line-clamp-1">{nextTask.title || nextTask.name}</p>
                          </div>
                        </div>
                      ) : !inProgressTask && (
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100/50">
                          <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            No pending tasks
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
};


export default Reports;
