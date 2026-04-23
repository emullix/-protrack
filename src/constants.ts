import { Project, Task, User, Activity, Meeting } from './types';

export const USERS: User[] = [
  { id: '1', name: 'Alex Johnson', email: 'alex@protrack.com', role: 'Project Manager', avatar: 'https://picsum.photos/seed/alex/100/100' },
  { id: '2', name: 'Sarah Chen', email: 'sarah@protrack.com', role: 'Lead Developer', avatar: 'https://picsum.photos/seed/sarah/100/100' },
  { id: '3', name: 'Michael Ross', email: 'michael@protrack.com', role: 'UI/UX Designer', avatar: 'https://picsum.photos/seed/michael/100/100' },
  { id: '4', name: 'Emily Davis', email: 'emily@protrack.com', role: 'QA Engineer', avatar: 'https://picsum.photos/seed/emily/100/100' },
  { id: '5', name: 'David Wilson', email: 'david@protrack.com', role: 'Backend Developer', avatar: 'https://picsum.photos/seed/david/100/100' },
  { id: '6', name: 'Esteban Mullix', email: 'esteban@protrack.com', role: 'Admin', avatar: `https://picsum.photos/seed/${Math.random()}/100/100` },
];

export const PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Website Redesign',
    description: 'Complete overhaul of the corporate website with modern design and improved performance.',
    status: 'In Progress',
    priority: 'High',
    team: [USERS[0], USERS[1], USERS[2]],
    deadline: '2026-05-15',
    progress: 65,
    tasksCount: 24,
    completedTasksCount: 16,
    tags: ['web', 'design'],
  },
  {
    id: 'p2',
    name: 'Mobile App Launch',
    description: 'Launching the new iOS and Android mobile applications for customers.',
    status: 'At Risk',
    priority: 'High',
    team: [USERS[0], USERS[1], USERS[3], USERS[4]],
    deadline: '2026-04-30',
    progress: 40,
    tasksCount: 45,
    completedTasksCount: 18,
    tags: ['mobile', 'launch'],
  },
  {
    id: 'p3',
    name: 'Internal CRM Integration',
    description: 'Integrating the new CRM system with existing internal tools and databases.',
    status: 'Completed',
    priority: 'Medium',
    team: [USERS[1], USERS[4]],
    deadline: '2026-03-20',
    progress: 100,
    tasksCount: 15,
    completedTasksCount: 15,
    tags: ['crm', 'internal'],
  },
  {
    id: 'p4',
    name: 'Security Audit',
    description: 'Annual security assessment and vulnerability testing of all cloud infrastructure.',
    status: 'On Hold',
    priority: 'High',
    team: [USERS[0], USERS[4]],
    deadline: '2026-06-10',
    progress: 10,
    tasksCount: 12,
    completedTasksCount: 1,
    tags: ['security', 'infrastructure'],
  },
];

export const TASKS: Task[] = [
  { id: 't1', name: 'Design Homepage Mockups', projectId: 'p1', projectName: 'Website Redesign', priority: 'High', status: 'Completed', assignee: USERS[2], dueDate: '2026-04-05', position: 1, updatedAt: new Date().toISOString() },
  { id: 't2', name: 'Implement User Authentication', projectId: 'p1', projectName: 'Website Redesign', priority: 'High', status: 'In Progress', assignee: USERS[1], dueDate: '2026-04-20', position: 2, updatedAt: new Date().toISOString() },
  { id: 't3', name: 'Fix API Connection Issues', projectId: 'p2', projectName: 'Mobile App Launch', priority: 'High', status: 'In Progress', assignee: USERS[4], dueDate: '2026-04-12', position: 3, updatedAt: new Date().toISOString() },
  { id: 't4', name: 'Write Unit Tests for Payment Flow', projectId: 'p2', projectName: 'Mobile App Launch', priority: 'Medium', status: 'To Do', assignee: USERS[3], dueDate: '2026-04-25', position: 4, updatedAt: new Date().toISOString() },
  { id: 't5', name: 'Update Documentation', projectId: 'p3', projectName: 'Internal CRM Integration', priority: 'Low', status: 'Completed', assignee: USERS[0], dueDate: '2026-03-18', position: 5, updatedAt: new Date().toISOString() },
];

export const MEETINGS: Meeting[] = [
  {
    id: 'm1',
    title: 'Project Alpha Sync',
    time: '10:00 AM - 11:00 AM',
    date: '2026-03-08',
    attendees: 5,
    location: 'Conference Room A',
    status: 'Upcoming',
    color: 'bg-brand-500',
    projectId: 'p1',
    projectName: 'Website Redesign',
    taskId: 't2',
    taskName: 'Implement User Authentication',
    description: 'Discuss the progress of user authentication implementation and resolve any blockers.'
  },
  {
    id: 'm2',
    title: 'Design Review: Mobile App',
    time: '02:00 PM - 03:00 PM',
    date: '2026-03-08',
    attendees: 3,
    location: 'Creative Studio',
    status: 'Upcoming',
    color: 'bg-emerald-500',
    projectId: 'p2',
    projectName: 'Mobile App Launch',
    taskId: 't3',
    taskName: 'Fix API Connection Issues',
    description: 'Review the latest mobile app designs and gather feedback from the team.'
  },
  {
    id: 'm3',
    title: 'Client Onboarding',
    time: '09:30 AM - 10:30 AM',
    date: '2026-03-09',
    attendees: 4,
    location: 'Main Boardroom',
    status: 'Scheduled',
    color: 'bg-amber-500',
    projectId: 'p3',
    projectName: 'Internal CRM Integration',
    description: 'Initial meeting with the client to discuss the CRM integration project scope and timeline.'
  }
];

export const ACTIVITIES: Activity[] = [
  { id: 'a1', user: USERS[1], action: 'completed task', target: 'Implement User Authentication', timestamp: '2 hours ago', taskId: '2', projectId: '1' },
  { id: 'a2', user: USERS[2], action: 'uploaded new file', target: 'Homepage_v2.fig', timestamp: '4 hours ago', projectId: '1' },
  { id: 'a3', user: USERS[0], action: 'updated status of', target: 'Mobile App Launch', timestamp: 'Yesterday', projectId: '2' },
  { id: 'a4', user: USERS[3], action: 'commented on', target: 'Write Unit Tests for Payment Flow', timestamp: 'Yesterday', taskId: '4', projectId: '2' },
];
