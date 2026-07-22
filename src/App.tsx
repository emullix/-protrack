import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Team from './pages/Team';
import Settings from './pages/Settings';
import Meetings from './pages/Meetings';
import Reports from './pages/Reports';
import Login from './pages/Login';
import { PROJECTS as INITIAL_PROJECTS, TASKS as INITIAL_TASKS, USERS as INITIAL_USERS, MEETINGS as INITIAL_MEETINGS } from './constants';
import { 
  Project, 
  Task, 
  User, 
  Activity, 
  Meeting,
  Role,
  ProjectStatus, 
  Priority, 
  TaskStatus 
} from './types';
import api from './api';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [meetingFilter, setMeetingFilter] = useState<{ projectId?: string; taskId?: string } | null>(null);
  const [taskFilter, setTaskFilter] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS);

  // Listen to hashchange events (browser back/forward buttons)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs = [
        'dashboard', 'projects', 'tasks', 'calendar', 'meetings', 
        'reports', 'team', 'settings', 'new-project', 'new-task', 
        'new-member', 'edit-project', 'edit-task', 'edit-member'
      ];
      if (hash && validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    // Initial check on load/login
    const initialHash = window.location.hash.replace('#', '');
    const validTabs = [
      'dashboard', 'projects', 'tasks', 'calendar', 'meetings', 
      'reports', 'team', 'settings', 'new-project', 'new-task', 
      'new-member', 'edit-project', 'edit-task', 'edit-member'
    ];
    if (initialHash && validTabs.includes(initialHash)) {
      setActiveTab(initialHash);
    } else if (isLoggedIn) {
      window.location.hash = activeTab;
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isLoggedIn]);

  // Update hash when activeTab changes (so it goes to browser history)
  useEffect(() => {
    if (isLoggedIn) {
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash !== activeTab) {
        window.location.hash = activeTab;
      }
    }
  }, [activeTab, isLoggedIn]);
  
  const [newProject, setNewProject] = useState({ name: '', description: '', deadline: '', priority: 'Medium', teamIds: [] as string[], tags: [] as string[] });
  const [newTask, setNewTask] = useState({ name: '', projectId: '', assigneeId: team[0]?.id || '', dueDate: '', priority: 'Medium' });
  const [newMember, setNewMember] = useState({ name: '', email: '', role: '', avatar: '' });
  const [newTagsInput, setNewTagsInput] = useState('');
  const [editTagsInput, setEditTagsInput] = useState('');

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingMember, setEditingMember] = useState<User | null>(null);

  const [projectFilters, setProjectFilters] = useState(() => {
    const saved = localStorage.getItem('protrack_project_filters');
    const defaultFilters = {
      status: 'All' as ProjectStatus | 'All',
      priority: 'All' as Priority | 'All',
      memberId: 'All',
      search: '',
      tag: '',
      showCompleted: false
    };
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultFilters, ...parsed };
      } catch (e) {
        return defaultFilters;
      }
    }
    return defaultFilters;
  });

  const [projectView, setProjectView] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('protrack_project_view') as 'grid' | 'list') || 'list';
  });

  useEffect(() => {
    localStorage.setItem('protrack_project_filters', JSON.stringify(projectFilters));
  }, [projectFilters]);

  useEffect(() => {
    localStorage.setItem('protrack_project_view', projectView);
  }, [projectView]);
  
  const reorderTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Derive project statistics and automatic status from tasks
  const projectsWithStats = React.useMemo(() => {
    return projects.map(project => {
      const projectTasks = tasks.filter(t => t.projectId === project.id);
      const total = projectTasks.length;
      const completed = projectTasks.filter(t => t.status === 'Completed').length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      // Automatic Status Logic
      let autoStatus: ProjectStatus = 'Active';
      
      const lastUpdate = projectTasks.length > 0 
        ? Math.max(...projectTasks.map(t => new Date(t.updatedAt).getTime()))
        : new Date(project.deadline || Date.now()).getTime(); // Fallback to deadline if no tasks
      
      const daysSinceUpdate = Math.floor((Date.now() - lastUpdate) / (1000 * 60 * 60 * 24));

      if (total === 0) {
        autoStatus = 'Active';
      } else if (completed === total) {
        autoStatus = 'Completed';
      } else if (daysSinceUpdate > 3) {
        autoStatus = 'At Risk';
      } else if (daysSinceUpdate === 3) {
        autoStatus = 'On Hold';
      } else if (completed >= 1) {
        autoStatus = 'In Progress';
      } else {
        autoStatus = 'Active';
      }

      return {
        ...project,
        status: (total > 0 && completed === total) ? 'Completed' : (project.status || autoStatus),
        tasksCount: total,
        completedTasksCount: completed,
        progress
      };
    });
  }, [projects, tasks]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsData, tasksData, membersData, meetingsData] = await Promise.all([
        api.projects.list(),
        api.tasks.list(),
        api.members.list(),
        api.meetings.list()
      ]);
      console.log('API Data:', { projectsData, tasksData, membersData, meetingsData });
      const finalTeam = Array.isArray(membersData) && membersData.length > 0 
        ? membersData.map((m: any) => ({
            id: m.id.toString(),
            name: m.name,
            email: m.email,
            role: m.role || 'Member',
            avatar: m.avatar || `https://picsum.photos/seed/${m.id}/100/100`
          })) 
        : INITIAL_USERS;
      setTeam(finalTeam);
      
      // Try to match current user with team member for better data
      if (currentUser) {
        const matched = finalTeam.find(m => m.email === currentUser.email);
        if (matched) {
          setCurrentUser(matched);
          localStorage.setItem('protrack_user', JSON.stringify(matched));
        }
      }

      const rolesData = await api.roles.list();
      setRoles(rolesData);

      // Map API data to frontend types
      const mappedProjects = Array.isArray(projectsData) ? projectsData.map((p: any) => ({
        id: p.id.toString(),
        name: p.title,
        description: p.description,
        status: (() => {
          if (!p.status) return 'In Progress';
          const lower = p.status.toLowerCase();
          if (lower === 'active') return 'Active';
          if (lower === 'in progress') return 'In Progress';
          if (lower === 'completed') return 'Completed';
          if (lower === 'at risk') return 'At Risk';
          if (lower === 'on hold') return 'On Hold';
          return p.status;
        })() as ProjectStatus,
        priority: p.priority || 'Medium',
        team: (p.team && p.team.length > 0) 
          ? p.team.map((m: any) => ({
              id: m.id.toString(),
              name: m.name,
              email: m.email,
              role: m.role || 'Member',
              avatar: m.avatar || `https://picsum.photos/seed/${m.id}/100/100`
            }))
          : [finalTeam[0]],
        deadline: p.deadline || (p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
        progress: 0,
        tasksCount: 0,
        completedTasksCount: 0,
        tags: p.tags ? p.tags.split(',') : [],
        createdAt: p.created_at
      })) : [];

      const mappedTasks = Array.isArray(tasksData) ? tasksData.map((t: any) => ({
        id: t.id.toString(),
        name: t.title,
        projectId: t.project_id.toString(),
        projectName: mappedProjects.find((p: any) => p.id === t.project_id.toString())?.name || 'Unknown',
        priority: t.priority || 'Medium',
        status: (['To Do', 'In Progress', 'Review', 'Completed'].includes(t.status) ? t.status : 'To Do'),
        assignee: finalTeam.find((m: any) => m.id === t.assignee_id?.toString()) || finalTeam[0],
        dueDate: (t.due_date || t.created_at || new Date().toISOString()).split('T')[0],
        position: t.position || 0,
        updatedAt: t.updated_at || t.created_at || new Date().toISOString()
      })) : [];

        const mappedMeetings = Array.isArray(meetingsData) ? meetingsData.map((m: any) => ({
          id: m.id.toString(),
          title: m.title,
          date: m.date,
          time: m.time,
          attendees: m.attendees || 1,
          location: m.location || 'Conference Room A',
          status: m.status || 'Upcoming',
          color: m.status === 'Completed' ? 'bg-emerald-500' : 'bg-brand-500',
          projectId: m.project_id?.toString(),
          projectName: m.projectName,
          taskId: m.task_id?.toString(),
          taskName: m.taskName,
          description: m.description,
          memberId: m.member_id?.toString()
        })) : [];

      setProjects(mappedProjects);
      setTasks(mappedTasks);
      setMeetings(mappedMeetings);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('protrack_token');
    const savedUser = localStorage.getItem('protrack_user');
    if (token) {
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {}
      }
      setIsLoggedIn(true);
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  // Pre-fill NEW TASK project if filter is active
  useEffect(() => {
    if (activeTab === 'new-task' && taskFilter) {
      setNewTask(prev => ({ ...prev, projectId: taskFilter }));
    }
  }, [activeTab, taskFilter]);

  const handleLogin = (userData: any) => {
    const email = userData.username;
    let name = email;
    if (email.includes('@')) {
      const part = email.split('@')[0];
      if (part.toLowerCase() === 'estebanmullix') {
        name = 'Esteban Mullix';
      } else {
        name = part.split(/[._]/).map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
      }
    }
    
    const user = {
      id: userData.id.toString(),
      name: name,
      email: email,
      role: 'Admin'
    };
    setCurrentUser(user);
    localStorage.setItem('protrack_user', JSON.stringify(user));
    setIsLoggedIn(true);
    fetchData();
  };

  const handleLogout = () => {
    localStorage.removeItem('protrack_token');
    localStorage.removeItem('protrack_user');
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleCreateRole = async (role: any) => {
    try {
      await api.roles.create(role);
      fetchData();
    } catch (err) {
      console.error('Create Role Error:', err);
    }
  };

  const handleUpdateRole = async (id: string, role: any) => {
    try {
      await api.roles.update(id, role);
      fetchData();
    } catch (err) {
      console.error('Update Role Error:', err);
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      await api.roles.delete(id);
      fetchData();
    } catch (err) {
      console.error('Delete Role Error:', err);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name) return;

    try {
      const parsedTags = newTagsInput.split(',').map(t => t.trim()).filter(t => t !== '');
      const projectWithTags = { ...newProject, tags: parsedTags };
      const created = await api.projects.create(projectWithTags);
      console.log('Project created:', created);
      
      const projectTeam = newProject.teamIds.length > 0 
        ? team.filter(m => newProject.teamIds.includes(m.id))
        : (team.length > 0 ? [team[0]] : [INITIAL_USERS[0]]);

      const project: Project = {
        id: created.id.toString(),
        name: created.title || newProject.name,
        description: created.description || newProject.description,
        status: 'In Progress',
        priority: (created.priority || newProject.priority) as any,
        team: projectTeam,
        deadline: created.deadline || newProject.deadline || new Date().toISOString().split('T')[0],
        progress: 0,
        tasksCount: 0,
        completedTasksCount: 0,
        tags: created.tags ? (typeof created.tags === 'string' ? created.tags.split(',') : created.tags) : parsedTags
      };

      setProjects(prev => [project, ...prev]);
      setNewProject({ name: '', description: '', deadline: '', priority: 'Medium', teamIds: [], tags: [] });
      setNewTagsInput('');
      setActiveTab('projects');
    } catch (err: any) {
      console.error('Failed to create project', err);
      alert('Error creating project: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.name || !newTask.projectId) return;

    try {
      const created = await api.tasks.create(newTask);
      const project = projects.find(p => p.id === newTask.projectId);

      const task: Task = {
        id: created.id.toString(),
        name: created.title,
        projectId: created.project_id.toString(),
        projectName: project?.name || 'Unknown Project',
        priority: newTask.priority as any,
        status: 'To Do',
        assignee: team.find(m => m.id === created.assignee_id?.toString()) || team[0] || INITIAL_USERS[0],
        dueDate: created.due_date || (created.created_at || new Date().toISOString()).split('T')[0],
        position: created.position || 0,
        updatedAt: created.updated_at || new Date().toISOString()
      };

      setTasks([...tasks, task]);
      setNewTask({ name: '', projectId: '', assigneeId: team[0]?.id || '', dueDate: '', priority: 'Medium' });
      setActiveTab('tasks');
    } catch (err) {
      console.error('Failed to create task', err);
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    try {
      const parsedTags = editTagsInput.split(',').map(t => t.trim()).filter(t => t !== '');
      const projectToUpdate = { ...editingProject, tags: parsedTags };
      await api.projects.update(editingProject.id, projectToUpdate);
      setProjects(projects.map(p => p.id === editingProject.id ? projectToUpdate : p));
      setEditingProject(null);
      setEditTagsInput('');
      setActiveTab('projects');
      alert('Project updated successfully!');
    } catch (err: any) {
      console.error('Failed to update project', err);
      alert('Error updating project: ' + (err.message || 'Unknown error'));
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    try {
      await api.tasks.update(editingTask.id, editingTask);
      const project = projects.find(p => p.id === editingTask.projectId);
      const updatedTask = { 
        ...editingTask, 
        projectName: project?.name || editingTask.projectName,
        updatedAt: new Date().toISOString()
      };
      setTasks(tasks.map(t => t.id === editingTask.id ? updatedTask : t));
      setEditingTask(null);
      setActiveTab('tasks');
      alert('Task updated successfully!');
    } catch (err: any) {
      console.error('Failed to update task', err);
      alert('Error updating task: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCreateMember = async () => {
    if (!newMember.name || !newMember.email) return;

    try {
      const created = await api.members.create(newMember);
      const member: User = {
        id: created.id.toString(),
        name: created.name,
        email: created.email,
        role: created.role || 'Member',
        avatar: created.avatar || `https://picsum.photos/seed/${created.id}/100/100`
      };

      setTeam([...team, member]);
      setNewMember({ name: '', email: '', role: '', avatar: '' });
      setActiveTab('team');
    } catch (err) {
      console.error('Failed to create member', err);
    }
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;
    try {
      await api.members.update(editingMember.id, editingMember);
      setTeam(team.map(m => m.id === editingMember.id ? editingMember : m));
      setEditingMember(null);
      setActiveTab('team');
    } catch (err) {
      console.error('Failed to update member', err);
    }
  };

  const deleteMember = async (memberId: string) => {
    try {
      await api.members.delete(memberId);
      setTeam(team.filter(m => m.id !== memberId));
    } catch (err) {
      console.error('Failed to delete member', err);
    }
  };

  const handleScheduleMeeting = async (meetingData: Meeting) => {
    try {
      const created = await api.meetings.create(meetingData);
      const project = projects.find(p => p.id === meetingData.projectId);
      const task = tasks.find(t => t.id === meetingData.taskId);
      
      const meeting: Meeting = {
        ...meetingData,
        id: created.id.toString(),
        projectName: project?.name,
        taskName: task?.name,
        color: 'bg-brand-500'
      };
      
      setMeetings([...meetings, meeting]);
    } catch (err) {
      console.error('Failed to schedule meeting', err);
    }
  };

  const handleUpdatePersistentMeeting = async (updatedMeeting: Meeting) => {
    try {
      await api.meetings.update(updatedMeeting.id, updatedMeeting);
      setMeetings(meetings.map(m => m.id === updatedMeeting.id ? updatedMeeting : m));
    } catch (err) {
      console.error('Failed to update meeting', err);
    }
  };

  const handleUpdateMeeting = (updatedMeeting: Meeting) => {
    setMeetings(meetings.map(m => m.id === updatedMeeting.id ? updatedMeeting : m));
  };

  const handleQuickProject = async (name: string): Promise<string> => {
    try {
      const data = {
        name,
        description: 'Quickly created during meeting',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'Medium',
        teamIds: team.length > 0 ? [team[0].id] : []
      };
      const created = await api.projects.create(data);
      
      const projectTeam = team.length > 0 ? [team[0]] : [INITIAL_USERS[0]];
      const project: Project = {
        id: created.id.toString(),
        name: created.title || name,
        description: created.description || data.description,
        status: 'Active',
        priority: 'Medium',
        team: projectTeam,
        deadline: created.deadline || data.deadline,
        progress: 0,
        tasksCount: 0,
        completedTasksCount: 0,
        tags: created.tags ? (typeof created.tags === 'string' ? created.tags.split(',') : created.tags) : []
      };
      
      setProjects(prev => [project, ...prev]);
      return created.id.toString();
    } catch (err) {
      console.error('Failed to quick create project', err);
      return `p${Date.now()}`; // Fallback ID though not ideal
    }
  };

  const handleQuickTask = async (name: string, projectId: string) => {
    try {
      const data = {
        name,
        projectId,
        priority: 'Medium',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assigneeId: team[0]?.id || ''
      };
      const created = await api.tasks.create(data);
      const project = projects.find(p => p.id === projectId);
      
      const task: Task = {
        id: created.id.toString(),
        name: created.title || name,
        projectId: created.project_id.toString(),
        projectName: project?.name || 'Quick Project',
        priority: 'Medium',
        status: 'To Do',
        assignee: team[0] || INITIAL_USERS[0],
        dueDate: created.due_date || data.dueDate,
        position: created.position || 0,
        updatedAt: created.updated_at || new Date().toISOString()
      };
      setTasks(prev => [...prev, task]);
    } catch (err) {
      console.error('Failed to quick create task', err);
    }
  };

  const startEditingProject = (project: Project) => {
    setEditingProject(project);
    setEditTagsInput(project.tags.join(', '));
    setActiveTab('edit-project');
  };

  const startEditingTask = (task: Task) => {
    setEditingTask(task);
    setActiveTab('edit-task');
  };

  const startEditingMember = (member: User) => {
    setEditingMember(member);
    setActiveTab('edit-member');
  };
  
  const handleProjectClick = (projectId: string) => {
    setTaskFilter(projectId);
    setActiveTab('tasks');
  };

  const handleTaskClick = (taskId: string, projectId: string) => {
    // If the IDs look like they are from constant data (e.g. 'p1', 't2')
    // but the actual data in state has different IDs (e.g. '1', '2')
    // we can try to find the project by name or just hope for the best.
    setTaskFilter(projectId);
    setActiveTab('tasks');
  };

  const toggleTaskStatus = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newStatus = task.status === 'Completed' ? 'To Do' : 'Completed';
    const now = new Date().toISOString();
    try {
      await api.tasks.update(taskId, { ...task, status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus, updatedAt: now } : t));
    } catch (err) {
      console.error('Failed to toggle task status', err);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await api.tasks.delete(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await api.projects.delete(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      setTasks(tasks.filter(t => t.projectId !== projectId));
    } catch (err) {
      console.error('Failed to delete project', err);
    }
  };

  const handleReorderTasks = async (newOrder: Task[]) => {
    if (!newOrder.length) return;

    // 1. Calculate the new state locally first
    const reorderedIds = new Map(newOrder.map((t, i) => [t.id, i]));
    
    // We want to keep the same set of positions that were occupied by these tasks
    const tasksToReorder = tasks.filter(t => reorderedIds.has(t.id));
    const availablePositions = tasksToReorder.map(t => t.position).sort((a, b) => a - b);
    
    // If all are 0, create a sequence
    const useSequence = availablePositions.every(p => p === 0);
    const startPos = useSequence ? (tasks.findIndex(t => t.id === newOrder[0].id) + 1) : 0;

    const now = new Date().toISOString();
    const updatedTasks = tasks.map(t => {
      const orderIndex = reorderedIds.get(t.id);
      if (orderIndex !== undefined) {
        const newPos = useSequence ? (startPos + orderIndex) : availablePositions[orderIndex];
        return { ...t, position: newPos, updatedAt: now };
      }
      return t;
    }).sort((a, b) => a.position - b.position);

    // 2. Update state once
    setTasks(updatedTasks);

    // 3. Persist to backend (debounced)
    if (reorderTimeoutRef.current) clearTimeout(reorderTimeoutRef.current);
    reorderTimeoutRef.current = setTimeout(() => {
      // Only send the tasks that actually changed position to keep request small
      const changedTasks = updatedTasks
        .filter(t => {
          const oldTask = tasks.find(old => old.id === t.id);
          return oldTask && oldTask.position !== t.position;
        })
        .map(t => ({ id: t.id, position: t.position }));

      if (changedTasks.length === 0) return;

      api.tasks.reorder(changedTasks)
        .catch(err => {
          console.error('Failed to persist task reorder', err);
          // If it's a 401, api.ts will handle the reload. 
          // Otherwise, we just log it to avoid infinite refresh loops.
        });
    }, 1000);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            projects={projectsWithStats} 
            tasks={tasks}
            meetings={meetings} 
            team={team}
            currentUser={currentUser}
            setActiveTab={setActiveTab} 
            onProjectClick={handleProjectClick} 
            onTaskClick={handleTaskClick} 
            onStatClick={(status) => {
              setProjectFilters(prev => ({ ...prev, status: status as ProjectStatus | 'All' }));
              setActiveTab('projects');
            }}
          />
        );
      case 'projects':
        return (
          <Projects 
            projects={projectsWithStats} 
            meetings={meetings} 
            setActiveTab={setActiveTab} 
            onEdit={startEditingProject} 
            onDelete={deleteProject} 
            onShowMeetings={(projectId) => { setMeetingFilter({ projectId }); setActiveTab('meetings'); }} 
            onProjectClick={handleProjectClick}
            filters={projectFilters}
            setFilters={setProjectFilters}
            view={projectView}
            setView={setProjectView}
            team={team}
          />
        );
      case 'tasks':
        return (
          <Tasks 
            tasks={tasks} 
            meetings={meetings} 
            setActiveTab={setActiveTab} 
            onEdit={startEditingTask} 
            onToggleStatus={toggleTaskStatus} 
            onDelete={deleteTask} 
            onShowMeetings={(taskId) => { setMeetingFilter({ taskId }); setActiveTab('meetings'); }} 
            initialProjectFilter={taskFilter} 
            onClearFilter={() => setTaskFilter(null)} 
            projects={projectsWithStats} 
            onReorder={(newIds) => {
              const taskById = new Map(tasks.map(t => [t.id, t]));
              const newOrder = newIds.map(id => taskById.get(id)).filter((t): t is Task => !!t);
              handleReorderTasks(newOrder);
            }} 
          />
        );
      case 'calendar':
        return (
          <Calendar 
            projects={projectsWithStats} 
            tasks={tasks} 
            team={team}
            filters={projectFilters}
            setFilters={setProjectFilters}
            setActiveTab={setActiveTab} 
            onProjectClick={handleProjectClick}
          />
        );
      case 'reports':
        return (
          <Reports 
            projects={projectsWithStats} 
            tasks={tasks} 
            team={team} 
            filters={projectFilters}
            setFilters={setProjectFilters}
            onProjectClick={handleProjectClick}
          />
        );
      case 'meetings':
        return (
          <Meetings 
            meetings={meetings} 
            projects={projectsWithStats} 
            tasks={tasks}
            team={team}
            filter={meetingFilter}
            onFilter={setMeetingFilter}
            onClearFilter={() => setMeetingFilter(null)}
            filters={projectFilters}
            setFilters={setProjectFilters}
            onSchedule={handleScheduleMeeting}
            onUpdateMeeting={handleUpdatePersistentMeeting}
            onDelete={handleDeleteMeeting}
            onQuickProject={handleQuickProject}
            onQuickTask={handleQuickTask}
          />
        );
      case 'team':
        return <Team users={team} projects={projectsWithStats} onEdit={startEditingMember} onDelete={deleteMember} onAdd={() => setActiveTab('new-member')} />;
      case 'new-member':
        return (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Create New Member</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Full Name</label>
                <input 
                  type="text" 
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  placeholder="e.g. John Doe" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Email Address</label>
                <input 
                  type="email" 
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  placeholder="john@example.com" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Role</label>
                  <input 
                    type="text" 
                    value={newMember.role}
                    onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                    placeholder="e.g. Developer" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Department</label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option>Design</option>
                    <option>Development</option>
                    <option>Management</option>
                    <option>QA</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setActiveTab('team')} className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg font-bold hover:bg-slate-200 transition-all">Cancel</button>
                <button 
                  onClick={handleCreateMember}
                  disabled={!newMember.name || !newMember.email}
                  className="flex-1 bg-brand-600 text-white py-2 rounded-lg font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 disabled:opacity-50"
                >
                  Create Member
                </button>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <Settings 
            currentUser={currentUser} 
            roles={roles} 
            onCreateRole={handleCreateRole} 
            onUpdateRole={handleUpdateRole} 
            onDeleteRole={handleDeleteRole} 
          />
        );
      case 'edit-member':
        if (!editingMember) return null;
        return (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Edit Team Member</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Full Name</label>
                <input 
                  type="text" 
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({...editingMember, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Email Address</label>
                <input 
                  type="email" 
                  value={editingMember.email}
                  onChange={(e) => setEditingMember({...editingMember, email: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Role</label>
                  <input 
                    type="text" 
                    value={editingMember.role}
                    onChange={(e) => setEditingMember({...editingMember, role: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Department</label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option>Design</option>
                    <option>Development</option>
                    <option>Management</option>
                    <option>QA</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setActiveTab('team')} className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg font-bold hover:bg-slate-200 transition-all">Cancel</button>
                <button 
                  onClick={handleUpdateMember}
                  className="flex-1 bg-brand-600 text-white py-2 rounded-lg font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        );
      case 'new-project':
        return (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-100 shadow-xl">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 font-display">Create New Project</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Project Name</label>
                <input 
                  type="text" 
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  placeholder="e.g. Website Redesign" 
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-medium" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Description</label>
                <textarea 
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  placeholder="Briefly describe the project goals..." 
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all h-32 resize-none font-medium"
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Priority</label>
                  <select 
                    value={newProject.priority}
                    onChange={(e) => setNewProject({...newProject, priority: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-medium appearance-none"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Deadline</label>
                  <input 
                    type="date" 
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-medium" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Tags (comma separated)</label>
                <input 
                  type="text" 
                  value={newTagsInput}
                  onChange={(e) => setNewTagsInput(e.target.value)}
                  placeholder="e.g. Marketing, Phase 1" 
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-medium" 
                />
               </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700">Team Members</label>
                <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-4 bg-slate-50/30 border border-slate-200 rounded-2xl scrollbar-thin scrollbar-thumb-slate-200">
                  {team.map(member => (
                    <label key={member.id} className="flex items-center gap-3 p-2.5 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-brand-300 hover:shadow-sm transition-all group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox"
                          checked={newProject.teamIds.includes(member.id)}
                          onChange={(e) => {
                            const ids = e.target.checked 
                              ? [...newProject.teamIds, member.id]
                              : newProject.teamIds.filter(id => id !== member.id);
                            setNewProject({...newProject, teamIds: ids});
                          }}
                          className="w-5 h-5 rounded-md border-slate-300 text-brand-500 focus:ring-brand-500/20 transition-all cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={member.avatar} alt="" className="w-8 h-8 rounded-full border border-slate-100 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-700 truncate">{member.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button 
                  onClick={() => setActiveTab('projects')} 
                  className="flex-1 px-6 py-3.5 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 hover:text-slate-700 transition-all duration-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateProject}
                  disabled={!newProject.name}
                  className="flex-1 px-6 py-3.5 bg-brand-400 text-white rounded-2xl font-bold hover:bg-brand-500 transition-all duration-200 shadow-lg shadow-brand-400/20 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed transform active:scale-[0.98]"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        );
      case 'edit-project':
        if (!editingProject) return null;
        return (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Edit Project</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Project Name</label>
                <input 
                  type="text" 
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Description</label>
                <textarea 
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({...editingProject, description: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 h-32"
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Priority</label>
                  <select 
                    value={editingProject.priority}
                    onChange={(e) => setEditingProject({...editingProject, priority: e.target.value as any})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Status</label>
                  <select 
                    value={editingProject.status}
                    onChange={(e) => setEditingProject({...editingProject, status: e.target.value as any})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="Active">Active</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="At Risk">At Risk</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Deadline</label>
                  <input 
                    type="date" 
                    value={editingProject.deadline}
                    onChange={(e) => setEditingProject({...editingProject, deadline: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                  />
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-700">Tags (comma separated)</label>
                  <input 
                    type="text" 
                    value={editTagsInput}
                    onChange={(e) => setEditTagsInput(e.target.value)}
                    placeholder="e.g. Marketing, Phase 1" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                  />
                 </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Team Members</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 border border-slate-200 rounded-lg">
                  {team.map(member => (
                    <label key={member.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                      <input 
                        type="checkbox"
                        checked={editingProject.team.some(m => m.id === member.id)}
                        onChange={(e) => {
                          const updatedTeam = e.target.checked 
                            ? [...editingProject.team, member]
                            : editingProject.team.filter(m => m.id !== member.id);
                          setEditingProject({...editingProject, team: updatedTeam});
                        }}
                        className="rounded text-brand-600 focus:ring-brand-500"
                      />
                      <div className="flex items-center gap-2">
                        <img src={member.avatar} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                        <span className="text-xs font-medium text-slate-700 truncate">{member.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setActiveTab('projects')} className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg font-bold hover:bg-slate-200 transition-all">Cancel</button>
                <button 
                  onClick={handleUpdateProject}
                  className="flex-1 bg-brand-600 text-white py-2 rounded-lg font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        );
      case 'edit-task':
        if (!editingTask) return null;
        return (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Edit Task</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Task Name</label>
                <input 
                  type="text" 
                  value={editingTask.name}
                  onChange={(e) => setEditingTask({...editingTask, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Project</label>
                <select 
                  value={editingTask.projectId}
                  onChange={(e) => setEditingTask({...editingTask, projectId: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  {projectsWithStats.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Assignee</label>
                  <select 
                    value={editingTask.assignee.id}
                    onChange={(e) => {
                      const user = team.find(u => u.id === e.target.value);
                      if (user) setEditingTask({...editingTask, assignee: user});
                    }}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    {team.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Priority</label>
                  <select 
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({...editingTask, priority: e.target.value as any})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Status</label>
                  <select 
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({...editingTask, status: e.target.value as any})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option>To Do</option>
                    <option>In Progress</option>
                    <option>Review</option>
                    <option>Completed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Due Date</label>
                  <input 
                    type="date" 
                    value={editingTask.dueDate}
                    onChange={(e) => setEditingTask({...editingTask, dueDate: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setActiveTab('tasks')} className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg font-bold hover:bg-slate-200 transition-all">Cancel</button>
                <button 
                  onClick={handleUpdateTask}
                  className="flex-1 bg-brand-600 text-white py-2 rounded-lg font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        );
      case 'new-task':
        return (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Add New Task</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">+ Task Name</label>
                <input 
                  type="text" 
                  value={newTask.name}
                  onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                  placeholder="e.g. Design Login Screen" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Project</label>
                <select 
                  value={newTask.projectId}
                  onChange={(e) => setNewTask({...newTask, projectId: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="">Select a project</option>
                  {projectsWithStats.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Assignee</label>
                  <select 
                    value={newTask.assigneeId}
                    onChange={(e) => setNewTask({...newTask, assigneeId: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    {team.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Priority</label>
                  <select 
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Due Date</label>
                <input 
                  type="date" 
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setActiveTab('tasks')} className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg font-bold hover:bg-slate-200 transition-all">Cancel</button>
                <button 
                  onClick={handleCreateTask}
                  disabled={!newTask.name || !newTask.projectId}
                  className="flex-1 bg-brand-600 text-white py-2 rounded-lg font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard projects={projects} setActiveTab={setActiveTab} />;
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      await api.meetings.delete(meetingId);
      setMeetings(meetings.filter(m => m.id !== meetingId));
    } catch (err) {
      console.error('Failed to delete meeting', err);
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} currentUser={currentUser}>
      {renderContent()}
    </Layout>
  );
};

export default App;
