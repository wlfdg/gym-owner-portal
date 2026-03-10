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
  // Handle ISO timestamps like "2026-03-10T10:20:00" or "2026-03-10 10:20:00"
  if (t.includes("T") || t.match(/^\d{4}-\d{2}-\d{2} /)) {
    const d = new Date(t.replace(" ", "T"));
    return isNaN(d) ? null : d.getHours() * 60 + d.getMinutes();
  }
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let [,h,min,p] = m; h=parseInt(h); min=parseInt(min);
  if (p.toUpperCase()==="PM"&&h!==12) h+=12;
  if (p.toUpperCase()==="AM"&&h===12) h=0;
  return h*60+min;
}

function fmtTime(val) {
  if (!val) return "—";
  try {
    if (val.includes("T") || val.match(/^\d{4}-\d{2}-\d{2} /)) {
      return new Date(val.replace(" ", "T")).toLocaleTimeString("en-PH", {
        hour: "2-digit", minute: "2-digit", hour12: true
      });
    }
    return val;
  } catch { return val; }
}

function dur(ti, to) {
  if (!ti) return "—";
  if (!to) return <span style={{color:"var(--success)",fontWeight:600}}>Active</span>;
  // ISO timestamps — more accurate
  if ((ti.includes("T") || ti.match(/^\d{4}-\d{2}-\d{2} /)) &&
      (to.includes("T") || to.match(/^\d{4}-\d{2}-\d{2} /))) {
    try {
      const ms = new Date(to.replace(" ","T")) - new Date(ti.replace(" ","T"));
      if (isNaN(ms) || ms < 0) return "—";
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      return `${h}h ${m}m`;
    } catch { return "—"; }
  }
  const a=parseTime(ti), b=parseTime(to);
  if(a===null||b===null||b<a) return "—";
  const mins=b-a;
  return mins<60?`${mins}m`:`${Math.floor(mins/60)}h ${mins%60}m`;
}

