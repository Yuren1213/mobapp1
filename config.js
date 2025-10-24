const PC_IP = "192.168.100.181"; // replace with your PC IP
export const API_URL = `http://${PC_IP}:5000/api`;

export const ENDPOINTS = {
  AUTH: `${API_URL}/auth`,
  CART: `${API_URL}/cart`,
  PRODUCTS: `${API_URL}/products`,
  ORDERS: `${API_URL}/orders`,
};
