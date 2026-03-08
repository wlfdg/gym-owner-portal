import { useState } from "react";
import { api } from "../api/config";
import Layout from "../components/Layout";

function Settings() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [msg,       setMsg]       = useState(null);

  const showMsg = (text, type="success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 5000);
  };

  const handleSubmit = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      showMsg("Please fill in all fields.", "error"); return;
    }
    if (newPw.length < 6) {
      showMsg("New password must be at least 6 characters.", "error"); return;
    }
    if (newPw !== confirmPw) {
      showMsg("New passwords do not match.", "error"); return;
    }
    if (newPw === currentPw) {
      showMsg("New password must be different from current.", "error"); return;
    }
    setLoading(true);
    try {
      const res = await api.post("/owner/change-password", {
        current_password: currentPw,
        new_password: newPw
      });
      showMsg(res.data.message);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (e) {
      showMsg(e.response?.data?.message || "Failed to change password.", "error");
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="page-header">
        <h2>Settings</h2>
        <p>Manage your owner account</p>
      </div>

      <div style={{ maxWidth: 480 }}>
        <div className="card">
          <h3 style={{ fontSize: 22, marginBottom: 6 }}>🔒 Change Password</h3>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>
            Update your owner portal login password.
          </p>

          {msg && (
            <div style={{
              padding: "12px 16px", borderRadius: 8, marginBottom: 20,
              fontSize: 14, fontWeight: 600,
              background: msg.type === "success" ? "rgba(0,230,118,0.1)" : "rgba(255,23,68,0.1)",
              border: `1px solid ${msg.type === "success" ? "rgba(0,230,118,0.3)" : "rgba(255,23,68,0.3)"}`,
              color: msg.type === "success" ? "var(--success)" : "var(--danger)"
            }}>
              {msg.type === "success" ? "✅" : "❌"} {msg.text}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>New Password</label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label>Confirm New Password</label>
            <input
              type="password"
              placeholder="Re-enter new password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Saving..." : "🔒 Update Password"}
          </button>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 18, marginBottom: 8 }}>ℹ️ Account Info</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "var(--muted)" }}>Username</span>
              <span style={{ fontWeight: 600, color: "var(--accent)" }}>owner</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "var(--muted)" }}>Role</span>
              <span style={{ fontWeight: 600 }}>★ Owner</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "var(--muted)" }}>Portal</span>
              <span style={{ fontWeight: 600 }}>Loyd's Fitness Gym</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Settings;
