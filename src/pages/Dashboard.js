import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/config";
import Layout from "../components/Layout";

// ── Local date helper — avoids UTC offset giving wrong date in PHT (+8) ──────
function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}


function Dashboard() {
  const [stats, setStats]     = useState({});
  const [admins, setAdmins]   = useState([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([api.get("/stats"), api.get("/admins")]);
      if (!mounted.current) return;
      setStats(s.data); setAdmins(a.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fmt = n => Number(n||0).toLocaleString();
  const pending  = admins.filter(a => a.status === "pending").length;
  const active   = admins.filter(a => a.status === "active" && a.role === "admin").length;

  return (
    <Layout>
      <div className="page-header">
        <h2>Overview</h2>
        <p>Loyd's Fitness Gym — Owner Dashboard</p>
      </div>

      {pending > 0 && (
        <div style={{ background:"rgba(255,179,0,0.08)", border:"1px solid rgba(255,179,0,0.3)", borderRadius:10, padding:"14px 18px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontWeight:700, color:"var(--warning)", fontSize:14 }}>⏳ {pending} Admin Request{pending!==1?"s":""} Pending</div>
            <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>New admins are waiting for your approval.</div>
          </div>
          <Link to="/admins" className="btn btn-warning btn-sm">Review Now →</Link>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Members</div>
          <div className="stat-value yellow">{loading?"—":fmt(stats.total_members)}</div>
          <div className="stat-sub">All registered</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Members</div>
          <div className="stat-value green">{loading?"—":fmt(stats.active_members)}</div>
          <div className="stat-sub">Valid subscriptions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value" style={{fontSize:32}}>{loading?"—":`₱${fmt(stats.revenue)}`}</div>
          <div className="stat-sub">All time</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Walk-in Today</div>
          <div className="stat-value" style={{color:"#00b0ff"}}>{loading?"—":`₱${fmt(stats.walkin_revenue_today)}`}</div>
          <div className="stat-sub">{stats.walkin_count_today||0} walk-ins</div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
        <div className="card">
          <div className="stat-label" style={{ marginBottom:12 }}>👥 Admin Accounts</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:13 }}>Active Admins</span>
              <span className="badge badge-active">{active}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:13 }}>Pending Approval</span>
              <span className="badge badge-expiring">{pending}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:13 }}>Disabled</span>
              <span className="badge badge-expired">{admins.filter(a=>a.status==="disabled").length}</span>
            </div>
          </div>
          <Link to="/admins" className="btn btn-ghost btn-sm" style={{ marginTop:14, width:"100%", justifyContent:"center" }}>Manage Admins →</Link>
        </div>
        <div className="card">
          <div className="stat-label" style={{ marginBottom:12 }}>⏱ Gym Activity Today</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:13 }}>Members Inside Now</span>
              <span style={{ fontWeight:700, color:"var(--success)" }}>{stats.members_in_gym||0}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:13 }}>Total Visits Today</span>
              <span style={{ fontWeight:700, color:"var(--accent)" }}>{stats.visits_today||0}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:13 }}>New This Month</span>
              <span style={{ fontWeight:700, color:"#00b0ff" }}>{stats.new_this_month||0}</span>
            </div>
          </div>
          <Link to="/logs" className="btn btn-ghost btn-sm" style={{ marginTop:14, width:"100%", justifyContent:"center" }}>View Activity Logs →</Link>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
