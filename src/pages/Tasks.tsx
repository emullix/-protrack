import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  CheckCircle2, 
  Clock, 
  Trash2,
  AlertCircle,
  User as UserIcon,
  ChevronDown,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  GripVertical
} from 'lucide-react';
import { Reorder, useDragControls } from 'motion/react';
import { TASKS as INITIAL_TASKS, USERS, MEETINGS } from '../constants';
import { Task, TaskStatus, Priority, Meeting, Project } from '../types';
import { formatDate } from '../utils';

interface TasksProps {
  tasks: Task[];
  meetings: Meeting[];
  setActiveTab: (tab: string) => void;
  onEdit: (task: Task) => void;
  onToggleStatus: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onShowMeetings: (taskId: string) => void;
  initialProjectFilter?: string | null;
  onClearFilter?: () => void;
  projects: Project[];
  onReorder?: (newOrderIds: string[]) => void;
}

const TaskRow: React.FC<{
  task: Task;
  onToggleStatus: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onShowMeetings: (id: string) => void;
  meetings: Meeting[];
  getStatusIcon: (status: TaskStatus) => React.ReactNode;
  getPriorityColor: (priority: Priority) => string;
  value: string;
  isDraggable: boolean;
}> = ({ task, onToggleStatus, onEdit, onDelete, onShowMeetings, meetings, getStatusIcon, getPriorityColor, value, isDraggable }) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item 
      value={value}
      as="tr"
      dragListener={false}
      dragControls={dragControls}
      drag={isDraggable ? 'y' : false}
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hover:bg-slate-50/50 transition-colors group cursor-default select-none"
      onDragStart={() => {
        window.getSelection()?.removeAllRanges();
      }}
    >
      <td className="pl-4 py-4 w-8">
        {isDraggable && (
          <div 
            className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400 p-1 flex items-center justify-center transition-colors"
            onPointerDown={(e) => {
              e.preventDefault();
              dragControls.start(e);
            }}
            style={{ touchAction: 'none' }}
          >
            <GripVertical size={16} />
          </div>
        )}
      </td>
      <td className="px-3 py-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onToggleStatus(task.id)}
            className="focus:outline-none hover:scale-110 transition-transform"
          >
            {getStatusIcon(task.status)}
          </button>
          <span 
            onClick={() => onToggleStatus(task.id)}
            className={`text-sm font-medium text-slate-800 cursor-pointer hover:text-brand-600 transition-colors ${task.status === 'Completed' ? 'line-through text-slate-400' : ''}`}
          >
            {task.name}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="text-xs font-medium text-brand-600">
          {task.projectName}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`text-xs font-medium ${
          task.status === 'Completed' ? 'text-emerald-600' :
          task.status === 'In Progress' ? 'text-blue-600' :
          task.status === 'Review' ? 'text-amber-600' :
          'text-slate-500'
        }`}>
          {task.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">{task.assignee.name}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
          {formatDate(task.dueDate)}
        </div>
      </td>
      <td className="px-6 py-4">
        <button 
          onClick={() => onShowMeetings(task.id)}
          className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
        >
          <MapPin size={14} />
          {meetings.filter(m => m.taskId === task.id).length}
        </button>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={() => onEdit(task)}
            className="text-slate-400 hover:text-brand-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
            title="Edit"
          >
            <MoreHorizontal size={18} />
          </button>
          <button 
            onClick={() => onDelete(task.id)}
            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </Reorder.Item>
  );
};

const Tasks: React.FC<TasksProps> = ({ 
  tasks, 
  meetings, 
  setActiveTab, 
  onEdit, 
  onToggleStatus, 
  onDelete, 
  onShowMeetings,
  initialProjectFilter,
  onClearFilter,
  projects,
  onReorder
}) => {
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'All'>('All');
  const [filterProject, setFilterProject] = useState<string>(initialProjectFilter || 'All');
  const [filterPriority, setFilterPriority] = useState<Priority | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sync internal filter state with prop if it changes
  React.useEffect(() => {
    if (initialProjectFilter) {
      setFilterProject(initialProjectFilter);
    }
  }, [initialProjectFilter]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterProject, filterPriority, searchQuery]);

  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'All' || task.status === filterStatus;
    const projectMatch = filterProject === 'All' || task.projectId === filterProject;
    const priorityMatch = filterPriority === 'All' || task.priority === filterPriority;
    const searchMatch = task.name.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && projectMatch && priorityMatch && searchMatch;
  });

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'In Progress': return <Clock size={16} className="text-blue-500" />;
      case 'Review': return <AlertCircle size={16} className="text-amber-500" />;
      case 'To Do': return <div className="w-4 h-4 rounded-full border-2 border-slate-300" />;
      default: return null;
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
          <h2 className="text-2xl font-bold text-slate-800">Tasks</h2>
          <p className="text-slate-500">Track and manage individual tasks across all projects.</p>
        </div>
        <button 
          onClick={() => setActiveTab('new-task')}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition-all flex items-center gap-2 shadow-lg shadow-brand-200"
        >
          <Plus size={18} />
          Add New Task
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {filterProject !== 'All' && (
            <button 
              onClick={() => {
                setFilterProject('All');
                onClearFilter?.();
              }}
              className="flex items-center gap-2 px-3 py-2 bg-brand-50 text-brand-600 rounded-lg text-sm font-medium hover:bg-brand-100 transition-all whitespace-nowrap"
            >
              <X size={14} />
              <span>Clear Project Filter</span>
            </button>
          )}
          <div className="relative group">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Completed">Completed</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative group">
            <select 
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
            >
              <option value="All">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="pl-4 py-4 w-8"></th>
                <th className="px-3 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Task Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Project</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Assignee</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <Reorder.Group 
              as="tbody" 
              axis="y" 
              values={paginatedTasks.map(t => t.id)} 
              onReorder={onReorder || (() => {})}
              className={`divide-y divide-slate-100 ${filterProject !== 'All' ? 'select-none touch-none' : ''}`}
            >
              {paginatedTasks.map((task) => (
                <TaskRow 
                  key={task.id} 
                  task={task} 
                  value={task.id}
                  onToggleStatus={onToggleStatus} 
                  onEdit={onEdit} 
                  onDelete={onDelete} 
                  onShowMeetings={onShowMeetings} 
                  meetings={meetings}
                  getStatusIcon={getStatusIcon}
                  getPriorityColor={getPriorityColor}
                  isDraggable={filterProject !== 'All'}
                />
              ))}
            </Reorder.Group>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-slate-50 px-6 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-500 font-medium">
              Showing <span className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, filteredTasks.length)}</span> of <span className="text-slate-800">{filteredTasks.length}</span> tasks
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

        {filteredTasks.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-slate-300" />
            </div>
            <h3 className="text-slate-800 font-semibold">No tasks found</h3>
            <p className="text-slate-500 text-sm">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
