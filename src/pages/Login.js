import { useState } from "react";
import { api } from "../api/config";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername]     = useState("");
  const [password, setPassword]     = useState("");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [regUsername, setRegUsername]   = useState("");
  const [regPassword, setRegPassword]   = useState("");
  const [regLoading, setRegLoading]     = useState(false);
  const [regMsg, setRegMsg]             = useState("");
  const navigate = useNavigate();

  const login = async () => {
    if (!username || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/login", { username, password });
      if (res.data.success) {
        // ✅ FIX: store the correct key that PrivateRoute checks for
        localStorage.setItem("owner_logged_in", "true");
        localStorage.setItem("gym_admin", res.data.username);
        localStorage.setItem("gym_role",  res.data.role);
        // Store shift_id so logout can calculate per-shift revenue correctly
        if (res.data.shift_id) {
          localStorage.setItem("shift_id", String(res.data.shift_id));
        }
        navigate("/dashboard");
      }
    } catch (e) {
      setError(e.response?.data?.message || "Invalid username or password.");
    }
    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === "Enter") login(); };

  const register = async () => {
    if (!regUsername || !regPassword) { setRegMsg("Please fill in all fields."); return; }
    setRegLoading(true);
    setRegMsg("");
    try {
      await api.post("/register", { username: regUsername, password: regPassword });
      setRegMsg("✅ Account created! Waiting for owner approval.");
      setRegUsername("");
      setRegPassword("");
    } catch (e) {
      setRegMsg(e.response?.data?.message || "❌ Username already exists.");
    }
    setRegLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:40, color:"var(--accent)", textAlign:"center", letterSpacing:3, lineHeight:1 }}>
          LOYD'S FITNESS<br />GYM
        </h1>
        <p style={{ textAlign:"center", color:"var(--muted)", fontSize:13, marginTop:6, marginBottom:0 }}>
          Owner Portal
        </p>

        {!showRegister ? (
          <>
            {error && <div className="error-msg" style={{ marginTop:20 }}>{error}</div>}
            <div className="login-form">
              <input
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={handleKey}
                autoFocus
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKey}
              />
              <button className="btn btn-primary" onClick={login} disabled={loading} style={{ width:"100%" }}>
                {loading ? "Signing in..." : "Sign In →"}
              </button>
            </div>
            <p
              style={{ marginTop:24, fontSize:12, color:"var(--muted)", textAlign:"center", cursor:"pointer", textDecoration:"underline" }}
              onClick={() => { setShowRegister(true); setError(""); }}
            >
              Create an Account
            </p>
          </>
        ) : (
          <>
            <div className="login-form" style={{ marginTop:20 }}>
              <input
                placeholder="New Username"
                value={regUsername}
                onChange={e => setRegUsername(e.target.value)}
                autoFocus
              />
              <input
                type="password"
                placeholder="New Password (min 6 chars)"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
              />
              <button className="btn btn-primary" onClick={register} disabled={regLoading} style={{ width:"100%" }}>
                {regLoading ? "Creating..." : "Create Account"}
              </button>
            </div>
            {regMsg && (
              <p style={{ marginTop:14, fontSize:12, textAlign:"center", color: regMsg.startsWith("✅") ? "var(--success)" : "var(--danger)" }}>
                {regMsg}
              </p>
            )}
            <p
              style={{ marginTop:16, fontSize:12, color:"var(--muted)", textAlign:"center", cursor:"pointer", textDecoration:"underline" }}
              onClick={() => { setShowRegister(false); setRegMsg(""); }}
            >
              ← Back to Login
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
