import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // FastAPI backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (userData) => api.post('/users/login', userData),
};

// Rooms API
export const roomsAPI = {
  createRoom: (roomData) => api.post('/rooms/create', roomData),
  listRooms: () => api.get('/rooms/'),
};

// Messages API
export const messagesAPI = {
  sendMessage: (messageData) => api.post('/messages/send', messageData),
  sendFileMessage: (formData) => api.post('/messages/send_file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getMessages: (roomId) => api.get(`/messages/${roomId}`),
  reactToMessage: (messageId, reactionData) => api.post(`/messages/${messageId}/react`, reactionData),
};

export default api;
