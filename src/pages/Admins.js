import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api/config";
import Layout from "../components/Layout";

const PAGE_SIZE = 10;

// ── Confirmation Modal ─────────────────────────────────────────────────────────
function ConfirmModal({ config, onConfirm, onCancel }) {
  if (!config) return null;
  const isDanger = config.type === "danger";
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <div style={{
        background: "#1a1a1a", border: `1px solid ${isDanger ? "rgba(255,23,68,0.35)" : "rgba(255,179,0,0.35)"}`,
        borderRadius: 14, padding: "32px 28px", width: "100%", maxWidth: 420,
        boxShadow: "0 16px 48px rgba(0,0,0,0.6)"
      }}>
        <div style={{ fontSize: 40, textAlign: "center", marginBottom: 16 }}>
          {isDanger ? "🗑" : "⚠️"}
        </div>
        <h3 style={{
          fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: 2,
          color: isDanger ? "var(--danger)" : "var(--warning)",
          textAlign: "center", marginBottom: 10
        }}>
          Confirm Action
        </h3>
        <p style={{ fontSize: 14, color: "var(--text)", textAlign: "center", lineHeight: 1.6, marginBottom: 8 }}>
          {config.message}
        </p>
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
          borderRadius: 8, padding: "10px 16px", textAlign: "center", marginBottom: 24
        }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Admin account: </span>
          <span style={{ fontWeight: 700, color: "var(--accent)", fontSize: 15 }}>{config.username}</span>
        </div>
        <div style={{
          background: isDanger ? "rgba(255,23,68,0.07)" : "rgba(255,179,0,0.07)",
          border: `1px solid ${isDanger ? "rgba(255,23,68,0.2)" : "rgba(255,179,0,0.2)"}`,
          borderRadius: 8, padding: "10px 14px", marginBottom: 24,
          fontSize: 12, color: isDanger ? "var(--danger)" : "var(--warning)", textAlign: "center"
        }}>
          {isDanger
            ? "⚠ This action cannot be undone. The account will be permanently removed."
            : "⚠ This will revoke the admin's access to the system immediately."}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: "center", padding: 12 }} onClick={onCancel}>
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
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const bothFilled     = newPw.length > 0 && confirmPw.length > 0;
  const passwordsMatch = newPw === confirmPw;

  const changePassword = async () => {
    setError("");
    if (!newPw || newPw.length < 6) { setError("New password must be at least 6 characters."); return; }
    if (!confirmPw)                  { setError("Please confirm your new password."); return; }
    if (newPw !== confirmPw)         { setError("Passwords do not match. Please re-enter your new password."); return; }
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
      <div className="card" style={{ width: 420, maxWidth: "90vw" }}>
        <h3 style={{ fontSize: 22, marginBottom: 6 }}>🔒 Change Password</h3>
        <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
          Setting new password for <strong style={{ color: "var(--accent)" }}>{username}</strong>
        </p>
        {error && <div className="error-msg" style={{ marginBottom: 16 }}>❌ {error}</div>}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label>New Password</label>
          <input type="password" placeholder="At least 6 characters" value={newPw}
            onChange={e => { setNewPw(e.target.value); setError(""); }} autoFocus />
        </div>
        <div className="form-group" style={{ marginBottom: 6 }}>
          <label>Confirm New Password</label>
          <input type="password" placeholder="Re-enter new password" value={confirmPw}
            onChange={e => { setConfirmPw(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && changePassword()}
            style={{ borderColor: bothFilled ? (passwordsMatch ? "rgba(0,230,118,0.5)" : "rgba(255,23,68,0.5)") : undefined }}
          />
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 20, minHeight: 18 }}>
          {bothFilled && (
            <span style={{ color: passwordsMatch ? "var(--success)" : "var(--danger)" }}>
              {passwordsMatch ? "✅ Passwords match" : "❌ Passwords do not match"}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" onClick={changePassword}
            disabled={loading || (bothFilled && !passwordsMatch)} style={{ flex: 1 }}>
            {loading ? "Saving..." : "🔒 Update Password"}
          </button>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Pagination Controls ────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => onChange(1)} disabled={page === 1}>««</button>
      <button className="btn btn-ghost btn-sm" onClick={() => onChange(page - 1)} disabled={page === 1}>‹ Prev</button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button key={p}
          className={`btn btn-sm ${p === page ? "btn-primary" : "btn-ghost"}`}
          onClick={() => onChange(p)}
          style={{ minWidth: 34 }}
        >
          {p}
        </button>
      ))}
      <button className="btn btn-ghost btn-sm" onClick={() => onChange(page + 1)} disabled={page === totalPages}>Next ›</button>
      <button className="btn btn-ghost btn-sm" onClick={() => onChange(totalPages)} disabled={page === totalPages}>»»</button>
    </div>
  );
}

