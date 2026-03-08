import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api/config";
import Layout from "../components/Layout";

function Members() {
  const [members, setMembers] = useState([]);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get("/members"); if (mounted.current) setMembers(res.data); }
    catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const today = new Date().toISOString().split("T")[0];
  const inSevenDays = new Date(Date.now()+7*24*60*60*1000).toISOString().split("T")[0];

  const getStatus = (exp) => {
    if (exp < today) return "expired";
    if (exp <= inSevenDays) return "expiring";
    return "active";
  };

  const filtered = members.filter(m => {
    const s = getStatus(m.expiration_date);
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.phone?.includes(search);
    const matchFilter = filter==="all" || s===filter;
    return matchSearch && matchFilter;
  });

  const active   = members.filter(m=>getStatus(m.expiration_date)==="active").length;
  const expiring = members.filter(m=>getStatus(m.expiration_date)==="expiring").length;
  const expired  = members.filter(m=>getStatus(m.expiration_date)==="expired").length;

  return (
    <Layout>
      <div className="page-header"><h2>Members</h2><p>View-only — manage members in the admin portal</p></div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value yellow">{members.length}</div></div>
        <div className="stat-card"><div className="stat-label">Active</div><div className="stat-value green">{active}</div></div>
        <div className="stat-card"><div className="stat-label">Expiring Soon</div><div className="stat-value" style={{color:"var(--warning)"}}>{expiring}</div></div>
        <div className="stat-card"><div className="stat-label">Expired</div><div className="stat-value red">{expired}</div></div>
      </div>

      <div className="card">
        <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:200,position:"relative"}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14}}>🔍</span>
            <input placeholder="Search by name or phone..." value={search}
              onChange={e=>setSearch(e.target.value)} style={{paddingLeft:38}} />
          </div>
          <select value={filter} onChange={e=>setFilter(e.target.value)} style={{width:"auto",padding:"10px 14px"}}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {loading ? <div className="empty-state">Loading...</div>
          : filtered.length===0 ? <div className="empty-state">No members found.</div>
          : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Name</th><th>Plan</th><th>Phone</th><th>Expiry</th><th>Status</th></tr></thead>
                <tbody>
                  {filtered.map((m,i) => {
                    const s = getStatus(m.expiration_date);
                    return (
                      <tr key={m.id}>
                        <td style={{color:"var(--muted)",fontSize:12}}>{i+1}</td>
                        <td style={{fontWeight:600}}>{m.name}</td>
                        <td style={{fontSize:12}}>{m.plan}</td>
                        <td style={{fontSize:12,color:"var(--muted)"}}>{m.phone||"—"}</td>
                        <td style={{fontSize:12}}>{m.expiration_date}</td>
                        <td>
                          {s==="active"   && <span className="badge badge-active">Active</span>}
                          {s==="expiring" && <span className="badge badge-expiring">Expiring</span>}
                          {s==="expired"  && <span className="badge badge-expired">Expired</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </Layout>
  );
}

export default Members;
