import { logActivity } from './activityLogger.js';

const projectStatusMap = {
  'Active': 'Activo',
  'In Progress': 'En progreso',
  'Completed': 'Completado',
  'At Risk': 'En riesgo',
  'On Hold': 'En espera'
};

/**
 * Recalcula y actualiza el estado de un proyecto según sus tareas e inactividad.
 * 
 * @param {object} db - Instancia de base de datos sqlite
 * @param {number} projectId - ID del proyecto a actualizar
 * @param {number} userId - ID del usuario propietario del proyecto
 */
export async function updateProjectStatus(db, projectId, userId) {
  const normalizeStatus = (s) => {
    const validStatuses = ['To Do', 'In Progress', 'Review', 'Completed'];
    return validStatuses.includes(s) ? s : 'To Do';
  };

  const projectObj = await db.get('SELECT title, status, created_at FROM projects WHERE id = ?', [projectId]);
  if (!projectObj) return;

  const allTasks = await db.all('SELECT status, updated_at, created_at FROM tasks WHERE project_id = ?', [projectId]);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => normalizeStatus(t.status) === 'Completed').length;

  // Encontrar la fecha de última actualización (o creación) de las tareas o el proyecto
  let lastUpdateMs = new Date(projectObj.created_at).getTime();
  for (const task of allTasks) {
    const taskUpdateMs = new Date(task.updated_at || task.created_at).getTime();
    if (taskUpdateMs > lastUpdateMs) {
      lastUpdateMs = taskUpdateMs;
    }
  }
  
  const daysSinceUpdate = Math.floor((Date.now() - lastUpdateMs) / (1000 * 60 * 60 * 24));

  let targetStatus = projectObj.status;

  if (totalTasks > 0 && completedTasks === totalTasks) {
    targetStatus = 'Completed';
  } else {
    if (daysSinceUpdate > 15) {
      targetStatus = 'On Hold';
    } else if (daysSinceUpdate > 3) {
      targetStatus = 'At Risk';
    } else {
      if (completedTasks >= 1) {
        targetStatus = 'In Progress';
      } else {
        targetStatus = 'Active';
      }
    }
  }

  if (projectObj.status !== targetStatus) {
    await db.run('UPDATE projects SET status = ? WHERE id = ?', [targetStatus, projectId]);
    
    if (targetStatus === 'Completed') {
      await logActivity(userId, 'complete', 'project', projectId, projectObj.title, `Completó el proyecto "${projectObj.title}"`);
    } else {
      const oldStatusSp = projectStatusMap[projectObj.status] || projectObj.status;
      const newStatusSp = projectStatusMap[targetStatus] || targetStatus;
      await logActivity(userId, 'update_status', 'project', projectId, projectObj.title, `Cambió el estado del proyecto "${projectObj.title}" de "${oldStatusSp}" a "${newStatusSp}"`);
    }
  }
}
