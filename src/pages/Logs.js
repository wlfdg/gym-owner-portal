import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api/config";
import Layout from "../components/Layout";

const ACTION_COLORS = {
  LOGIN:                 "#00b0ff",
  LOGOUT:               "#888",
  ADD_MEMBER:           "#00e676",
  EDIT_MEMBER:          "#ffb300",
  DELETE_MEMBER:        "#ff1744",
  DELETE_WALKIN:        "#ff5722",
  EMPLOYEE_TIMEIN:      "#00e676",
  EMPLOYEE_TIMEOUT:     "#ff9100",
  CHANGE_ADMIN_PASSWORD:"#e040fb",
  CHANGE_PASSWORD:      "#e040fb",
  APPROVE_ADMIN:        "#00e676",
  REJECT_ADMIN:         "#ff1744",
  DISABLE_ADMIN:        "#ff9100",
  ENABLE_ADMIN:         "#00e676",
  DELETE_ADMIN:         "#ff1744",
};

const ACTION_LABELS = {
  LOGIN:                 "Login",
  LOGOUT:               "Logout",
  ADD_MEMBER:           "Added Member",
  EDIT_MEMBER:          "Edited Member",
  DELETE_MEMBER:        "Deleted Member",
  DELETE_WALKIN:        "Deleted Walk-in",
  EMPLOYEE_TIMEIN:      "Employee Time In",
  EMPLOYEE_TIMEOUT:     "Employee Time Out",
  CHANGE_ADMIN_PASSWORD:"Changed Admin Password",
  CHANGE_PASSWORD:      "Changed Password",
  APPROVE_ADMIN:        "Approved Admin",
  REJECT_ADMIN:         "Rejected Admin",
  DISABLE_ADMIN:        "Disabled Admin",
  ENABLE_ADMIN:         "Enabled Admin",
  DELETE_ADMIN:         "Deleted Admin",
};

function Logs() {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const mounted = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/logs");
      if (mounted.current) setLogs(res.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter(l => {
    const matchUser   = !filter       || l.admin_username?.toLowerCase().includes(filter.toLowerCase());
    const matchAction = !actionFilter || l.action === actionFilter;
    return matchUser && matchAction;
  });

  const uniqueActions = [...new Set(logs.map(l => l.action))].sort();

  const deleteLogs = filtered.filter(l => l.action.startsWith("DELETE"));
  const otherLogs  = filtered.filter(l => !l.action.startsWith("DELETE"));

  return (
    <Layout>
      <div className="page-header">
        <h2>Activity Logs</h2>
        <p>Read-only audit trail of all admin actions</p>
      </div>

      {/* Delete actions summary */}
      {deleteLogs.length > 0 && (
        <div className="card" style={{ marginBottom:20, borderColor:"rgba(255,23,68,0.3)" }}>
          <h3 style={{ fontSize:18, marginBottom:14, color:"#ff1744" }}>Deletion History ({deleteLogs.length})</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Admin</th><th>Action</th><th>Details</th><th>Time</th></tr></thead>
              <tbody>
                {deleteLogs.map((l,i) => (
                  <tr key={l.id}>
                    <td style={{color:"var(--muted)",fontSize:12}}>{i+1}</td>
                    <td style={{fontWeight:600,color:"var(--accent)"}}>{l.admin_username}</td>
                    <td><span style={{ padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:700, background:"rgba(255,23,68,0.15)", color:"#ff1744" }}>{ACTION_LABELS[l.action] || l.action}</span></td>
                    <td style={{fontSize:12,color:"var(--muted)"}}>{l.details}</td>
                    <td style={{fontSize:11,color:"var(--muted)"}}>{new Date(l.created_at).toLocaleString("en-PH")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All logs */}
      <div className="card">
        <div className="log-header" style={{ flexWrap:"wrap", gap:10, marginBottom:16 }}>
          <h3 style={{ fontSize:22 }}>All Activity</h3>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <input placeholder="Filter by admin..." value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ width:160, padding:"8px 12px" }} />
            <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
              style={{ width:"auto", padding:"8px 12px" }}>
              <option value="">All Actions</option>
              {uniqueActions.map(a => <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={fetchLogs}>Refresh</button>
          </div>
        </div>

        {loading ? <div className="empty-state">Loading...</div>
          : filtered.length === 0 ? <div className="empty-state">No activity logs found.</div>
          : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Admin</th><th>Action</th><th>Details</th><th>Time</th></tr></thead>
                <tbody>
                  {filtered.map((l,i) => (
                    <tr key={l.id}>
                      <td style={{color:"var(--muted)",fontSize:12}}>{i+1}</td>
                      <td style={{fontWeight:600,color:"var(--accent)"}}>{l.admin_username}</td>
                      <td>
                        <span style={{
                          padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:700,
                          background:`${ACTION_COLORS[l.action] || "#888"}22`,
                          color: ACTION_COLORS[l.action] || "#888"
                        }}>
                          {ACTION_LABELS[l.action] || l.action}
                        </span>
                      </td>
                      <td style={{fontSize:12,color:"var(--muted)"}}>{l.details || "-"}</td>
                      <td style={{fontSize:11,color:"var(--muted)"}}>{new Date(l.created_at).toLocaleString("en-PH")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </Layout>
  );
}

export default Logs;
