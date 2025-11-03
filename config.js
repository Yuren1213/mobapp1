// 🌐 Local PC IP (optional)
const PC_IP = "192.168.100.181";
const LOCAL_API_URL = `http://${PC_IP}:5135/api`;

// 🌍 Render URL (your live backend)
const RENDER_URL = "https://posbackend-1-o9uk.onrender.com";
const RENDER_API_URL = `${RENDER_URL}/api`;

// ✅ Use this as your active API base URL
export const API_URL = RENDER_API_URL; 
// Or switch to local by using: export const API_URL = LOCAL_API_URL;

// 🔗 API Endpoints
export const ENDPOINTS = {
  AUTH: `${API_URL}/auth`,
  PRODUCTS: `${API_URL}/product`,
  TEST: `${API_URL}/auth/test`,
  LOGIN: `${API_URL}/auth/login`,
};
