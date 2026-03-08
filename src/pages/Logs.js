import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api/config";
import Layout from "../components/Layout";

function Logs() {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const mounted = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterUser ? `/logs?username=${filterUser}&limit=500` : "/logs?limit=500";
      const res = await api.get(url);
      if (mounted.current) setLogs(res.data);
    } catch {}
    setLoading(false);
  }, [filterUser]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const users   = [...new Set(logs.map(l => l.admin_username))];
  const actions = [...new Set(logs.map(l => l.action))];

  const filtered = filterAction ? logs.filter(l => l.action === filterAction) : logs;

  const actionColor = (action) => {
    if (action.includes("LOGIN"))   return "var(--success)";
    if (action.includes("DELETE"))  return "var(--danger)";
    if (action.includes("DISABLE")) return "var(--warning)";
    if (action.includes("ADD"))     return "var(--accent)";
    if (action.includes("APPROVE")) return "var(--success)";
    if (action.includes("REJECT"))  return "var(--danger)";
    if (action.includes("EDIT"))    return "#00b0ff";
    return "var(--muted)";
  };

  const fmt = (ts) => new Date(ts).toLocaleString("en-PH", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit", hour12:true });

  // Action summary counts
  const loginCount  = logs.filter(l=>l.action==="LOGIN").length;
  const addCount    = logs.filter(l=>l.action==="ADD_MEMBER").length;
  const deleteCount = logs.filter(l=>l.action.includes("DELETE")).length;
  const editCount   = logs.filter(l=>l.action==="EDIT_MEMBER").length;

  return (
    <Layout>
      <div className="page-header"><h2>Activity Logs</h2><p>Full audit trail of all admin actions</p></div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">🔑 Logins</div><div className="stat-value green">{loginCount}</div></div>
        <div className="stat-card"><div className="stat-label">➕ Members Added</div><div className="stat-value yellow">{addCount}</div></div>
        <div className="stat-card"><div className="stat-label">✏️ Members Edited</div><div className="stat-value" style={{color:"#00b0ff"}}>{editCount}</div></div>
        <div className="stat-card"><div className="stat-label">🗑 Deletions</div><div className="stat-value red">{deleteCount}</div></div>
      </div>

      <div className="card">
        <div className="log-header">
          <h3 style={{fontSize:22}}>All Activity ({filtered.length})</h3>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select value={filterUser} onChange={e=>setFilterUser(e.target.value)} style={{width:"auto",padding:"8px 12px"}}>
              <option value="">All Admins</option>
              {users.map(u=><option key={u}>{u}</option>)}
            </select>
            <select value={filterAction} onChange={e=>setFilterAction(e.target.value)} style={{width:"auto",padding:"8px 12px"}}>
              <option value="">All Actions</option>
              {actions.map(a=><option key={a}>{a}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={fetchLogs}>↻ Refresh</button>
          </div>
        </div>

        {loading ? <div className="empty-state">Loading...</div>
          : filtered.length===0 ? <div className="empty-state">No activity logs yet.</div>
          : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Admin</th><th>Action</th><th>Details</th><th>Time</th></tr></thead>
                <tbody>
                  {filtered.map((log,i) => (
                    <tr key={log.id}>
                      <td style={{color:"var(--muted)",fontSize:12}}>{i+1}</td>
                      <td style={{fontWeight:600,color:"var(--accent)"}}>{log.admin_username}</td>
                      <td>
                        <span style={{fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:0.5,color:actionColor(log.action)}}>
                          {log.action.replace(/_/g," ")}
                        </span>
                      </td>
                      <td style={{fontSize:12,color:"var(--muted)"}}>{log.details||"—"}</td>
                      <td style={{fontSize:11,color:"var(--muted)",whiteSpace:"nowrap"}}>{fmt(log.created_at)}</td>
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
