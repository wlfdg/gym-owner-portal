import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api/config";
import Layout from "../components/Layout";

function Admins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const mounted = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const showMsg = (text, type="success") => { setMsg({text,type}); setTimeout(()=>setMsg(null),4000); };

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get("/admins"); if (mounted.current) setAdmins(res.data); }
    catch { showMsg("Failed to load admins.", "error"); }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const action = async (url, successMsg, method="post") => {
    try {
      if (method === "delete") await api.delete(url);
      else await api.post(url);
      showMsg(successMsg); fetch();
    } catch (e) { showMsg(e.response?.data?.message || "Action failed.", "error"); }
  };

  const pending  = admins.filter(a => a.status === "pending");
  const active   = admins.filter(a => a.status === "active" && a.role === "admin");
  const disabled = admins.filter(a => a.status === "disabled");

  const AdminTable = ({ list, showActions }) => (
    <div className="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Username</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {list.map((a, i) => (
            <tr key={a.username}>
              <td style={{color:"var(--muted)",fontSize:12}}>{i+1}</td>
              <td style={{fontWeight:600}}>{a.username}</td>
              <td>
                {a.status==="pending"  && <span className="badge badge-expiring">Pending</span>}
                {a.status==="active"   && <span className="badge badge-active">Active</span>}
                {a.status==="disabled" && <span className="badge badge-expired">Disabled</span>}
              </td>
              <td>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {a.status==="pending" && <>
                    <button className="btn btn-success btn-sm" onClick={()=>action(`/admins/${a.username}/approve`,`${a.username} approved! ✅`)}>✓ Approve</button>
                    <button className="btn btn-danger btn-sm"  onClick={()=>action(`/admins/${a.username}/reject`, `${a.username} rejected.`)}>✗ Reject</button>
                  </>}
                  {a.status==="active" && <>
                    <button className="btn btn-warning btn-sm" onClick={()=>action(`/admins/${a.username}/disable`,`${a.username} disabled.`)}>🚫 Disable</button>
                    <button className="btn btn-danger btn-sm"  onClick={()=>{if(window.confirm(`Delete ${a.username}?`)) action(`/admins/${a.username}`,`${a.username} deleted.`,"delete")}}>🗑 Delete</button>
                  </>}
                  {a.status==="disabled" && <>
                    <button className="btn btn-success btn-sm" onClick={()=>action(`/admins/${a.username}/enable`,`${a.username} re-enabled.`)}>✓ Re-enable</button>
                    <button className="btn btn-danger btn-sm"  onClick={()=>{if(window.confirm(`Delete ${a.username}?`)) action(`/admins/${a.username}`,`${a.username} deleted.`,"delete")}}>🗑 Delete</button>
                  </>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <Layout>
      <div className="page-header"><h2>Manage Admins</h2><p>Approve, disable, or remove admin accounts</p></div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">⏳ Pending</div><div className="stat-value" style={{color:pending.length>0?"var(--warning)":"var(--muted)"}}>{pending.length}</div></div>
        <div className="stat-card"><div className="stat-label">✅ Active</div><div className="stat-value green">{active.length}</div></div>
        <div className="stat-card"><div className="stat-label">🚫 Disabled</div><div className="stat-value red">{disabled.length}</div></div>
        <div className="stat-card"><div className="stat-label">📊 Total</div><div className="stat-value yellow">{admins.filter(a=>a.role==="admin").length}</div></div>
      </div>

      {msg && (
        <div style={{padding:"12px 18px",borderRadius:8,marginBottom:16,fontSize:14,fontWeight:600,
          background:msg.type==="success"?"rgba(0,230,118,0.12)":"rgba(255,23,68,0.12)",
          border:`1px solid ${msg.type==="success"?"rgba(0,230,118,0.3)":"rgba(255,23,68,0.3)"}`,
          color:msg.type==="success"?"var(--success)":"var(--danger)"}}>
          {msg.type==="success"?"✅":"❌"} {msg.text}
        </div>
      )}

      {loading ? <div className="empty-state">Loading...</div> : (<>
        {pending.length > 0 && (
          <div className="card" style={{marginBottom:20,borderColor:"rgba(255,179,0,0.3)",background:"linear-gradient(135deg,#1a1a1a,#1f1500)"}}>
            <h3 style={{fontSize:20,marginBottom:16,color:"var(--warning)"}}>⏳ Pending Approval ({pending.length})</h3>
            <AdminTable list={pending} />
          </div>
        )}
        <div className="card" style={{marginBottom:20}}>
          <h3 style={{fontSize:20,marginBottom:16}}>✅ Active Admins ({active.length})</h3>
          {active.length===0 ? <div className="empty-state">No active admins.</div> : <AdminTable list={active} />}
        </div>
        {disabled.length > 0 && (
          <div className="card">
            <h3 style={{fontSize:20,marginBottom:16}}>🚫 Disabled ({disabled.length})</h3>
            <AdminTable list={disabled} />
          </div>
        )}
      </>)}
    </Layout>
  );
}

export default Admins;
