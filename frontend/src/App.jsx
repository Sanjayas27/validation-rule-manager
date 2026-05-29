import { useState, useEffect } from "react";
import axios from "axios";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import "./App.css";

const API = "http://localhost:5000";
axios.defaults.withCredentials = true;

function App() {
  const [auth, setAuth] = useState(null); // null = loading
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check URL params for login result
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "success") {
      window.history.replaceState({}, "", "/");
    }
    if (params.get("error")) {
      console.error("Login error:", params.get("error"));
      window.history.replaceState({}, "", "/");
    }

    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API}/auth/status`);
      setAuth(res.data.authenticated);
      setUser(res.data.user);
    } catch {
      setAuth(false);
    }
  };

  const handleLogin = () => {
    window.location.href = `${API}/auth/login`;
  };

  const handleLogout = async () => {
    await axios.post(`${API}/auth/logout`);
    setAuth(false);
    setUser(null);
  };

  if (auth === null) {
    return (
      <div className="loading-screen">
        <div className="loader" />
        <p>Connecting...</p>
      </div>
    );
  }

  return auth ? (
    <Dashboard user={user} onLogout={handleLogout} api={API} />
  ) : (
    <LoginPage onLogin={handleLogin} />
  );
}

export default App;
