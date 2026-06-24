import { createContext, useContext, useState, useEffect } from 'react';
import { loginRequest, registerRequest, getMeRequest, updateResumeRequest } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('applypilot_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('applypilot_token');

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await getMeRequest(storedToken);
        setUser(res.data);
        setToken(storedToken);
      } catch (err) {
        localStorage.removeItem('applypilot_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (email, password) => {
    const res = await loginRequest(email, password);
    localStorage.setItem('applypilot_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (name, email, password) => {
    const res = await registerRequest(name, email, password);
    localStorage.setItem('applypilot_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('applypilot_token');
    setToken(null);
    setUser(null);
  };

  // NEW: update the saved resume and keep local user state in sync
  // immediately, so every component reading `user.resume` updates
  // without needing a full page refresh or re-fetch of /me.
  const saveResume = async (resumeText) => {
    const res = await updateResumeRequest(resumeText);
    setUser((prev) => ({ ...prev, resume: res.data.resume }));
    return res.data.resume;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, saveResume }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}