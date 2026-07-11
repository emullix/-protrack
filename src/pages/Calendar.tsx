import React, { useState, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  Briefcase,
  Search,
  ChevronDown
} from 'lucide-react';
import { Task, Project, User, ProjectStatus, Priority } from '../types';
import { formatDate } from '../utils';

interface CalendarProps {
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
  setActiveTab: (tab: string) => void;
  onProjectClick: (projectId: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ projects, tasks, team, filters, setFilters, setActiveTab, onProjectClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { status: filterStatus, priority: filterPriority, search: searchQuery, tag: filterTag, showCompleted, memberId: filterMemberId } = filters;

  const setFilterStatus = (status: ProjectStatus | 'All') => setFilters(prev => ({ ...prev, status }));
  const setFilterPriority = (priority: Priority | 'All') => setFilters(prev => ({ ...prev, priority }));
  const setSearchQuery = (search: string) => setFilters(prev => ({ ...prev, search }));
  const setFilterTag = (tag: string) => setFilters(prev => ({ ...prev, tag }));
  const setFilterMemberId = (memberId: string) => setFilters(prev => ({ ...prev, memberId }));
  const setShowCompleted = (show: boolean) => setFilters(prev => ({ ...prev, showCompleted: show }));

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const statusMatch = filterStatus === 'All' ? (!showCompleted ? p.status !== 'Completed' : true) : p.status === filterStatus;
      const priorityMatch = filterPriority === 'All' || p.priority === filterPriority;
      const searchMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const tagMatch = !filterTag || (p.tags && p.tags.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase())));
      const memberMatch = filterMemberId === 'All' || (p.team && p.team.some(m => m.id === filterMemberId));
      return statusMatch && searchMatch && priorityMatch && tagMatch && memberMatch;
    });
  }, [projects, filterStatus, filterPriority, searchQuery, filterTag, showCompleted, filterMemberId]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const project = projects.find(p => p.id === t.projectId);
      if (!project) return false;

      // Project-level status filter
      const projectStatusMatch = filterStatus === 'All' ? true : project.status === filterStatus;
      
      // Task-level filters
      const priorityMatch = filterPriority === 'All' || t.priority === filterPriority;
      const searchMatch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         project.name.toLowerCase().includes(searchQuery.toLowerCase());
      const memberMatch = filterMemberId === 'All' || (t.assignee && t.assignee.id === filterMemberId);
      const completionMatch = showCompleted ? true : t.status !== 'Completed';
      
      return projectStatusMatch && priorityMatch && searchMatch && memberMatch && completionMatch;
    });
  }, [tasks, projects, filterStatus, filterPriority, searchQuery, filterMemberId, showCompleted]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getDayEvents = (day: Date) => {
    const formattedDay = format(day, 'yyyy-MM-dd');
    const projectDeadlines = filteredProjects.filter(p => p.deadline === formattedDay);
    const taskDeadlines = filteredTasks.filter(t => t.dueDate === formattedDay);
    return [...projectDeadlines.map(p => ({ ...p, type: 'project' })), ...taskDeadlines.map(t => ({ ...t, type: 'task' }))];
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Calendar</h2>
          <p className="text-slate-500">View all project deadlines and task schedules.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            <button 
              onClick={prevMonth}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="px-4 py-1.5 text-sm font-semibold text-slate-800 min-w-[140px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <button 
              onClick={nextMonth}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <button 
            onClick={() => setActiveTab('new-task')}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition-all flex items-center gap-2 shadow-lg shadow-brand-200"
          >
            <Plus size={18} />
            Add Task
          </button>
        </div>
      </div>

      {/* Calendar Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search projects or tasks..." 
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
              id="showCompletedCalendar"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-slate-300"
            />
            <label htmlFor="showCompletedCalendar" className="text-xs font-medium text-slate-600 cursor-pointer select-none">
              Show Completed
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const events = getDayEvents(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isSelected = isSameDay(day, selectedDate);

              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[120px] p-2 border-b border-r border-slate-100 transition-all cursor-pointer hover:bg-slate-50/50 ${
                    !isCurrentMonth ? 'bg-slate-50/30 text-slate-300' : 'text-slate-700'
                  } ${isSelected ? 'bg-brand-50/30 ring-1 ring-inset ring-brand-500/20' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-brand-600 text-white shadow-md shadow-brand-200' : ''
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {events.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                    )}
                  </div>
                    <div className="space-y-1">
                      {events.slice(0, 3).map((event: any, eIdx) => (
                        <div 
                          key={eIdx} 
                          className={`px-2 py-1 rounded text-[10px] font-bold truncate flex items-center gap-1 ${
                            event.type === 'project' 
                              ? 'bg-blue-600 text-white shadow-sm' 
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {event.type === 'project' && <Briefcase size={10} className="shrink-0" />}
                          {event.type === 'task' && <CalendarIcon size={10} className="shrink-0" />}
                          <span>{event.name}</span>
                        </div>
                      ))}
                      {events.length > 3 && (
                        <div className="text-[10px] text-slate-400 font-medium px-2">
                          +{events.length - 3} more
                        </div>
                      )}
                    </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Events for {formatDate(format(selectedDate, 'yyyy-MM-dd'))}</h3>
            <div className="space-y-4">
              {getDayEvents(selectedDate).length > 0 ? (
                getDayEvents(selectedDate).map((event: any, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all group">
                    <div className="flex items-start justify-between mb-2">
                      <div className={`p-2 rounded-lg ${event.type === 'project' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {event.type === 'project' ? <Briefcase size={16} /> : <CalendarIcon size={16} />}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{event.type}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1 group-hover:text-brand-600 transition-colors">{event.name}</h4>
                    {event.type === 'task' && (
                      <p className="text-[11px] text-slate-400 mb-2">
                        Project: <span className="text-slate-600 font-semibold">{projects.find(p => p.id?.toString() === event.projectId?.toString())?.name || event.projectName || 'Unknown'}</span>
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {event.type === 'project' ? 'Deadline' : 'Due Date'}
                      </div>
                      {event.priority && (
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${
                          event.priority === 'High' ? 'bg-rose-50 text-rose-600' : 
                          event.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                        }`}>
                          <span className="w-1 h-1 rounded-full bg-current"></span>
                          {event.priority}
                        </div>
                      )}
                    </div>
                    {event.type === 'project' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                          <span>Progress</span>
                          <span>{event.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${event.progress}%` }}></div>
                        </div>
                      </div>
                    )}
                    <button 
                      onClick={() => {
                        if (event.type === 'project') {
                          onProjectClick(event.id);
                        } else {
                          onProjectClick(event.projectId);
                        }
                      }}
                      className="w-full py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      {event.type === 'project' ? 'View in Projects' : 'View in Tasks'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CalendarIcon size={24} className="text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium">No events scheduled</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
