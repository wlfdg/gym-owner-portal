import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api/config";
import Layout from "../components/Layout";

const MONTHS = [
  {v:"01",l:"January"},{v:"02",l:"February"},{v:"03",l:"March"},
  {v:"04",l:"April"},{v:"05",l:"May"},{v:"06",l:"June"},
  {v:"07",l:"July"},{v:"08",l:"August"},{v:"09",l:"September"},
  {v:"10",l:"October"},{v:"11",l:"November"},{v:"12",l:"December"}
];

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
  const [month, setMonth]       = useState(String(now.getMonth()+1).padStart(2,"0"));
  const [year, setYear]         = useState(String(now.getFullYear()));
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filterName, setFilterName] = useState("");
  const mounted = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const years = [];
  for (let y=now.getFullYear(); y>=2023; y--) years.push(String(y));

  const fetchDTR = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/employee/dtr/all?month=${month}&year=${year}`);
      if (mounted.current) setRecords(res.data);
    } catch {}
    setLoading(false);
  }, [month, year]);

  useEffect(() => { fetchDTR(); }, [fetchDTR]);

  const employees = [...new Set(records.map(r => r.employee_name))];
  const filtered  = filterName ? records.filter(r => r.employee_name === filterName) : records;

  const summary = employees.map(emp => {
    const recs = records.filter(r => r.employee_name === emp);
    const totalMins = recs.reduce((s,r) => {
      const a=parseTime(r.time_in),b=parseTime(r.time_out);
      return (a!==null&&b!==null&&b>a)?s+(b-a):s;
    }, 0);
    return { name:emp, days:recs.length, hours:Math.floor(totalMins/60), mins:totalMins%60 };
  });

  return (
    <Layout>
      <div className="page-header"><h2>Employee DTR</h2><p>Daily Time Records of all employees</p></div>

      {summary.length > 0 && (
        <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(summary.length,4)},1fr)`,gap:16,marginBottom:20}}>
          {summary.map(s=>(
            <div key={s.name} className="stat-card">
              <div className="stat-label">👤 {s.name}</div>
              <div className="stat-value yellow" style={{fontSize:30}}>{s.hours}h {s.mins}m</div>
              <div className="stat-sub">{s.days} day{s.days!==1?"s":""} — {MONTHS.find(m=>m.v===month)?.l} {year}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="log-header">
          <h3 style={{fontSize:22}}>DTR Records</h3>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <select value={month} onChange={e=>setMonth(e.target.value)} style={{width:"auto",padding:"8px 12px"}}>
              {MONTHS.map(m=><option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
            <select value={year} onChange={e=>setYear(e.target.value)} style={{width:"auto",padding:"8px 12px"}}>
              {years.map(y=><option key={y}>{y}</option>)}
            </select>
            <select value={filterName} onChange={e=>setFilterName(e.target.value)} style={{width:"auto",padding:"8px 12px"}}>
              <option value="">All Employees</option>
              {employees.map(n=><option key={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {loading ? <div className="empty-state">Loading...</div>
          : filtered.length===0 ? <div className="empty-state">No DTR records for {MONTHS.find(m=>m.v===month)?.l} {year}.</div>
          : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Employee</th><th>Date</th><th>Time In</th><th>Time Out</th><th>Duration</th><th>Note</th><th>Recorded By</th></tr></thead>
                <tbody>
                  {filtered.map((r,i)=>(
                    <tr key={r.id}>
                      <td style={{color:"var(--muted)",fontSize:12}}>{i+1}</td>
                      <td style={{fontWeight:600,color:"var(--accent)"}}>{r.employee_name}</td>
                      <td style={{fontSize:12}}>{r.date}</td>
                      <td style={{color:"var(--success)",fontWeight:600}}>{r.time_in||"—"}</td>
                      <td style={{color:r.time_out?"var(--danger)":"var(--muted)",fontWeight:r.time_out?600:400}}>{r.time_out||"—"}</td>
                      <td style={{fontSize:12,color:"var(--muted)"}}>{dur(r.time_in,r.time_out)}</td>
                      <td style={{fontSize:12,color:"var(--muted)"}}>{r.note||"—"}</td>
                      <td style={{fontSize:11,color:"var(--muted)"}}>{r.recorded_by||"—"}</td>
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
