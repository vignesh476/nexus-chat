import axios from 'axios';
import config from '../config';

// Use config module for consistent API URL handling
const API_BASE = config.API_URL;
const base = `${API_BASE.replace(/\/+$|$/, '')}/stories`;

const storyApi = axios.create({
  baseURL: base,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add auth token to requests
storyApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('nexus_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const storiesApi = {
  // Create a new story
  createStory: async (formData) => {
    try {
      const response = await storyApi.post('/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  },

  // Get all stories
  getAllStories: async () => {
    try {
      const response = await storyApi.get('/');
      return response.data;
    } catch (error) {
      console.error('Error fetching stories:', error);
      throw error;
    }
  },

  // Get stories for a specific user
  getUserStories: async (username) => {
    try {
      const response = await storyApi.get(`/${username}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user stories:', error);
      throw error;
    }
  },

  // Interact with a story (view, reply, etc.)
  interactWithStory: async (storyId, action, payload = null) => {
    try {
      const formData = new FormData();
      formData.append('action', action);
      if (payload) {
        formData.append('payload', JSON.stringify(payload));
      }
      const response = await storyApi.post(`/${storyId}/interact`, formData);
      return response.data;
    } catch (error) {
      console.error('Error interacting with story:', error);
      throw error;
    }
  },

  // Mark story as seen
  markStorySeen: async (storyId) => {
    try {
      const response = await storyApi.post(`/${storyId}/seen`);
      return response.data;
    } catch (error) {
      console.error('Error marking story as seen:', error);
      throw error;
    }
  },

  // Delete a story
  deleteStory: async (storyId) => {
    try {
      const response = await storyApi.delete(`/${storyId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  },
};

export default storiesApi;
