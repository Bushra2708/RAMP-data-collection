import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AppContext = createContext();

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export const AppProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('rbhms_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('rbhms_user') || 'null'));
  const [loading, setLoading] = useState(false);
  const [masterData, setMasterData] = useState({
    districts: [],
    mandals: [],
    villages: [],
    sectors: [],
    esdpBatches: [],
    supportCategories: [],
  });
  
  // Simulation Toggle (for testing both role views on desktop)
  const [simulationMode, setSimulationMode] = useState(false); // true: simulate mobile counsellor view
  
  // Set Auth headers
  const getHeaders = (isMultipart = false) => {
    const headers = {};
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Fetch Master Data
  const fetchMasterData = async () => {
    try {
      const res = await fetch(`${API_BASE}/master-data`);
      const data = await res.json();
      if (data.success) {
        setMasterData(data.data);
      }
    } catch (err) {
      console.error('Error loading master data:', err);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Validate Token on Mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: getHeaders(),
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          localStorage.setItem('rbhms_user', JSON.stringify(data.user));
        } else {
          logout();
        }
      } catch (err) {
        console.error('Session validation failed:', err);
        logout();
      }
    };
    validateToken();
  }, [token]);

  // Admin / Counsellor Login
  const login = async (credentials, type) => {
    setLoading(true);
    try {
      const endpoint = type === 'Admin' ? 'auth/admin/login' : 'auth/counsellor/login';
      const res = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('rbhms_token', data.token);
        localStorage.setItem('rbhms_user', JSON.stringify(data.user));
        toast.success(`Welcome, ${data.user.fullName}!`);
        // Sync simulation mode to counsellor role
        setSimulationMode(data.user.role === 'Counsellor');
        return { success: true };
      } else {
        toast.error(data.message || 'Login failed.');
        return { success: false, message: data.message };
      }
    } catch (err) {
      toast.error('Unable to connect to the backend server.');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('rbhms_token');
    localStorage.removeItem('rbhms_user');
    toast.success('Logged out successfully.');
  };

  // Register a counsellor (Admin only)
  const registerCounsellorAccount = async (counsellorDetails) => {
    try {
      const res = await fetch(`${API_BASE}/auth/counsellor/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(counsellorDetails),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Counsellor registered successfully.');
        return { success: true };
      } else {
        toast.error(data.message || 'Registration failed.');
        return { success: false, message: data.message };
      }
    } catch (err) {
      toast.error('Server connection error.');
      return { success: false };
    }
  };

  return (
    <AppContext.Provider
      value={{
        token,
        user,
        loading,
        masterData,
        simulationMode,
        setSimulationMode,
        API_BASE,
        getHeaders,
        login,
        logout,
        registerCounsellorAccount,
        fetchMasterData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
