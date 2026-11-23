/**
 * Format a date to DD/MM/YYYY format
 */
export const formatDate = (date: Date | string | any | undefined | null): string => {
  if (!date) return '';
  
  let d: Date;
  
  // Handle Firestore Timestamp
  if (date.toDate && typeof date.toDate === 'function') {
    d = date.toDate();
  } else if (typeof date === 'string') {
    d = new Date(date);
  } else if (date instanceof Date) {
    d = date;
  } else {
    return '';
  }
  
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Format a date with time to DD/MM/YYYY HH:mm format
 */
export const formatDateTime = (date: Date | string | any | undefined | null): string => {
  if (!date) return '';
  
  let d: Date;
  
  // Handle Firestore Timestamp
  if (date.toDate && typeof date.toDate === 'function') {
    d = date.toDate();
  } else if (typeof date === 'string') {
    d = new Date(date);
  } else if (date instanceof Date) {
    d = date;
  } else {
    return '';
  }
  
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};