// ── Main Admins Component ──────────────────────────────────────────────────────
function Admins() {
  const [admins, setAdmins]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [msg, setMsg]                   = useState(null);
  const [pwModal, setPwModal]           = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);
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

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1); }, [search]);

  const action = async (url, successMsg, method = "post") => {
    try {
      if (method === "delete") await api.delete(url);
      else await api.post(url);
      showMsg(successMsg);
      fetchAdmins();
    } catch (e) { showMsg(e.response?.data?.message || "Action failed.", "error"); }
  };

  const askConfirm = (username, type, actionUrl, successMsg) => {
    const message = type === "danger"
      ? "Are you sure you want to permanently delete this admin account? This action may affect their system access."
      : "Are you sure you want to disable this admin account? This will revoke their access immediately.";
    setConfirmModal({
      username, type, message,
      onConfirm: async () => {
        setConfirmModal(null);
        if (type === "danger") await action(actionUrl, successMsg, "delete");
        else await action(actionUrl, successMsg);
      }
    });
  };

  const pending   = admins.filter(a => a.status === "pending");
  const allAdmins = admins.filter(a => a.status !== "pending" && a.role !== "owner");

  // Search filter (case-insensitive)
  const filtered = allAdmins.filter(a =>
    a.username.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Layout>
      <div className="page-header">
        <h2>Manage Admins</h2>
        <p>Approve, disable, or manage admin accounts</p>
      </div>

      <ConfirmModal
        config={confirmModal}
        onConfirm={() => confirmModal?.onConfirm()}
        onCancel={() => setConfirmModal(null)}
      />

      {pwModal && (
        <ChangePasswordModal
          username={pwModal}
          onClose={() => setPwModal(null)}
          onSuccess={showMsg}
        />
      )}

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

      {/* ── Pending Approval ── */}
      <div className="card" style={{ marginBottom: 20, borderColor: pending.length > 0 ? "rgba(255,193,7,0.3)" : undefined }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 20 }}>Pending Approval</h3>
          <span className="badge badge-expiring">{pending.length}</span>
        </div>
        {loading ? <div className="empty-state">Loading...</div>
          : pending.length === 0
            ? <div className="empty-state">No pending requests</div>
            : <div className="table-wrap">
                <table>
                  <thead><tr><th>#</th><th>Username</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {pending.map((a, i) => (
                      <tr key={a.username}>
                        <td style={{ color: "var(--muted)", fontSize: 12 }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{a.username}</td>
                        <td><span className="badge badge-expiring">Pending</span></td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn btn-success btn-sm"
                              onClick={() => action(`/admins/${a.username}/approve`, `${a.username} approved!`)}>
                              Approve
                            </button>
                            <button className="btn btn-danger btn-sm"
                              onClick={() => action(`/admins/${a.username}/reject`, `${a.username} rejected.`)}>
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        }
      </div>

      {/* ── Admins panel ── */}
      <div className="card">
        {/* Header — no count here anymore */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 20 }}>Admins</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <span className="badge badge-active">{allAdmins.filter(a => a.status === "active").length} active</span>
            <span className="badge badge-expired">{allAdmins.filter(a => a.status === "disabled").length} disabled</span>
          </div>
        </div>

        {/* Search field */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
            <input
              placeholder="Search admin"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>

        {loading ? <div className="empty-state">Loading...</div>
          : filtered.length === 0
            ? <div className="empty-state">
                {search ? `No admins found matching "${search}"` : "No admin accounts found"}
              </div>
            : <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Username</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((a, i) => (
                        <tr key={a.username} style={{ opacity: a.status === "disabled" ? 0.7 : 1 }}>
                          <td style={{ color: "var(--muted)", fontSize: 12 }}>
                            {(page - 1) * PAGE_SIZE + i + 1}
                          </td>
                          <td style={{ fontWeight: 600 }}>{a.username}</td>
                          <td>
                            {a.status === "active"
                              ? <span className="badge badge-active">Active</span>
                              : <span className="badge badge-expired">Disabled</span>}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {a.status === "active" ? (
                                <button className="btn btn-warning btn-sm"
                                  onClick={() => askConfirm(a.username, "warning", `/admins/${a.username}/disable`, `${a.username} has been disabled.`)}>
                                  Disable
                                </button>
                              ) : (
                                <button className="btn btn-success btn-sm"
                                  onClick={() => action(`/admins/${a.username}/enable`, `${a.username} has been enabled!`)}>
                                  Enable
                                </button>
                              )}
                              <button className="btn btn-primary btn-sm" onClick={() => setPwModal(a.username)}>
                                Change Password
                              </button>
                              <button className="btn btn-danger btn-sm"
                                onClick={() => askConfirm(a.username, "danger", `/admins/${a.username}`, `${a.username} has been deleted.`)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <Pagination page={page} totalPages={totalPages} onChange={setPage} />

                {/* Total Records — bottom left */}
                <div style={{
                  marginTop: 14, fontSize: 12, color: "var(--muted)",
                  borderTop: "1px solid var(--border)", paddingTop: 12
                }}>
                  Total Records Fetched: <strong style={{ color: "var(--text)" }}>{filtered.length}</strong>
                  {search && <span style={{ marginLeft: 8 }}>
                    (filtered from <strong style={{ color: "var(--text)" }}>{allAdmins.length}</strong> total)
                  </span>}
                </div>
              </>
        }
      </div>
    </Layout>
  );
}

export default Admins;
