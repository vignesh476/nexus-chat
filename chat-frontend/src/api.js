import axios from 'axios';
import config from './config';

// Use config module for consistent API URL handling
const API_BASE_URL = config.API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: false
});

const STORAGE_KEY = 'nexus_token';

const getToken = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem('token');
  } catch {
    return null;
  }
};

const existingToken = getToken();
if (existingToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${existingToken}`;
}

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const setAuthTokenOnApiClient = (tokenOrNull) => {
  if (tokenOrNull) {
    api.defaults.headers.common['Authorization'] = `Bearer ${tokenOrNull}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    
    if (status === 401) {
      const isAuthRoute = url.includes('/users/login') || url.includes('/users/register') || url.includes('/token');
      const isPresencePolling = url.includes('/users/presence') || url.includes('/users/online');
      
      if (!isAuthRoute && !isPresencePolling) {
        try {
          sessionStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem('nexus_pk');
          sessionStorage.removeItem('nexus_user');
        } catch (e) {
          console.error('Storage cleanup error:', e);
        }
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (userData) => api.post('/users/login', userData),
};

// Users API
export const usersAPI = {
  searchUsers: (query) => api.get(`/users/search?query=${encodeURIComponent(query)}`),
  sendFriendRequest: (receiver) => api.post('/users/send_friend_request', { receiver }),
  acceptFriendRequest: (sender) => api.post('/users/accept_friend_request', { sender }),
  rejectFriendRequest: (sender) => api.post('/users/reject_friend_request', { sender }),
  getUserProfile: (username) => api.get(`/users/${username}`),
  updateProfile: (data) => api.put('/users/profile', data),
  getFriendRequests: () => api.get('/users/friend_requests'),
  clearCache: () => api.post('/users/clear_cache'),
  backupUserData: () => api.get('/users/backup'),
  exportUserData: () => api.get('/users/export'),
  getStorageInfo: () => api.get('/users/storage_info'),
};

// Presence API
export const presenceAPI = {
  getPresence: () => api.get('/users/presence'),
  updatePresence: (data) => api.post('/users/presence', data),
};

// Calls API
export const callsAPI = {
  getHistory: () => api.get('/calls/history'),
  logCall: (callData) => api.post('/calls/log', callData),
  clearHistory: () => api.delete('/calls/history'),
  deleteCall: (callId) => api.delete(`/calls/${callId}`),
};

// Stories API
export const storiesAPI = {
  createStory: (formData) => api.post('/stories/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getStories: () => api.get('/stories/'),
  getUserStories: (username) => api.get(`/stories/${username}`),
  interactStory: (storyId, action, payload) => {
    const formData = new FormData();
    formData.append('action', action);
    if (payload) formData.append('payload', JSON.stringify(payload));
    return api.post(`/stories/${storyId}/interact`, formData);
  },
  highlightStory: (storyId) => api.post(`/stories/${storyId}/highlight`),
  deleteStory: (storyId) => api.delete(`/stories/${storyId}`),
};

// Messages API
export const messagesAPI = {
  getMessages: (roomId, limit = 50, offset = 0) => api.get(`/messages/${roomId}`, { params: { limit, offset } }),
  sendMessage: (message) => api.post('/messages/send', message),
  sendFile: (formData) => api.post('/messages/send_file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
  reactToMessage: (messageId, reaction) => api.post(`/messages/${messageId}/react`, reaction),
  votePoll: (messageId, data) => api.post(`/messages/polls/${messageId}/vote`, data),
};

// Rooms API
export const roomsAPI = {
  getRooms: () => api.get('/rooms/'),
  getRoom: (roomId) => api.get(`/rooms/${roomId}`),
  createRoom: (data) => api.post('/rooms/', data),
  updateRoom: (roomId, data) => api.put(`/rooms/${roomId}`, data),
  deleteRoom: (roomId) => api.delete(`/rooms/${roomId}`),
  addMember: (roomId, username) => api.post(`/rooms/${roomId}/members`, { username }),
  removeMember: (roomId, username) => api.delete(`/rooms/${roomId}/members/${username}`),
};

// Search API
export const searchAPI = {
  searchMessages: (query, params = {}) => api.get('/search/messages', { params: { query, ...params } }),
  searchUsers: (query, params = {}) => api.get('/search/users', { params: { query, ...params } }),
  searchRooms: (query, params = {}) => api.get('/search/rooms', { params: { query, ...params } }),
  searchFiles: (query, params = {}) => api.get('/search/files', { params: { query, ...params } }),
  globalSearch: (query, limit = 5) => api.get('/search/global', { params: { query, limit } }),
  getSuggestions: (query, type = 'all', limit = 5) => api.get('/search/suggestions', { params: { query, type, limit } }),
  getTrending: (limit = 10) => api.get('/search/trending', { params: { limit } }),
};

// AI API
export const aiAPI = {
  chat: (content) => api.post('/ai/chat', null, { params: { content } }),
};

// Room Admin API
export const roomAdminAPI = {
  muteUser: (roomId, targetUser) => api.post(`/rooms/${roomId}/mute_user`, null, { params: { target_user: targetUser } }),
  unmuteUser: (roomId, targetUser) => api.post(`/rooms/${roomId}/unmute_user`, null, { params: { target_user: targetUser } }),
  kickUser: (roomId, targetUser) => api.post(`/rooms/${roomId}/kick_user`, null, { params: { target_user: targetUser } }),
  setPermissions: (roomId, permissions) => api.post(`/rooms/${roomId}/set_permissions`, permissions),
  getDrawingSnapshot: (roomId) => api.get(`/rooms/${roomId}/drawing`),
};

export default api;
export { API_BASE_URL };
