import React, { useState } from 'react';
import { format } from 'date-fns';
import { MapPin, Clock, Users, Calendar as CalendarIcon, Plus, Trash2, Edit2, Briefcase, CheckSquare, X, ChevronLeft, ChevronDown, Search, ChevronRight as LucideChevronRight } from 'lucide-react';
import { Meeting, Project, Task, User, ProjectStatus, Priority } from '../types';
import { formatDate, formatTime } from '../utils';

interface MeetingsProps {
  meetings: Meeting[];
  projects: Project[];
  tasks: Task[];
  team: User[];
  filter?: { projectId?: string; taskId?: string } | null;
  onClearFilter?: () => void;
  onFilter?: (filter: { projectId?: string; taskId?: string }) => void;
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
  onSchedule?: (meeting: Meeting) => void;
  onUpdateMeeting?: (meeting: Meeting) => void;
  onDelete?: (id: string) => void;
  onQuickProject?: (name: string) => Promise<string>;
  onQuickTask?: (name: string, projectId: string) => Promise<void>;
}

const Meetings: React.FC<MeetingsProps> = ({ 
  meetings, 
  projects,
  tasks,
  team,
  filter, 
  onClearFilter, 
  onFilter, 
  filters, 
  setFilters,
  onSchedule, 
  onUpdateMeeting,
  onDelete,
  onQuickProject,
  onQuickTask
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommentOnly, setIsCommentOnly] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [quickProjectName, setQuickProjectName] = useState('');
  const [quickTaskName, setQuickTaskName] = useState('');
  const [sessionProjectId, setSessionProjectId] = useState('');
  const [sessionTasks, setSessionTasks] = useState<{name: string, projectId: string}[]>([]);
  const [sessionProjects, setSessionProjects] = useState<{id: string, name: string}[]>([]);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: '',
    time: '',
    projectId: '',
    taskId: '',
    location: 'Conference Room A',
    description: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { status: filterStatus, priority: filterPriority, search: searchQuery, showCompleted, memberId: filterMemberId } = filters;

  const setFilterStatus = (status: ProjectStatus | 'All') => setFilters(prev => ({ ...prev, status }));
  const setFilterPriority = (priority: Priority | 'All') => setFilters(prev => ({ ...prev, priority }));
  const setSearchQuery = (search: string) => setFilters(prev => ({ ...prev, search }));
  const setFilterMemberId = (memberId: string) => setFilters(prev => ({ ...prev, memberId }));
  const setShowCompleted = (show: boolean) => setFilters(prev => ({ ...prev, showCompleted: show }));

  const filteredMeetings = meetings
    .filter(meeting => {
      // 0. Navigation Filters (projectId / taskId from other pages)
      if (filter) {
        if (filter.projectId && meeting.projectId !== filter.projectId) return false;
        if (filter.taskId && meeting.taskId !== filter.taskId) return false;
      }

      // 1. Search Query
      const searchMatch = !searchQuery || 
                         meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         meeting.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Status Match
      const statusMatch = filterStatus === 'All' || 
                         (filterStatus === 'Completed' ? meeting.status === 'Completed' : meeting.status !== 'Completed');

      // 3. Completion Match
      const completionMatch = showCompleted ? true : meeting.status !== 'Completed';

      // 4. Associated Project/Task Property Filters
      const project = projects.find(p => p.id === meeting.projectId);
      const task = tasks.find(t => t.id === meeting.taskId);

      // Priority Filter (from project or task)
      const targetPriority = task?.priority || project?.priority || 'Medium';
      const priorityMatch = filterPriority === 'All' || targetPriority === filterPriority;

      // Member Filter (from project or task)
      const isMemberMatch = filterMemberId === 'All' || 
                           (task?.assignee?.id === filterMemberId) || 
                           (project?.team && project.team.some(m => m.id === filterMemberId));

      return searchMatch && statusMatch && completionMatch && priorityMatch && isMemberMatch;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime();
    });

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters, filter]);

  const totalPages = Math.ceil(filteredMeetings.length / itemsPerPage);
  const paginatedMeetings = filteredMeetings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSchedule = () => {
    // Only force default title/date/time if it's a NEW comment
    const isNew = !editingMeetingId;
    const meetingTitle = (isCommentOnly && isNew) ? 'Comentario' : newMeeting.title;
    const meetingDate = (isCommentOnly && isNew) ? format(new Date(), 'yyyy-MM-dd') : newMeeting.date;
    const meetingTime = (isCommentOnly && isNew) ? format(new Date(), 'HH:mm') : newMeeting.time;

    if (!meetingTitle || !meetingDate || !meetingTime) return;

    const project = projects.find(p => p.id === newMeeting.projectId);
    const task = tasks.find(t => t.id === newMeeting.taskId);

    const originalMeeting = editingMeetingId ? meetings.find(m => m.id === editingMeetingId) : null;

    const meeting: Meeting = {
      id: editingMeetingId || `m${Date.now()}`,
      title: meetingTitle,
      date: meetingDate,
      time: meetingTime,
      attendees: originalMeeting?.attendees || 1,
      location: isCommentOnly ? '' : newMeeting.location,
      status: isCommentOnly ? 'Comment' : ((originalMeeting?.status === 'Comment') ? 'Upcoming' : (originalMeeting?.status || 'Upcoming')),
      color: originalMeeting?.color || 'bg-brand-500',
      projectId: newMeeting.projectId || null,
      projectName: project?.name,
      taskId: newMeeting.taskId || null,
      taskName: task?.name,
      description: newMeeting.description,
      memberId: newMeeting.memberId || null
    };

    if (editingMeetingId) {
      onUpdateMeeting?.(meeting);
    } else {
      onSchedule?.(meeting);
    }
    
    setIsModalOpen(false);
    setEditingMeetingId(null);
    setNewMeeting({ title: '', date: '', time: '', projectId: '', taskId: '', memberId: '', location: 'Conference Room A', description: '' });
  };

  const activeFilterName = filter?.projectId 
    ? projects.find(p => p.id === filter.projectId)?.name 
    : filter?.taskId 
      ? tasks.find(t => t.id === filter.taskId)?.name 
      : null;

  const handleSaveDescription = () => {
    if (selectedMeeting) {
      const updatedMeeting = { ...selectedMeeting, description: editDescription };
      onUpdateMeeting?.(updatedMeeting);
      setSelectedMeeting(updatedMeeting);
      setIsEditing(false);
    }
  };

  const openDetail = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setEditDescription(meeting.description || '');
    setIsEditing(false);
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingMeetingId(meeting.id);
    setNewMeeting({
      title: meeting.title,
      date: meeting.date,
      time: meeting.time,
      projectId: meeting.projectId || '',
      taskId: meeting.taskId || '',
      memberId: meeting.memberId || '',
      location: meeting.location,
      description: meeting.description || ''
    });
    setIsCommentOnly(meeting.status === 'Comment');
    setIsModalOpen(true);
  };

  const handleStartMeeting = () => {
    if (selectedMeeting) {
      setIsSessionOpen(true);
      setEditDescription(selectedMeeting.description || '');
      // If the meeting already has a project, select it
      if (selectedMeeting.projectId) {
        setSessionProjectId(selectedMeeting.projectId);
      }
    }
  };

  const handleQuickProjectAdd = async () => {
    if (!quickProjectName || !onQuickProject) return;
    const newId = await onQuickProject(quickProjectName);
    setSessionProjects(prev => [...prev, { id: newId, name: quickProjectName }]);
    setSessionProjectId(newId);
    setQuickProjectName('');
  };

  const handleQuickTaskAdd = async () => {
    if (!quickTaskName || !sessionProjectId || !onQuickTask) return;
    await onQuickTask(quickTaskName, sessionProjectId);
    setSessionTasks(prev => [...prev, { name: quickTaskName, projectId: sessionProjectId }]);
    setQuickTaskName('');
  };

  const handleEndMeeting = () => {
    if (selectedMeeting) {
      // If it's a comment, keep it as a comment when finishing the session
      const newStatus = selectedMeeting.status === 'Comment' ? 'Comment' : 'Completed';
      const updatedMeeting = { ...selectedMeeting, description: editDescription, status: newStatus as any };
      onUpdateMeeting?.(updatedMeeting);
    }
    setIsSessionOpen(false);
    setSelectedMeeting(null);
    setSessionTasks([]);
    setSessionProjects([]);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Activity</h2>
          <p className="text-slate-500">Schedule and manage your team syncs and client calls.</p>
        </div>
        <div className="flex items-center gap-3">
          {filter && (
            <button 
              onClick={onClearFilter}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all"
            >
              <X size={14} />
              <span>Clear Filter: {activeFilterName}</span>
            </button>
          )}
          <button 
            onClick={() => {
              const initialMeeting = {
                title: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                time: format(new Date(), 'HH:mm'),
                projectId: filter?.projectId || (filters.memberId !== 'All' ? projects.find(p => p.team.some(m => m.id === filters.memberId))?.id || '' : ''),
                taskId: filter?.taskId || '',
                memberId: filters.memberId !== 'All' ? filters.memberId : '',
                location: 'Conference Room A',
                description: ''
              };

              setNewMeeting(initialMeeting);
              setIsCommentOnly(false);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
          >
            <Plus size={20} />
            <span>Activity</span>
          </button>
        </div>
      </div>

      {/* Activity Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search activities..." 
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
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
            <input 
              type="checkbox" 
              id="showCompletedActivity"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-slate-300"
            />
            <label htmlFor="showCompletedActivity" className="text-xs font-medium text-slate-600 cursor-pointer select-none">
              Show Completed
            </label>
          </div>
        </div>
      </div>

      {/* Schedule Meeting Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">{editingMeetingId ? 'Edit Activity' : 'Schedule New Activity'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingMeetingId(null); }} className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2">
                <input 
                  type="checkbox" 
                  id="isCommentOnly"
                  checked={isCommentOnly}
                  onChange={(e) => setIsCommentOnly(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="isCommentOnly" className="text-sm font-bold text-slate-700 cursor-pointer">Solo agregar comentario</label>
              </div>

              {!isCommentOnly && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Activity Title</label>
                    <input 
                      type="text" 
                      value={newMeeting.title}
                      onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                      placeholder="e.g. Weekly Sync" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Date</label>
                  <input 
                    type="date" 
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting({...newMeeting, date: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Time</label>
                  <input 
                    type="time" 
                    value={newMeeting.time}
                    onChange={(e) => setNewMeeting({...newMeeting, time: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                  />
                </div>
              </div>
              </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Briefcase size={14} className="text-brand-600" />
                    Associate Project
                  </label>
                  <select 
                    value={newMeeting.projectId}
                    onChange={(e) => setNewMeeting({...newMeeting, projectId: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
                  >
                    <option value="">None</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <CheckSquare size={14} className="text-slate-600" />
                    Associate Task
                  </label>
                  <select 
                    value={newMeeting.taskId}
                    onChange={(e) => setNewMeeting({...newMeeting, taskId: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
                  >
                    <option value="">None</option>
                    {tasks.filter(t => !newMeeting.projectId || t.projectId === newMeeting.projectId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Users size={14} className="text-slate-600" />
                  Responsible Member
                </label>
                <select 
                  value={newMeeting.memberId}
                  onChange={(e) => setNewMeeting({...newMeeting, memberId: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
                >
                  <option value="">Select Member</option>
                  {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              {!isCommentOnly && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Location / Room</label>
                  <select 
                    value={newMeeting.location}
                    onChange={(e) => setNewMeeting({...newMeeting, location: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
                  >
                    <option>Conference Room A</option>
                    <option>Conference Room B</option>
                    <option>Creative Studio</option>
                    <option>Main Boardroom</option>
                    <option>Huddle Room</option>
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{isCommentOnly ? 'Comentario' : 'Activity Description / Agenda'}</label>
                <textarea 
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 min-h-[100px]" 
                  placeholder="What is this activity about?"
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button onClick={() => { setIsModalOpen(false); setEditingMeetingId(null); }} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-all">Cancel</button>
              <button onClick={handleSchedule} className="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200">
                {editingMeetingId ? 'Save Changes' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Detail Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${selectedMeeting.color} flex items-center justify-center text-white`}>
                  <MapPin size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  {selectedMeeting.status === 'Comment' ? `Comentario: ${selectedMeeting.description || ''}` : selectedMeeting.title}
                </h3>
              </div>
              <button onClick={() => setSelectedMeeting(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <CalendarIcon size={18} className="text-brand-600" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Date</p>
                    <p className="text-sm font-bold text-slate-700">{formatDate(selectedMeeting.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Clock size={18} className="text-brand-600" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Time</p>
                    <p className="text-sm font-bold text-slate-700">{formatTime(selectedMeeting.time)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <MapPin size={18} className="text-brand-600" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Location</p>
                    <p className="text-sm font-bold text-slate-700">{selectedMeeting.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Users size={18} className="text-brand-600" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Attendees</p>
                    <p className="text-sm font-bold text-slate-700">{selectedMeeting.attendees} People</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-700">{selectedMeeting.status === 'Comment' ? 'Comentario' : 'Activity Description / Agenda'}</h4>
                  <div className="flex items-center gap-3">
                    {!isEditing ? (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700"
                      >
                        Edit {selectedMeeting.status === 'Comment' ? 'Comment' : 'Description'}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                         <button 
                          onClick={() => setIsEditing(false)}
                          className="text-xs font-bold text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSaveDescription}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    )}
                    <button 
                      onClick={() => {
                        const meetingToEdit = selectedMeeting;
                        setSelectedMeeting(null);
                        if (meetingToEdit) handleEdit(meetingToEdit);
                      }}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 border-l border-slate-200 pl-3"
                    >
                      Advanced Edit
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 min-h-[120px]">
                  {isEditing ? (
                    <textarea 
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full bg-transparent text-sm text-slate-600 leading-relaxed focus:outline-none min-h-[100px]"
                      placeholder="Write what the meeting was about..."
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {selectedMeeting.description || "No description provided for this activity."}
                    </p>
                  )}
                </div>
              </div>

              {(selectedMeeting.projectName || selectedMeeting.taskName) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-700">Linked To</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMeeting.projectName && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg text-xs font-bold border border-brand-100">
                        <Briefcase size={14} />
                        {selectedMeeting.projectName}
                      </div>
                    )}
                    {selectedMeeting.taskName && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200">
                        <CheckSquare size={14} />
                        {selectedMeeting.taskName}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button 
                onClick={handleStartMeeting}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
              >
                <Clock size={18} />
                <span>Start Activity</span>
              </button>
              <button onClick={() => setSelectedMeeting(null)} className="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Session Modal (The active meeting workspace) */}
      {isSessionOpen && selectedMeeting && (
        <div className="fixed inset-0 bg-slate-900 z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
          {/* Session Header */}
          <div className="bg-slate-800 p-4 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white animate-pulse">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg leading-none">{selectedMeeting.title}</h3>
                <p className="text-emerald-400 text-xs font-bold mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                  Activity in Progress
                </p>
              </div>
            </div>
            <button 
              onClick={handleEndMeeting}
              className="px-6 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-900/20"
            >
              End Activity
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Left Column: Notes & Agenda */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 border-r border-slate-800">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Activity Notes / Minutes</h4>
                  <span className="text-slate-500 text-xs">Auto-saving...</span>
                </div>
                <textarea 
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-800/50 text-slate-200 p-6 rounded-2xl border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none min-h-[400px] transition-all text-lg leading-relaxed"
                  placeholder="Start typing what the activity is about, key points, decisions..."
                  autoFocus
                />
              </div>
            </div>

            {/* Right Column: Quick Actions (Projects & Tasks) */}
            <div className="w-full md:w-96 bg-slate-800/30 p-6 overflow-y-auto space-y-8">
              {/* Quick Project Creation */}
              <div className="space-y-4">
                <h4 className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Briefcase size={16} className="text-emerald-500" />
                  Quick Project
                </h4>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={quickProjectName}
                    onChange={(e) => setQuickProjectName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleQuickProjectAdd()}
                    placeholder="New project name..."
                    className="flex-1 bg-slate-800 text-slate-200 px-4 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 outline-none text-sm"
                  />
                  <button 
                    onClick={handleQuickProjectAdd}
                    className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                
                {sessionProjects.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-slate-500 text-[10px] uppercase font-bold">Created in this session:</p>
                    <div className="flex flex-wrap gap-2">
                      {sessionProjects.map(p => (
                        <button 
                          key={p.id}
                          onClick={() => setSessionProjectId(p.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sessionProjectId === p.id ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Task Creation */}
              <div className="space-y-4">
                <h4 className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare size={16} className="text-brand-500" />
                  Quick Tasks
                </h4>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-slate-500 text-[10px] uppercase font-bold">Target Project</label>
                    <select 
                      value={sessionProjectId}
                      onChange={(e) => setSessionProjectId(e.target.value)}
                      className="w-full bg-slate-800 text-slate-200 px-4 py-2 rounded-lg border border-slate-700 focus:border-brand-500 outline-none text-sm"
                    >
                      <option value="">Select Project</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      {sessionProjects.map(p => <option key={p.id} value={p.id}>{p.name} (New)</option>)}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={quickTaskName}
                      onChange={(e) => setQuickTaskName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleQuickTaskAdd()}
                      placeholder="New task name..."
                      disabled={!sessionProjectId}
                      className="flex-1 bg-slate-800 text-slate-200 px-4 py-2 rounded-lg border border-slate-700 focus:border-brand-500 outline-none text-sm disabled:opacity-50"
                    />
                    <button 
                      onClick={handleQuickTaskAdd}
                      disabled={!sessionProjectId}
                      className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all disabled:opacity-50"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Session Task List */}
                <div className="space-y-2 mt-4">
                  <p className="text-slate-500 text-[10px] uppercase font-bold">Tasks added:</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {sessionTasks.length === 0 ? (
                      <p className="text-slate-600 text-xs italic">No tasks added yet.</p>
                    ) : (
                      sessionTasks.map((t, i) => (
                        <div key={i} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                            <div>
                              <p className="text-slate-200 text-sm font-medium">{t.name}</p>
                              <p className="text-slate-500 text-[10px]">{projects.find(p => p.id === t.projectId)?.name || sessionProjects.find(p => p.id === t.projectId)?.name}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Upcoming Activity</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarIcon size={16} />
                <span>March 2026</span>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {paginatedMeetings.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Clock size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 mb-1">No activities found</h4>
                  <p className="text-slate-500">Adjust your filters or schedule a new activity.</p>
                </div>
              ) : (
                paginatedMeetings.map((meeting) => (
                  <div 
                    key={meeting.id} 
                    onClick={() => openDetail(meeting)}
                    className="p-6 hover:bg-slate-50 transition-all group cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="space-y-1">
                           <h4 className="font-bold text-slate-800 group-hover:text-brand-600 transition-all">
                            {meeting.status === 'Comment' ? `Comentario: ${meeting.description || ''}` : meeting.title}
                          </h4>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-sm text-slate-500">
                              <Clock size={14} />
                              <span>{formatTime(meeting.time)}</span>
                            </div>
                            {meeting.status !== 'Comment' && (
                              <>
                                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                  <MapPin size={14} />
                                  <span>{meeting.location}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                  <Users size={14} />
                                  <span>{meeting.attendees} Attendees</span>
                                </div>
                              </>
                            )}
                          </div>

                          {(meeting.projectName || meeting.taskName) && (
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                              {meeting.projectName && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onFilter?.({ projectId: meeting.projectId }); }}
                                  className="flex items-center gap-1.5 text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-md hover:bg-brand-100 transition-all"
                                >
                                  <Briefcase size={12} />
                                  <span>{meeting.projectName}</span>
                                </button>
                              )}
                              {meeting.taskName && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onFilter?.({ taskId: meeting.taskId }); }}
                                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md hover:bg-slate-200 transition-all"
                                >
                                  <CheckSquare size={12} />
                                  <span>{meeting.taskName}</span>
                                </button>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-2">
                            {meeting.status !== 'Comment' && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-xs font-medium">{meeting.status}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(meeting);
                          }}
                          className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(meeting.id);
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <p className="text-xs text-slate-500">Showing page {currentPage} of {totalPages}</p>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(1, prev - 1)); }}
                    className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-50 disabled:hover:border-transparent transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(totalPages, prev + 1)); }}
                    className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-50 disabled:hover:border-transparent transition-all"
                  >
                    <LucideChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default Meetings;
