const API_BASE_URL = '/api';

const getAuthToken = () => localStorage.getItem('protrack_token');

const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    localStorage.removeItem('protrack_token');
    window.location.reload();
    throw new Error('Unauthorized');
  }
  
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { message: text || 'Invalid JSON response' };
  }

  if (!response.ok) {
    console.error(`API Error: ${response.status} ${response.url}`, data);
    throw new Error(data.message || `Error ${response.status}: Something went wrong`);
  }
  return data;
};

const api = {
  auth: {
    login: async (credentials: any) => {
      const resp = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      return handleResponse(resp);
    },
    register: async (credentials: any) => {
      const resp = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      return handleResponse(resp);
    },
    changePassword: async (data: any) => {
      const resp = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data)
      });
      return handleResponse(resp);
    }
  },
  projects: {
    list: async () => {
      const resp = await fetch(`${API_BASE_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      return handleResponse(resp);
    },
    create: async (project: any) => {
      const resp = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(project)
      });
      return handleResponse(resp);
    },
    update: async (id: number | string, project: any) => {
      const resp = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          ...project,
          teamIds: project.team?.map((m: any) => m.id) || project.teamIds
        })
      });
      return handleResponse(resp);
    },
    delete: async (id: number | string) => {
      const resp = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      return handleResponse(resp);
    }
  },
  tasks: {
    list: async (projectId?: string) => {
      const query = projectId ? `?projectId=${projectId}` : '';
      const resp = await fetch(`${API_BASE_URL}/tasks${query}`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      return handleResponse(resp);
    },
    create: async (task: any) => {
      const resp = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          project_id: task.projectId,
          title: task.name,
          due_date: task.dueDate,
          assignee_id: task.assigneeId,
          priority: task.priority
        })
      });
      return handleResponse(resp);
    },
    update: async (id: number | string, task: any) => {
      const resp = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          title: task.name,
          status: task.status,
          due_date: task.dueDate,
          assignee_id: task.assignee?.id || task.assigneeId,
          priority: task.priority
        })
      });
      return handleResponse(resp);
    },
    delete: async (id: number | string) => {
      const resp = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      return handleResponse(resp);
    },
    reorder: async (taskOrders: { id: string, position: number }[]) => {
      const resp = await fetch(`${API_BASE_URL}/tasks/reorder`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ taskOrders })
      });
      return handleResponse(resp);
    }
  },
  members: {
    list: async () => {
      const resp = await fetch(`${API_BASE_URL}/members`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      return handleResponse(resp);
    },
    create: async (member: any) => {
      const resp = await fetch(`${API_BASE_URL}/members`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(member)
      });
      return handleResponse(resp);
    },
    update: async (id: number | string, member: any) => {
      const resp = await fetch(`${API_BASE_URL}/members/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(member)
      });
      return handleResponse(resp);
    },
    delete: async (id: number | string) => {
      const resp = await fetch(`${API_BASE_URL}/members/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      return handleResponse(resp);
    }
  },
  meetings: {
    list: async () => {
      const resp = await fetch(`${API_BASE_URL}/meetings`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      return handleResponse(resp);
    },
    create: async (meeting: any) => {
      const resp = await fetch(`${API_BASE_URL}/meetings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          title: meeting.title,
          date: meeting.date,
          time: meeting.time,
          location: meeting.location,
          attendees: meeting.attendees,
          description: meeting.description,
          status: meeting.status,
          project_id: meeting.projectId,
          task_id: meeting.taskId,
          member_id: meeting.memberId
        })
      });
      return handleResponse(resp);
    },
    update: async (id: number | string, meeting: any) => {
      const resp = await fetch(`${API_BASE_URL}/meetings/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          title: meeting.title,
          date: meeting.date,
          time: meeting.time,
          location: meeting.location,
          attendees: meeting.attendees,
          description: meeting.description,
          status: meeting.status,
          project_id: meeting.projectId,
          task_id: meeting.taskId,
          member_id: meeting.memberId
        })
      });
      return handleResponse(resp);
    },
    delete: async (id: number | string) => {
      const resp = await fetch(`${API_BASE_URL}/meetings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      return handleResponse(resp);
    }
  },
  roles: {
    list: async () => {
      const resp = await fetch(`${API_BASE_URL}/roles`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      return handleResponse(resp);
    },
    create: async (role: any) => {
      const resp = await fetch(`${API_BASE_URL}/roles`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(role)
      });
      return handleResponse(resp);
    },
    update: async (id: number | string, role: any) => {
      const resp = await fetch(`${API_BASE_URL}/roles/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(role)
      });
      return handleResponse(resp);
    },
    delete: async (id: number | string) => {
      const resp = await fetch(`${API_BASE_URL}/roles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      return handleResponse(resp);
    }
  }
};

export default api;
