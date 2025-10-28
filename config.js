// 🌐 Local PC IP (optional)
const PC_IP = "192.168.0.103";
const LOCAL_API_URL = `http://${PC_IP}:5135/api`;

// 🌍 Ngrok URL (for mobile testing)
const NGROK_URL = "https://untooled-rostrally-trent.ngrok-free.dev";
const NGROK_API_URL = `${NGROK_URL}/api`;

// ✅ Choose which backend to use
// export const API_URL = LOCAL_API_URL; // For local WiFi testing
export const API_URL = NGROK_API_URL;   // For ngrok / external testing

// 🔗 API Endpoints
export const ENDPOINTS = {
  AUTH: `${API_URL}/auth`,
  PRODUCTS: `${API_URL}/product`,
  TEST: `${API_URL}/auth/test`,
  LOGIN: `${API_URL}/auth/login`,
};