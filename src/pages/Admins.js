import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api/config";
import Layout from "../components/Layout";

function Admins() {
  const [admins, setAdmins]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState(null);
  const [pwModal, setPwModal]     = useState(null); // {username}
  const [newPw, setNewPw]         = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const mounted = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const showMsg = (text, type="success") => { setMsg({text,type}); setTimeout(()=>setMsg(null),5000); };

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get("/admins"); if (mounted.current) setAdmins(res.data); }
    catch { showMsg("Failed to load admins.", "error"); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const action = async (url, successMsg, method="post") => {
    try {
      if (method === "delete") await api.delete(url);
      else await api.post(url);
      showMsg(successMsg); fetchAdmins();
    } catch (e) { showMsg(e.response?.data?.message || "Action failed.", "error"); }
  };

  const openPwModal = (username) => { setPwModal(username); setNewPw(""); };
  const closePwModal = () => { setPwModal(null); setNewPw(""); };

  const changePassword = async () => {
    if (!newPw || newPw.length < 6) { showMsg("Password must be at least 6 characters.", "error"); return; }
    setPwLoading(true);
    try {
      const res = await api.post(`/admins/${pwModal}/change-password`, { new_password: newPw });
      showMsg(res.data.message);
      closePwModal();
    } catch (e) { showMsg(e.response?.data?.message || "Failed to change password.", "error"); }
    setPwLoading(false);
  };

  const pending  = admins.filter(a => a.status === "pending");
  const active   = admins.filter(a => a.status === "active" && a.role === "admin");
  const disabled = admins.filter(a => a.status === "disabled");

  const AdminRow = ({ a, i, showApprove }) => (
    <tr key={a.username}>
      <td style={{color:"var(--muted)",fontSize:12}}>{i+1}</td>
      <td style={{fontWeight:600}}>{a.username}</td>
      <td>
        {a.status==="pending"  && <span className="badge badge-expiring">Pending</span>}
        {a.status==="active"   && <span className="badge badge-active">Active</span>}
        {a.status==="disabled" && <span className="badge badge-expired">Disabled</span>}
      </td>
      <td>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {showApprove && <>
            <button className="btn btn-success btn-sm" onClick={() => action(`/admins/${a.username}/approve`, `${a.username} approved!`)}>Approve</button>
            <button className="btn btn-danger btn-sm"  onClick={() => action(`/admins/${a.username}/reject`,  `${a.username} rejected.`)}>Reject</button>
          </>}
          {a.status === "active" && !showApprove && <>
            <button className="btn btn-ghost btn-sm"  onClick={() => action(`/admins/${a.username}/disable`, `${a.username} disabled.`)}>Disable</button>
          </>}
          {a.status === "disabled" && <>
            <button className="btn btn-success btn-sm" onClick={() => action(`/admins/${a.username}/enable`, `${a.username} enabled!`)}>Enable</button>
          </>}
          <button className="btn btn-primary btn-sm" onClick={() => openPwModal(a.username)}>Change Password</button>
          <button className="btn btn-danger btn-sm"  onClick={() => { if(window.confirm(`Delete ${a.username}?`)) action(`/admins/${a.username}`, `${a.username} deleted.`, "delete"); }}>Delete</button>
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

      {/* Change Password Modal */}
      {pwModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div className="card" style={{ width:400, maxWidth:"90vw" }}>
            <h3 style={{ fontSize:22, marginBottom:6 }}>Change Password</h3>
            <p style={{ color:"var(--muted)", fontSize:13, marginBottom:20 }}>
              Setting new password for <strong style={{color:"var(--accent)"}}>{pwModal}</strong>
            </p>
            <div className="form-group" style={{ marginBottom:20 }}>
              <label>New Password</label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                onKeyDown={e => e.key === "Enter" && changePassword()}
                autoFocus
              />
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn btn-primary" onClick={changePassword} disabled={pwLoading} style={{ flex:1 }}>
                {pwLoading ? "Saving..." : "Update Password"}
              </button>
              <button className="btn btn-ghost" onClick={closePwModal} style={{ flex:1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div style={{
          padding:"12px 16px", borderRadius:8, marginBottom:20, fontSize:14, fontWeight:600,
          background: msg.type==="success" ? "rgba(0,230,118,0.1)" : "rgba(255,23,68,0.1)",
          border:`1px solid ${msg.type==="success" ? "rgba(0,230,118,0.3)" : "rgba(255,23,68,0.3)"}`,
          color: msg.type==="success" ? "var(--success)" : "var(--danger)"
        }}>
          {msg.type==="success" ? "OK" : "Error"}: {msg.text}
        </div>
      )}

      {/* Pending */}
      <div className="card" style={{ marginBottom:20, borderColor: pending.length > 0 ? "rgba(255,193,7,0.3)" : undefined }}>
        <div className="dash-section-header" style={{ marginBottom:16 }}>
          <h3 style={{ fontSize:20 }}>Pending Approval</h3>
          <span className="badge badge-expiring">{pending.length}</span>
        </div>
        {loading ? <div className="empty-state">Loading...</div>
          : pending.length === 0 ? <div className="empty-state">No pending requests</div>
          : <div className="table-wrap"><table>
              <thead><tr><th>#</th><th>Username</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{pending.map((a,i) => <AdminRow key={a.username} a={a} i={i} showApprove={true} />)}</tbody>
            </table></div>
        }
      </div>

      {/* Active */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="dash-section-header" style={{ marginBottom:16 }}>
          <h3 style={{ fontSize:20 }}>Active Admins</h3>
          <span className="badge badge-active">{active.length}</span>
        </div>
        {loading ? <div className="empty-state">Loading...</div>
          : active.length === 0 ? <div className="empty-state">No active admins</div>
          : <div className="table-wrap"><table>
              <thead><tr><th>#</th><th>Username</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{active.map((a,i) => <AdminRow key={a.username} a={a} i={i} showApprove={false} />)}</tbody>
            </table></div>
        }
      </div>

      {/* Disabled */}
      <div className="card">
        <div className="dash-section-header" style={{ marginBottom:16 }}>
          <h3 style={{ fontSize:20 }}>Disabled Admins</h3>
          <span className="badge badge-expired">{disabled.length}</span>
        </div>
        {loading ? <div className="empty-state">Loading...</div>
          : disabled.length === 0 ? <div className="empty-state">No disabled admins</div>
          : <div className="table-wrap"><table>
              <thead><tr><th>#</th><th>Username</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{disabled.map((a,i) => <AdminRow key={a.username} a={a} i={i} showApprove={false} />)}</tbody>
            </table></div>
        }
      </div>
    </Layout>
  );
}

export default Admins;
