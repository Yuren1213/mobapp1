const PC_IP = "192.168.0.100";



const RENDER_URL = "https://posbackend-1-o9uk.onrender.com";
const RENDER_API_URL = `${RENDER_URL}/api`;


export const API_URL = RENDER_API_URL; 


export const ENDPOINTS = {
  AUTH: `${API_URL}/auth`,
  PRODUCTS: `${API_URL}/product`,
  TEST: `${API_URL}/auth/test`,
  LOGIN: `${API_URL}/auth/login`,
};
