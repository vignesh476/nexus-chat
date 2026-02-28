import { formatDistanceToNow, format, isToday, isYesterday, isPast, addHours } from 'date-fns';

/**
 * Format message timestamp for display
 * - Today: "14:30"
 * - Yesterday: "Yesterday 14:30"
 * - Older: "Jan 15, 14:30"
 */
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  
  if (isYesterday(date)) {
    return `Yesterday ${format(date, 'HH:mm')}`;
  }
  
  return format(date, 'MMM dd, HH:mm');
};

/**
 * Format story expiry time
 * Returns: "2 hours ago", "5 minutes ago", etc.
 */
export const formatStoryExpiry = (createdAt) => {
  if (!createdAt) return '';
  
  try {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  } catch (e) {
    return '';
  }
};

/**
 * Check if story has expired (24 hours)
 */
export const isStoryExpired = (createdAt) => {
  if (!createdAt) return true;
  
  const expiryTime = addHours(new Date(createdAt), 24);
  return isPast(expiryTime);
};

/**
 * Format call duration
 * Returns: "2:30" for 2 minutes 30 seconds
 */
export const formatCallDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format full date for profile/settings
 * Returns: "January 15, 2024 at 2:30 PM"
 */
export const formatFullDate = (timestamp) => {
  if (!timestamp) return '';
  
  return format(new Date(timestamp), 'MMMM dd, yyyy \'at\' h:mm a');
};

/**
 * Get relative time for notifications
 * Returns: "just now", "2m", "5h", "3d"
 */
export const getRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
};
