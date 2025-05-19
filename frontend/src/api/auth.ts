import axios from "axios";

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export const register = async (username: string, password: string): Promise<void> => {
  await axios.post("/api/auth/register", { username, password });
};

export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const res = await axios.post<AuthResponse>("/api/auth/login", { username, password });
  return res.data;
};

export const getMe = async (token: string): Promise<{ username: string }> => {
  const res = await axios.get("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};
