export type ProjectStatus = 'Active' | 'In Progress' | 'Completed' | 'At Risk' | 'On Hold';
export type Priority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'To Do' | 'In Progress' | 'Review' | 'Completed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  team: User[];
  deadline: string;
  progress: number;
  tasksCount: number;
  completedTasksCount: number;
  tags: string[];
  createdAt?: string;
}

export interface Task {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  priority: Priority;
  status: TaskStatus;
  assignee: User;
  dueDate: string;
  position: number;
  updatedAt: string;
}

export interface Activity {
  id: string;
  user: User;
  action: string;
  target: string;
  timestamp: string;
  taskId?: string;
  projectId?: string;
}

export interface Meeting {
  id: string;
  title: string;
  time: string;
  date: string;
  attendees: number;
  location: string;
  status: 'Upcoming' | 'Scheduled' | 'Completed' | 'Cancelled' | 'Comment';
  color: string;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  taskName?: string;
  description?: string;
  memberId?: string;
}