// ── Local date helper (avoids UTC offset giving wrong date in PHT) ────────────
function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function DTR() {
  const now = new Date();
  const todayStr = localDateStr(now);

  // ── Shared state
  const [tab, setTab]               = useState("monthly"); // "monthly" | "daily"
  const mounted                     = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);

  // ── Monthly state
  const [month, setMonth]           = useState(String(now.getMonth()+1).padStart(2,"0"));
  const [year, setYear]             = useState(String(now.getFullYear()));
  const [records, setRecords]       = useState([]);
  const [loadingMonthly, setLoadingMonthly] = useState(true);
  const [filterName, setFilterName] = useState("");

  // ── Daily state
  const [date, setDate]             = useState(todayStr);
  const [dailyRecords, setDailyRecords] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [filterDailyName, setFilterDailyName] = useState("");

  const years = [];
  for (let y=now.getFullYear(); y>=2023; y--) years.push(String(y));

  // ── Fetch monthly ──────────────────────────────────────────────────────────
  const fetchMonthly = useCallback(async () => {
    setLoadingMonthly(true);
    try {
      const res = await api.get(`/employee/dtr/all?month=${month}&year=${year}`);
      if (mounted.current) setRecords(res.data);
    } catch {}
    if (mounted.current) setLoadingMonthly(false);
  }, [month, year]);

  // ── Fetch daily ────────────────────────────────────────────────────────────
  const fetchDaily = useCallback(async () => {
    setLoadingDaily(true);
    try {
      const res = await api.get(`/employee/dtr?date=${date}`);
      if (mounted.current) setDailyRecords(res.data);
    } catch {}
    if (mounted.current) setLoadingDaily(false);
  }, [date]);

  useEffect(() => { if (tab === "monthly") fetchMonthly(); }, [tab, fetchMonthly]);
  useEffect(() => { if (tab === "daily")   fetchDaily();   }, [tab, fetchDaily]);

  // ── Monthly derived data ───────────────────────────────────────────────────
  const employees      = [...new Set(records.map(r => r.employee_name))];
  const filteredMonthly = filterName
    ? records.filter(r => r.employee_name === filterName)
    : records;

  const summary = employees.map(emp => {
    const recs = records.filter(r => r.employee_name === emp);
    const totalMins = recs.reduce((s,r) => {
      const a=parseTime(r.time_in), b=parseTime(r.time_out);
      return (a!==null&&b!==null&&b>a) ? s+(b-a) : s;
    }, 0);
    return { name:emp, days:recs.length, hours:Math.floor(totalMins/60), mins:totalMins%60 };
  });

  // ── Daily derived data ─────────────────────────────────────────────────────
  const dailyEmployees = [...new Set(dailyRecords.map(r => r.employee_name))];
  const filteredDaily  = filterDailyName
    ? dailyRecords.filter(r => r.employee_name === filterDailyName)
    : dailyRecords;

  const dailySummary = dailyEmployees.map(emp => {
    const recs = dailyRecords.filter(r => r.employee_name === emp);
    const totalMins = recs.reduce((s,r) => {
      const a=parseTime(r.time_in), b=parseTime(r.time_out);
      return (a!==null&&b!==null&&b>a) ? s+(b-a) : s;
    }, 0);
    const active = recs.some(r => !r.time_out);
    return { name:emp, sessions:recs.length, hours:Math.floor(totalMins/60), mins:totalMins%60, active };
  });

  return (
    <Layout>
      <div className="page-header">
        <h2>Employee DTR</h2>
        <p>Daily Time Records of all employees</p>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        <button
          className={`btn ${tab === "monthly" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("monthly")}>
          📅 Monthly View
        </button>
        <button
          className={`btn ${tab === "daily" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("daily")}>
          🗓 Daily View
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MONTHLY VIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "monthly" && (<>

        {/* Month/year selectors */}
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
          <select value={month} onChange={e=>setMonth(e.target.value)} style={{width:"auto",padding:"8px 12px"}}>
            {MONTHS.map(m=><option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
          <select value={year} onChange={e=>setYear(e.target.value)} style={{width:"auto",padding:"8px 12px"}}>
            {years.map(y=><option key={y}>{y}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={fetchMonthly}>↺ Refresh</button>
        </div>

        {/* Summary cards */}
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
            <h3 style={{fontSize:22}}>DTR Records — {MONTHS.find(m=>m.v===month)?.l} {year}</h3>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <select value={filterName} onChange={e=>setFilterName(e.target.value)} style={{width:"auto",padding:"8px 12px"}}>
                <option value="">All Employees</option>
                {employees.map(n=><option key={n}>{n}</option>)}
              </select>
              <button className="btn btn-ghost btn-sm" onClick={fetchMonthly}>↺ Refresh</button>
            </div>
          </div>

          {loadingMonthly
            ? <div className="empty-state">Loading...</div>
            : filteredMonthly.length===0
              ? <div className="empty-state">No DTR records for {MONTHS.find(m=>m.v===month)?.l} {year}.</div>
              : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th><th>Employee</th><th>Date</th>
                        <th>Time In</th><th>Time Out</th><th>Duration</th>
                        <th>Note</th><th>Recorded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMonthly.map((r,i)=>(
                        <tr key={r.id}>
                          <td style={{color:"var(--muted)",fontSize:12}}>{i+1}</td>
                          <td style={{fontWeight:600,color:"var(--accent)"}}>{r.employee_name}</td>
                          <td style={{fontSize:12}}>{r.date}</td>
                          <td style={{color:"var(--success)",fontWeight:600}}>{fmtTime(r.time_in)||"—"}</td>
                          <td style={{color:r.time_out?"var(--danger)":"var(--muted)",fontWeight:r.time_out?600:400}}>
                            {r.time_out ? fmtTime(r.time_out) : "—"}
                          </td>
                          <td style={{fontSize:12,color:"var(--muted)"}}>{dur(r.time_in,r.time_out)}</td>
                          <td style={{fontSize:12,color:"var(--muted)"}}>{r.note||"—"}</td>
                          <td style={{fontSize:11,color:"var(--muted)"}}>{r.recorded_by||"—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
          }
        </div>
      </>)}

      {/* ══════════════════════════════════════════════════════════════════════
          DAILY VIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === "daily" && (<>

        {/* Date selector + quick buttons */}
        <div style={{ display:"flex", gap:8, marginBottom:20, alignItems:"center", flexWrap:"wrap" }}>
          <input
            type="date"
            value={date}
            max={todayStr}
            onChange={e => setDate(e.target.value)}
            style={{ width:"auto", padding:"8px 14px" }}
          />
          {[0,1,2].map(offset => {
            const d = new Date(now); d.setDate(d.getDate() - offset);
            const ds = localDateStr(d);
            const label = offset===0 ? "Today" : offset===1 ? "Yesterday" : ds;
            return (
              <button key={offset}
                className={`btn btn-sm ${date===ds ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setDate(ds)}>
                {label}
              </button>
            );
          })}
          <button className="btn btn-ghost btn-sm" onClick={fetchDaily}>↺ Refresh</button>
        </div>

        {/* Daily summary cards */}
        {dailySummary.length > 0 && (
          <div style={{
            display:"grid",
            gridTemplateColumns:`repeat(${Math.min(dailySummary.length,4)},1fr)`,
            gap:16, marginBottom:20
          }}>
            {dailySummary.map(s=>(
              <div key={s.name} className="stat-card">
                <div className="stat-label">👤 {s.name}</div>
                <div className="stat-value yellow" style={{fontSize:30}}>
                  {s.active
                    ? <span style={{color:"var(--success)"}}>Active</span>
                    : `${s.hours}h ${s.mins}m`}
                </div>
                <div className="stat-sub">
                  {s.sessions} session{s.sessions!==1?"s":""} — {date}
                  {s.active && <span style={{marginLeft:6,color:"var(--success)",fontSize:10,fontWeight:700}}>● ON DUTY</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats row */}
        {!loadingDaily && dailyRecords.length > 0 && (
          <div className="stats-grid" style={{ marginBottom:20 }}>
            <div className="stat-card">
              <div className="stat-label">Total Records</div>
              <div className="stat-value yellow">{dailyRecords.length}</div>
              <div className="stat-sub">For {date}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Currently Active</div>
              <div className="stat-value green">{dailyRecords.filter(r=>!r.time_out).length}</div>
              <div className="stat-sub">Still on duty</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Employees</div>
              <div className="stat-value" style={{color:"#00b0ff"}}>{dailyEmployees.length}</div>
              <div className="stat-sub">Unique staff</div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="log-header">
            <h3 style={{fontSize:22}}>
              DTR Records — <span style={{color:"var(--accent)"}}>{date}</span>
              {date === todayStr && (
                <span style={{
                  marginLeft:10, fontSize:11, fontWeight:700,
                  background:"rgba(0,230,118,0.15)", color:"var(--success)",
                  padding:"3px 8px", borderRadius:4
                }}>TODAY</span>
              )}
            </h3>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {dailyEmployees.length > 0 && (
                <select
                  value={filterDailyName}
                  onChange={e=>setFilterDailyName(e.target.value)}
                  style={{width:"auto",padding:"8px 12px"}}>
                  <option value="">All Employees</option>
                  {dailyEmployees.map(n=><option key={n}>{n}</option>)}
                </select>
              )}
              <button className="btn btn-ghost btn-sm" onClick={fetchDaily}>↺ Refresh</button>
            </div>
          </div>

          {loadingDaily
            ? <div className="empty-state">Loading...</div>
            : filteredDaily.length === 0
              ? <div className="empty-state">No DTR records for {date}.</div>
              : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th><th>Employee</th><th>Status</th>
                        <th>Time In</th><th>Time Out</th><th>Duration</th>
                        <th>Note</th><th>Recorded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDaily.map((r,i)=>(
                        <tr key={r.id}>
                          <td style={{color:"var(--muted)",fontSize:12}}>{i+1}</td>
                          <td style={{fontWeight:600,color:"var(--accent)"}}>{r.employee_name}</td>
                          <td>
                            {r.time_out
                              ? <span className="badge badge-expired">Done</span>
                              : <span className="badge badge-active">On Duty</span>}
                          </td>
                          <td style={{color:"var(--success)",fontWeight:600}}>{fmtTime(r.time_in)||"—"}</td>
                          <td style={{color:r.time_out?"var(--danger)":"var(--muted)",fontWeight:r.time_out?600:400}}>
                            {r.time_out ? fmtTime(r.time_out) : "—"}
                          </td>
                          <td style={{fontSize:12,color:"var(--muted)"}}>{dur(r.time_in,r.time_out)}</td>
                          <td style={{fontSize:12,color:"var(--muted)"}}>{r.note||"—"}</td>
                          <td style={{fontSize:11,color:"var(--muted)"}}>{r.recorded_by||"—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
          }
        </div>
      </>)}
    </Layout>
  );
}

export default DTR;
