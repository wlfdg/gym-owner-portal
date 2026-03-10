import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api/config";
import Layout from "../components/Layout";

// ── Confirmation Modal ─────────────────────────────────────────────────────────
function ConfirmModal({ config, onConfirm, onCancel }) {
  if (!config) return null;
  const isDanger = config.type === "danger";
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20
    }}>
      <div style={{
        background: "#1a1a1a", border: `1px solid ${isDanger ? "rgba(255,23,68,0.35)" : "rgba(255,179,0,0.35)"}`,
        borderRadius: 14, padding: "32px 28px", width: "100%", maxWidth: 420,
        boxShadow: "0 16px 48px rgba(0,0,0,0.6)"
      }}>
        {/* Icon */}
        <div style={{ fontSize: 40, textAlign: "center", marginBottom: 16 }}>
          {isDanger ? "🗑" : "⚠️"}
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: 2,
          color: isDanger ? "var(--danger)" : "var(--warning)",
          textAlign: "center", marginBottom: 10
        }}>
          Confirm Action
        </h3>

        {/* Message */}
        <p style={{
          fontSize: 14, color: "var(--text)", textAlign: "center",
          lineHeight: 1.6, marginBottom: 8
        }}>
          {config.message}
        </p>

        {/* Username highlight */}
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
          borderRadius: 8, padding: "10px 16px", textAlign: "center",
          marginBottom: 24
        }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Admin account: </span>
          <span style={{ fontWeight: 700, color: "var(--accent)", fontSize: 15 }}>{config.username}</span>
        </div>

        {/* Warning note */}
        <div style={{
          background: isDanger ? "rgba(255,23,68,0.07)" : "rgba(255,179,0,0.07)",
          border: `1px solid ${isDanger ? "rgba(255,23,68,0.2)" : "rgba(255,179,0,0.2)"}`,
          borderRadius: 8, padding: "10px 14px", marginBottom: 24,
          fontSize: 12, color: isDanger ? "var(--danger)" : "var(--warning)",
          textAlign: "center"
        }}>
          {isDanger
            ? "⚠ This action cannot be undone. The account will be permanently removed."
            : "⚠ This will revoke the admin's access to the system immediately."}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn btn-ghost"
            style={{ flex: 1, justifyContent: "center", padding: 12 }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={`btn ${isDanger ? "btn-danger" : "btn-warning"}`}
            style={{ flex: 1, justifyContent: "center", padding: 12, fontWeight: 700 }}
            onClick={onConfirm}
          >
            {isDanger ? "🗑 Delete" : "⚠ Disable"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Change Password Modal ──────────────────────────────────────────────────────
function ChangePasswordModal({ username, onClose, onSuccess }) {
  const [newPw, setNewPw]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const changePassword = async () => {
    if (!newPw || newPw.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const res = await api.post(`/admins/${username}/change-password`, { new_password: newPw });
      onSuccess(res.data.message);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to change password.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <div className="card" style={{ width: 400, maxWidth: "90vw" }}>
        <h3 style={{ fontSize: 22, marginBottom: 6 }}>🔒 Change Password</h3>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
          Setting new password for <strong style={{ color: "var(--accent)" }}>{username}</strong>
        </p>
        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label>New Password</label>
          <input
            type="password" placeholder="At least 6 characters"
            value={newPw} onChange={e => setNewPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && changePassword()}
            autoFocus
          />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" onClick={changePassword} disabled={loading} style={{ flex: 1 }}>
            {loading ? "Saving..." : "Update Password"}
          </button>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Admins Component ──────────────────────────────────────────────────────
function Admins() {
  const [admins, setAdmins]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [msg, setMsg]               = useState(null);
  const [pwModal, setPwModal]       = useState(null);   // username string
  const [confirmModal, setConfirmModal] = useState(null); // { username, type, message, action }
  const mounted = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 5000);
  };

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admins");
      if (mounted.current) setAdmins(res.data);
    } catch { showMsg("Failed to load admins.", "error"); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  // Generic action (approve, reject, enable)
  const action = async (url, successMsg, method = "post") => {
    try {
      if (method === "delete") await api.delete(url);
      else await api.post(url);
      showMsg(successMsg);
      fetchAdmins();
    } catch (e) { showMsg(e.response?.data?.message || "Action failed.", "error"); }
  };

  // Open confirmation modal
  const askConfirm = (username, type, actionUrl, successMsg) => {
    const message = type === "danger"
      ? `Are you sure you want to permanently delete this admin account? This action may affect their system access.`
      : `Are you sure you want to disable this admin account? This will revoke their access immediately.`;
    setConfirmModal({
      username, type, message,
      onConfirm: async () => {
        setConfirmModal(null);
        if (type === "danger") await action(actionUrl, successMsg, "delete");
        else await action(actionUrl, successMsg);
      }
    });
  };

  const pending  = admins.filter(a => a.status === "pending");
  const active   = admins.filter(a => a.status === "active" && a.role === "admin");
  const disabled = admins.filter(a => a.status === "disabled");

  const AdminRow = ({ a, i, showApprove }) => (
    <tr>
      <td style={{ color: "var(--muted)", fontSize: 12 }}>{i + 1}</td>
      <td style={{ fontWeight: 600 }}>{a.username}</td>
      <td>
        {a.status === "pending"  && <span className="badge badge-expiring">Pending</span>}
        {a.status === "active"   && <span className="badge badge-active">Active</span>}
        {a.status === "disabled" && <span className="badge badge-expired">Disabled</span>}
      </td>
      <td>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {showApprove && <>
            <button className="btn btn-success btn-sm"
              onClick={() => action(`/admins/${a.username}/approve`, `${a.username} approved!`)}>
              Approve
            </button>
            <button className="btn btn-danger btn-sm"
              onClick={() => action(`/admins/${a.username}/reject`, `${a.username} rejected.`)}>
              Reject
            </button>
          </>}

          {a.status === "active" && !showApprove && (
            <button className="btn btn-warning btn-sm"
              onClick={() => askConfirm(
                a.username, "warning",
                `/admins/${a.username}/disable`,
                `${a.username} has been disabled.`
              )}>
              Disable
            </button>
          )}

          {a.status === "disabled" && (
            <button className="btn btn-success btn-sm"
              onClick={() => action(`/admins/${a.username}/enable`, `${a.username} enabled!`)}>
              Enable
            </button>
          )}

          <button className="btn btn-primary btn-sm"
            onClick={() => setPwModal(a.username)}>
            Change Password
          </button>

          <button className="btn btn-danger btn-sm"
            onClick={() => askConfirm(
              a.username, "danger",
              `/admins/${a.username}`,
              `${a.username} has been deleted.`
            )}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <Layout>
      <div className="page-header">
        <h2>Manage Admins</h2>
        <p>Approve, disable, or manage admin accounts</p>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        config={confirmModal}
        onConfirm={() => confirmModal?.onConfirm()}
        onCancel={() => setConfirmModal(null)}
      />

      {/* Change Password Modal */}
      {pwModal && (
        <ChangePasswordModal
          username={pwModal}
          onClose={() => setPwModal(null)}
          onSuccess={showMsg}
        />
      )}

      {/* Status message */}
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

      {/* Pending */}
      <div className="card" style={{ marginBottom: 20, borderColor: pending.length > 0 ? "rgba(255,193,7,0.3)" : undefined }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 20 }}>Pending Approval</h3>
          <span className="badge badge-expiring">{pending.length}</span>
        </div>
        {loading ? <div className="empty-state">Loading...</div>
          : pending.length === 0 ? <div className="empty-state">No pending requests</div>
          : <div className="table-wrap"><table>
              <thead><tr><th>#</th><th>Username</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{pending.map((a, i) => <AdminRow key={a.username} a={a} i={i} showApprove={true} />)}</tbody>
            </table></div>
        }
      </div>

      {/* Active */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 20 }}>Active Admins</h3>
          <span className="badge badge-active">{active.length}</span>
        </div>
        {loading ? <div className="empty-state">Loading...</div>
          : active.length === 0 ? <div className="empty-state">No active admins</div>
          : <div className="table-wrap"><table>
              <thead><tr><th>#</th><th>Username</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{active.map((a, i) => <AdminRow key={a.username} a={a} i={i} showApprove={false} />)}</tbody>
            </table></div>
        }
      </div>

      {/* Disabled */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 20 }}>Disabled Admins</h3>
          <span className="badge badge-expired">{disabled.length}</span>
        </div>
        {loading ? <div className="empty-state">Loading...</div>
          : disabled.length === 0 ? <div className="empty-state">No disabled admins</div>
          : <div className="table-wrap"><table>
              <thead><tr><th>#</th><th>Username</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{disabled.map((a, i) => <AdminRow key={a.username} a={a} i={i} showApprove={false} />)}</tbody>
            </table></div>
        }
      </div>
    </Layout>
  );
}

export default Admins;
