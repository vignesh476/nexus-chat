import React, { useState } from "react";
import { authAPI } from "../api";

export default function Login({ setUser, setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await authAPI.login({ username, password });
      setUser(username);
      setToken(res.data.access_token);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}