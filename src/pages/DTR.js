import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api/config";
import Layout from "../components/Layout";

const MONTHS = ["01","02","03","04","05","06","07","08","09","10","11","12"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function parseTime(t) {
  if (!t) return null;
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let [,h,min,p] = m; h=parseInt(h); min=parseInt(min);
  if (p.toUpperCase()==="PM"&&h!==12) h+=12;
  if (p.toUpperCase()==="AM"&&h===12) h=0;
  return h*60+min;
}
function dur(ti,to) {
  const a=parseTime(ti),b=parseTime(to);
  if(a===null||b===null||b<a) return "—";
  const m=b-a; return m<60?`${m}m`:`${Math.floor(m/60)}h ${m%60}m`;
}

function DTR() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth()+1).padStart(2,"0"));
  const [year, setYear]   = useState(String(now.getFullYear()));
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState("");
  const mounted = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const years = [];
  for (let y=now.getFullYear(); y>=2023; y--) years.push(String(y));

  const fetchDTR = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/dtr/all?month=${month}&year=${year}`);
      if (mounted.current) setRecords(res.data);
    } catch {}
    setLoading(false);
  }, [month, year]);

  useEffect(() => { fetchDTR(); }, [fetchDTR]);

  const users = [...new Set(records.map(r => r.admin_username))];
  const filtered = filterUser ? records.filter(r => r.admin_username === filterUser) : records;

  // Summary per admin
  const summary = users.map(u => {
    const recs = records.filter(r => r.admin_username === u);
    const totalMins = recs.reduce((s,r) => {
      const a=parseTime(r.time_in),b=parseTime(r.time_out);
      return (a!==null&&b!==null&&b>a) ? s+(b-a) : s;
    }, 0);
    return { username:u, days:recs.filter(r=>r.time_in).length, hours:Math.floor(totalMins/60), mins:totalMins%60 };
  });

  return (
    <Layout>
      <div className="page-header"><h2>Admin DTR</h2><p>Daily Time Records of all admin staff</p></div>

      {/* Summary cards */}
      {summary.length > 0 && (
        <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(summary.length,4)},1fr)`,gap:16,marginBottom:20}}>
          {summary.map(s => (
            <div key={s.username} className="stat-card">
              <div className="stat-label">👤 {s.username}</div>
              <div className="stat-value yellow" style={{fontSize:32}}>{s.hours}h {s.mins}m</div>
              <div className="stat-sub">{s.days} day{s.days!==1?"s":""} — {MONTH_NAMES[parseInt(month)-1]} {year}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="log-header">
          <h3 style={{fontSize:22}}>DTR Records</h3>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select value={month} onChange={e=>setMonth(e.target.value)} style={{width:"auto",padding:"8px 12px"}}>
              {MONTHS.map((m,i) => <option key={m} value={m}>{MONTH_NAMES[i]}</option>)}
            </select>
            <select value={year} onChange={e=>setYear(e.target.value)} style={{width:"auto",padding:"8px 12px"}}>
              {years.map(y => <option key={y}>{y}</option>)}
            </select>
            <select value={filterUser} onChange={e=>setFilterUser(e.target.value)} style={{width:"auto",padding:"8px 12px"}}>
              <option value="">All Admins</option>
              {users.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {loading ? <div className="empty-state">Loading...</div>
          : filtered.length===0 ? <div className="empty-state">No DTR records for {MONTH_NAMES[parseInt(month)-1]} {year}.</div>
          : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Admin</th><th>Date</th><th>Time In</th><th>Time Out</th><th>Duration</th><th>Status</th></tr></thead>
                <tbody>
                  {filtered.map((r,i) => (
                    <tr key={r.id}>
                      <td style={{color:"var(--muted)",fontSize:12}}>{i+1}</td>
                      <td style={{fontWeight:600,color:"var(--accent)"}}>{r.admin_username}</td>
                      <td style={{fontSize:12}}>{r.date}</td>
                      <td style={{color:"var(--success)",fontWeight:600}}>{r.time_in||"—"}</td>
                      <td style={{color:r.time_out?"var(--danger)":"var(--muted)",fontWeight:r.time_out?600:400}}>{r.time_out||"—"}</td>
                      <td style={{fontSize:12,color:"var(--muted)"}}>{dur(r.time_in,r.time_out)}</td>
                      <td>{r.time_out?<span className="badge badge-active">Complete</span>:<span className="badge badge-expiring">On Duty</span>}</td>
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

export default DTR;
