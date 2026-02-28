import React, { useState } from "react";
import { authAPI } from "../api";

export default function Register({ setUser, setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      const res = await authAPI.register({ username, password });
      setUser(username);
      setToken(res.data.access_token);
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleRegister}>Register</button>
    </div>
  );
}