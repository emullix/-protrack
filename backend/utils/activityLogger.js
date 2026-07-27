import { dbPromise } from '../db.js';

/**
 * Registra una actividad en la base de datos.
 * 
 * @param {number} userId - ID del usuario que realiza la acción
 * @param {string} action - Tipo de acción ('create', 'update', 'delete', 'complete')
 * @param {string} entityType - Tipo de entidad afectada ('project', 'task')
 * @param {number} entityId - ID de la entidad afectada
 * @param {string} entityName - Nombre o título de la entidad afectada (útil si se elimina)
 * @param {string|null} details - Detalles de la acción en español
 */
export const logActivity = async (userId, action, entityType, entityId, entityName, details = null) => {
  try {
    const db = await dbPromise;
    await db.run(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, entity_name, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, action, entityType, entityId, entityName, details]
    );
    console.log(`[ActivityLog] Registrado: ${details}`);
  } catch (err) {
    console.error('Error al registrar actividad:', err);
  }
};
