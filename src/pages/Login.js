import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import API from "../api/config";

function Login() {
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const login = async () => {
    if (!password) { setError("Password is required."); return; }
    setLoading(true); setError("");
    try {
      const res = await axios.post(`${API}/login`, { username: "owner", password });
      if (res.data.success && res.data.role === "owner") {
        localStorage.setItem("owner_logged_in", "true");
        navigate("/dashboard", { replace: true });
      } else {
        setError("Access denied. Owner credentials only.");
      }
    } catch (e) {
      setError(e.response?.data?.message || "Invalid credentials.");
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:44, color:"var(--accent)", letterSpacing:3, lineHeight:1 }}>
            LOYD'S FITNESS
          </h1>
          <div style={{ display:"inline-block", background:"rgba(232,255,0,0.1)", border:"1px solid rgba(232,255,0,0.3)", color:"var(--accent)", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:3, padding:"4px 12px", borderRadius:4, marginTop:8 }}>
            ★ Owner Portal
          </div>
          <p style={{ color:"var(--muted)", fontSize:13, marginTop:12 }}>Restricted access — Owner only</p>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div className="login-form">
          <div className="form-group">
            <label>Username</label>
            <input value="owner" disabled style={{ opacity:0.5 }} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Enter owner password"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key==="Enter" && login()} autoFocus />
          </div>
          <button className="btn btn-primary" onClick={login} disabled={loading}
            style={{ width:"100%", padding:14, justifyContent:"center", fontSize:14 }}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
