import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, ''); // FastAPI backend URL (env override)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token if present at startup
const existingToken = localStorage.getItem('token');
if (existingToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${existingToken}`;
}

// Add a request interceptor that reads the latest token from localStorage on each request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// New: helper to update token on the shared client
export const setAuthTokenOnApiClient = (tokenOrNull) => {
  if (tokenOrNull) {
    api.defaults.headers.common['Authorization'] = `Bearer ${tokenOrNull}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Handle 401 responses globally - relaxed to avoid disrupting login flow
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    if (status === 401) {
      const isAuthRoute = url.includes('/users/login') || url.includes('/users/register') || url.includes('/token');
      const isPresencePolling = url.includes('/users/presence') || url.includes('/users/online');
      if (!isAuthRoute && !isPresencePolling) {
        localStorage.removeItem('token');
        localStorage.removeItem('privateKey');
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
  getMessages: (roomId) => api.get(`/messages/${roomId}`),
  reactToMessage: (messageId, reactionData) => api.post(`/messages/${messageId}/react`, reactionData),
  editMessage: (messageId, messageData) => api.put(`/messages/${messageId}`, messageData),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
  addReaction: (messageId, emoji) => api.post(`/messages/${messageId}/react`, { emoji }),
  removeReaction: (messageId, emoji) => api.post(`/messages/${messageId}/react`, { emoji }),
  searchMessages: (roomId, query) => api.get(`/messages/${roomId}/search?q=${encodeURIComponent(query)}`),
  forwardMessage: (messageId, targetRoomIds) => api.post(`/messages/${messageId}/forward`, { target_rooms: targetRoomIds }),
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

export default api;
export { API_BASE_URL };
