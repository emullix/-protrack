import { format, parseISO } from 'date-fns';

export const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  try {
    // Check if it's already in MM-DD-YYYY format (though we aim for YYYY-MM-DD internally)
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
    
    // Parse YYYY-MM-DD and format to MM-DD-YYYY
    return format(parseISO(dateStr), 'MM-dd-yyyy');
  } catch (e) {
    return dateStr;
  }
};

export const getInitials = (name: string): string => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const getAvatarColor = (name: string): string => {
  const colors = [
    'bg-blue-100 text-blue-600',
    'bg-emerald-100 text-emerald-600',
    'bg-rose-100 text-rose-600',
    'bg-amber-100 text-amber-600',
    'bg-indigo-100 text-indigo-600',
    'bg-purple-100 text-purple-600',
    'bg-teal-100 text-teal-600',
    'bg-pink-100 text-pink-600',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

export const formatTime = (timeStr: string | undefined): string => {
  if (!timeStr) return '';
  try {
    // If it's already in 12h format with AM/PM
    if (/[AP]M$/i.test(timeStr)) return timeStr;
    
    // Parse HH:mm and format to hh:mm aa
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'hh:mm aa');
  } catch (e) {
    return timeStr;
  }
};

export const formatRelativeTimeSp = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  try {
    let normalized = dateStr;
    if (!normalized.includes('T')) {
      normalized = normalized.replace(' ', 'T') + 'Z';
    }
    const past = new Date(normalized).getTime();
    const now = Date.now();
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
    if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    const dateObj = new Date(normalized);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
};
