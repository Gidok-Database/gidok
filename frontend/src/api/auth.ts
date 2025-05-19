import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const register = (username: string, password: string) =>
  axios.post(`${API}/api/auth/register`, { username, password });

export const login = (username: string, password: string) =>
  axios.post(`${API}/api/auth/login`, { username, password });
