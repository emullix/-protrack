import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Trash2,
  LayoutGrid,
  List as ListIcon,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Project, ProjectStatus, Priority, Meeting, User } from '../types';
import { MEETINGS } from '../constants';
import { formatDate, getInitials, getAvatarColor } from '../utils';
import Tooltip from '../components/Tooltip';

interface ProjectsProps {
  projects: Project[];
  meetings: Meeting[];
  setActiveTab: (tab: string) => void;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onShowMeetings: (projectId: string) => void;
  onProjectClick?: (projectId: string) => void;
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
  view: 'grid' | 'list';
  setView: React.Dispatch<React.SetStateAction<'grid' | 'list'>>;
  team: User[];
}

const Projects: React.FC<ProjectsProps> = ({ 
  projects, 
  meetings, 
  setActiveTab, 
  onEdit, 
  onDelete, 
  onShowMeetings, 
  onProjectClick,
  filters,
  setFilters,
  view,
  setView,
  team
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const { status: filterStatus, priority: filterPriority, search: searchQuery, tag: filterTag, showCompleted, memberId: filterMemberId } = filters;

  const setFilterStatus = (status: ProjectStatus | 'All') => setFilters(prev => ({ ...prev, status }));
  const setFilterPriority = (priority: Priority | 'All') => setFilters(prev => ({ ...prev, priority }));
  const setSearchQuery = (search: string) => setFilters(prev => ({ ...prev, search }));
  const setFilterTag = (tag: string) => setFilters(prev => ({ ...prev, tag }));
  const setFilterMemberId = (memberId: string) => setFilters(prev => ({ ...prev, memberId }));
  const setShowCompleted = (show: boolean) => setFilters(prev => ({ ...prev, showCompleted: show }));

  // Reset page when filter or search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterPriority, searchQuery, filterTag, filterMemberId, showCompleted]);

  const filteredProjects = projects.filter(p => {
    const statusMatch = filterStatus === 'All' 
      ? (showCompleted ? true : p.status !== 'Completed')
      : p.status === filterStatus;
    const priorityMatch = filterPriority === 'All' || p.priority === filterPriority;
    const searchMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const tagMatch = !filterTag || (p.tags && p.tags.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase())));
    const memberMatch = filterMemberId === 'All' || (p.team && p.team.some(m => m.id === filterMemberId));
    return statusMatch && searchMatch && priorityMatch && tagMatch && memberMatch;
  });
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  // Adjust page if it exceeds total pages (e.g. after changing items per page or filtering)
  React.useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'Active': return 'text-brand-600';
      case 'In Progress': return 'text-blue-600';
      case 'Completed': return 'text-emerald-600';
      case 'At Risk': return 'text-rose-600';
      case 'On Hold': return 'text-slate-600';
      default: return 'text-slate-600';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'High': return 'text-rose-600';
      case 'Medium': return 'text-amber-600';
      case 'Low': return 'text-emerald-600';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Projects</h2>
          <p className="text-slate-500">Manage and track all your active projects.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            <button 
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-md transition-all ${view === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setView('list')}
              className={`p-1.5 rounded-md transition-all ${view === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="relative group">
            <select 
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
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
          <div className="relative flex-1 sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter by tag..." 
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {filterStatus === 'All' && (
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={showCompleted}
                  onChange={() => setShowCompleted(!showCompleted)}
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                <span className="ml-2 text-xs font-medium text-slate-500 whitespace-nowrap">Show Completed</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginatedProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <span className={`text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                      className="text-slate-400 hover:text-brand-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
                      title="Edit"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <h3 
                  onClick={() => onProjectClick?.(project.id)}
                  className="text-lg font-bold text-slate-800 mb-2 group-hover:text-brand-600 transition-colors cursor-pointer"
                >
                  {project.name}
                </h3>
                <Tooltip text={project.description}>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4 cursor-help">{project.description}</p>
                </Tooltip>
                
                {project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-semibold text-slate-800">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        project.status === 'At Risk' ? 'bg-rose-500' : 
                        project.status === 'Completed' ? 'bg-emerald-500' : 'bg-brand-500'
                      }`} 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {project.team.slice(0, 4).map((member) => (
                    <div key={member.id} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold shadow-sm ${getAvatarColor(member.name)}`}>
                      {getInitials(member.name)}
                    </div>
                  ))}
                  {project.team.length > 4 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      +{project.team.length - 4}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    {project.completedTasksCount}/{project.tasksCount}
                  </div>
                  <button 
                    onClick={() => onShowMeetings(project.id)}
                    className="flex items-center gap-1 hover:text-brand-600 transition-colors"
                  >
                    <MapPin size={14} className="text-brand-500" />
                    {meetings.filter(m => m.projectId === project.id).length}
                  </button>
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <Calendar size={14} />
                    {formatDate(project.deadline)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="pl-4 py-3 w-8"></th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setActiveTab('new-project')}
                        className="hover:bg-slate-100 hover:text-brand-600 p-0.5 rounded transition-all inline-flex items-center justify-center"
                        title="Add New Project"
                      >
                        <Plus size={16} strokeWidth={3.5} />
                      </button>
                      <span>Project</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Team</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Deadline</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50/50 transition-all cursor-pointer group" onClick={() => onProjectClick?.(project.id)}>
                    <td className="pl-4 py-2 w-8"></td>
                    <td className="px-6 py-2">
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">{project.name}</p>
                      <div className="flex items-center gap-2">
                      <Tooltip text={project.description}>
                        <p className="text-xs text-slate-500 truncate max-w-[150px] cursor-help">{project.description}</p>
                      </Tooltip>
                        {project.tags.length > 0 && (
                          <div className="flex gap-1">
                            {project.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase">
                                {tag}
                              </span>
                            ))}
                            {project.tags.length > 2 && <span className="text-[9px] text-slate-400 font-bold">+{project.tags.length - 2}</span>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-2">
                      <span className={`inline-flex items-center text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-2">
                      <span className={`text-xs font-semibold ${getPriorityColor(project.priority)}`}>
                        {project.priority}
                      </span>
                    </td>
                    <td className="px-6 py-2">
                      <div className="flex -space-x-2">
                        {project.team.slice(0, 3).map((member) => (
                          <div key={member.id} className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold shadow-sm ${getAvatarColor(member.name)}`}>
                            {getInitials(member.name)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-2 text-sm text-slate-500 whitespace-nowrap">
                      {formatDate(project.deadline)}
                    </td>
                    <td className="px-6 py-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-[80px] bg-slate-100 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${
                              project.status === 'At Risk' ? 'bg-rose-500' : 'bg-brand-500'
                            }`} 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-slate-600">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onEdit(project); }}
                          className="text-slate-400 hover:text-brand-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
                          title="Edit"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-slate-50 px-6 py-4 border-t border-slate-100">
              <p className="text-sm text-slate-500 font-medium">
                Showing <span className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, filteredProjects.length)}</span> of <span className="text-slate-800">{filteredProjects.length}</span> projects
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        currentPage === page 
                          ? 'bg-brand-600 text-white' 
                          : 'text-slate-500 hover:bg-white'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Projects;
