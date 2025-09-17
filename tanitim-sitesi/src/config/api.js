// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const API_ENDPOINTS = {
  UPLOAD: `${API_BASE_URL}/api/upload`,
  HEALTH: `${API_BASE_URL}/api/health`,
  GET_CHAT_ID: `${API_BASE_URL}/api/get-chat-id`
};

export default API_BASE_URL;
