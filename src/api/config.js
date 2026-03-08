import axios from "axios";

const API = process.env.REACT_APP_API_URL || "https://gym-deploy-sul4.onrender.com";

const api = axios.create({
  baseURL: API,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  config.headers["X-Admin-User"] = "owner";
  return config;
});

export const isSuperAdmin = () => localStorage.getItem("gym_role") === "owner";

export default API;
export { api };
