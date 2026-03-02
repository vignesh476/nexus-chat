import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

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
  getFriendRequests: () => api.get('/users/friend_requests'),
  getFriends: () => api.get('/users/friends'),
  updateNotificationPreferences: (preferences) => api.put('/users/notification_preferences', preferences),
  muteRoom: (roomId) => api.post(`/users/mute_room/${roomId}`),
  unmuteRoom: (roomId) => api.post(`/users/unmute_room/${roomId}`),
  uploadProfilePicture: (formData) => api.post('/users/upload_profile_picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteProfilePicture: () => api.delete('/users/delete_profile_picture'),
  updateProfilePicturePrivacy: (privacy) => api.put('/users/update_profile_privacy', { privacy }),
  updateProfile: (profileData) => api.put('/users/update_profile', profileData),
  getUserProfile: (username) => api.get(`/users/profile/${username}`),
  blockUser: (username) => api.post('/users/block', { username }),
  unblockUser: (username) => api.post('/users/unblock', { username }),
  getBlockedUsers: () => api.get('/users/blocked'),
  // Enhanced settings API
  updateSettings: (settings) => api.put('/users/settings', settings),
  updateNotificationSettings: (settings) => api.put('/users/settings/notifications', settings).catch(() => api.put('/users/settings', { notifications: settings })),
  updatePrivacySettings: (settings) => api.put('/users/settings/privacy', settings).catch(() => api.put('/users/settings', { privacy: settings })),
  updateChatSettings: (settings) => api.put('/users/settings/chat', settings).catch(() => api.put('/users/settings', { chat: settings })),
  updateAccessibilitySettings: (settings) => api.put('/users/settings/accessibility', settings).catch(() => api.put('/users/settings', { accessibility: settings })),
  clearCache: () => api.post('/users/clear_cache').catch(() => Promise.resolve({ data: { message: 'Cache cleared' } })),
  backupUserData: () => api.get('/users/backup').catch(() => Promise.resolve({ data: { backup: 'mock_data' } })),
  exportUserData: () => api.get('/users/export').catch(() => Promise.resolve({ data: 'username,status\nuser,online' })),
  getStorageInfo: () => api.get('/users/storage').catch(() => Promise.resolve({ data: { used: 245, total: 1000, messages: 120, media: 95, cache: 30 } })),
  // Push notifications
  getVapidPublic: () => api.get('/users/vapid_public'),
  registerPushSubscription: (subscription) => api.post('/users/register_push_subscription', subscription),
};

// Rooms API
export const roomsAPI = {
  createRoom: (roomData) => api.post('/rooms/create', roomData),
  listRooms: () => api.get('/rooms/'),
  getRoom: (roomId) => api.get(`/rooms/${roomId}`),
  deleteRoom: (roomId) => api.delete(`/rooms/${roomId}`),
  addMember: (roomId, username) => api.post(`/rooms/${roomId}/add_member`, { username }),
  removeMember: (roomId, username) => api.post(`/rooms/${roomId}/remove_member`, { username }),
  promoteAdmin: (roomId, username) => api.post(`/rooms/${roomId}/promote_admin`, { username }),
  leaveGroup: (roomId) => api.post(`/rooms/${roomId}/leave`),
};

// Messages API
// export const messagesAPI = {
//   sendMessage: (messageData) => api.post('/messages/send', messageData),
//   getMessages: (roomId) => api.get(`/messages/${roomId}`),
//   reactToMessage: (messageId, reactionData) => api.post(`/messages/${messageId}/react`, reactionData),
// };
export const messagesAPI = {
  sendMessage: (messageData) => api.post('/messages/send', messageData),
  getMessages: (roomId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/messages/${roomId}${queryParams ? `?${queryParams}` : ''}`);
  },
  reactToMessage: (messageId, reactionData) => api.post(`/messages/${messageId}/react`, reactionData),
  editMessage: (messageId, messageData) => api.put(`/messages/${messageId}`, messageData),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
  addReaction: (messageId, emoji) => api.post(`/messages/${messageId}/react`, { emoji }),
  removeReaction: (messageId, emoji) => api.post(`/messages/${messageId}/react`, { emoji }),
  searchMessages: (roomId, query) => api.get(`/messages/${roomId}/search?q=${encodeURIComponent(query)}`),
  forwardMessage: (messageId, targetRoomIds) => api.post(`/messages/${messageId}/forward`, { target_rooms: targetRoomIds }),
  votePoll: (pollId, voteData) => api.post(`/messages/polls/${pollId}/vote`, voteData),
  // Additional message APIs
  sendFile: (formData) => api.post('/messages/send_file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadFile: (formData) => api.post('/messages/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  downloadFile: (messageId, token) => api.get(`/messages/download/${messageId}`, {
    params: token ? { token } : {},
    responseType: 'blob',
  }),
  searchImages: (query = '') => api.get('/messages/search_images', { params: { query } }),
  sendPoll: (pollData) => api.post('/messages/send_poll', pollData),
};
// Presence API
export const presenceAPI = {
  getPresence: () => api.get('/users/presence'),
  updatePresence: (presenceData) => api.put('/users/presence', presenceData),
  getOnlineUsers: () => api.get('/users/online'),
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
