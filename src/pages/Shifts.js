import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api/config";
import Layout from "../components/Layout";

function duration(timeIn, timeOut) {
  if (!timeIn || !timeOut) return "Active";
  try {
    const ms = new Date(timeOut) - new Date(timeIn);
    const h  = Math.floor(ms / 3600000);
    const m  = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  } catch { return "-"; }
}

function fmt(n) {
  return Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Shifts() {
  const now = new Date();
  const [month, setMonth]       = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [year,  setYear]        = useState(String(now.getFullYear()));
  const [shifts, setShifts]     = useState([]);
  const [summary, setSummary]   = useState([]);
  const [selected, setSelected] = useState(null); // selected admin for detail
  const [loading, setLoading]   = useState(true);
  const mounted = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/shifts", { params: { month, year } });
      if (!mounted.current) return;
      setShifts(res.data.shifts || []);
      setSummary(res.data.summary || []);
    } catch {}
    setLoading(false);
  }, [month, year]);

  useEffect(() => { fetchShifts(); }, [fetchShifts]);

  const months = [
    ["01","January"],["02","February"],["03","March"],["04","April"],
    ["05","May"],["06","June"],["07","July"],["08","August"],
    ["09","September"],["10","October"],["11","November"],["12","December"]
  ];
  const years = ["2024","2025","2026","2027"];

  const detailShifts = selected ? shifts.filter(s => s.admin_username === selected) : [];
  const totalRevenue = summary.reduce((a, s) => a + parseFloat(s.total_revenue || 0), 0);
  const totalShifts  = summary.reduce((a, s) => a + s.total_shifts, 0);

  return (
    <Layout>
      <div className="page-header">
        <h2>Admin Shifts</h2>
        <p>Per-shift revenue remittance and time tracking</p>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        <select value={month} onChange={e => { setMonth(e.target.value); setSelected(null); }}
          style={{ padding:"8px 14px" }}>
          {months.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={year} onChange={e => { setYear(e.target.value); setSelected(null); }}
          style={{ padding:"8px 14px" }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={fetchShifts}>Refresh</button>
      </div>

      {/* Month summary cards */}
      <div className="stats-grid" style={{ marginBottom:20 }}>
        <div className="stat-card">
          <div className="stat-label">Total Shifts</div>
          <div className="stat-value yellow">{loading ? "-" : totalShifts}</div>
          <div className="stat-sub">This month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Walk-in Revenue</div>
          <div className="stat-value green" style={{ fontSize:30 }}>P{loading ? "-" : fmt(totalRevenue)}</div>
          <div className="stat-sub">All admins combined</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Admins</div>
          <div className="stat-value" style={{ color:"#00b0ff" }}>{loading ? "-" : summary.length}</div>
          <div className="stat-sub">Who worked this month</div>
        </div>
      </div>

      {/* Per-admin summary table */}
      <div className="card" style={{ marginBottom:20 }}>
        <h3 style={{ fontSize:20, marginBottom:16 }}>Admin Summary — {months.find(m2=>m2[0]===month)?.[1]} {year}</h3>
        {loading ? <div className="empty-state">Loading...</div>
          : summary.length === 0 ? <div className="empty-state">No shift data for this period.</div>
          : <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Admin</th><th>Shifts</th><th>Total Hours</th><th>Walk-in Revenue</th><th>Detail</th></tr>
                </thead>
                <tbody>
                  {summary.map((s, i) => (
                    <tr key={s.admin} style={{ background: selected===s.admin ? "rgba(232,255,0,0.05)" : "" }}>
                      <td style={{ color:"var(--muted)", fontSize:12 }}>{i+1}</td>
                      <td style={{ fontWeight:700, color:"var(--accent)" }}>{s.admin}</td>
                      <td>{s.total_shifts}</td>
                      <td>{s.total_hours.toFixed(1)}h</td>
                      <td style={{ fontWeight:700, color:"#00e676" }}>P{fmt(s.total_revenue)}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => setSelected(selected === s.admin ? null : s.admin)}>
                          {selected === s.admin ? "Hide" : "View Shifts"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>

      {/* Per-admin shift detail */}
      {selected && (
        <div className="card" style={{ borderColor:"rgba(232,255,0,0.3)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <h3 style={{ fontSize:20 }}>
              Shifts for <span style={{ color:"var(--accent)" }}>{selected}</span>
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>
          </div>
          {detailShifts.length === 0
            ? <div className="empty-state">No shifts found.</div>
            : <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Date</th><th>Time In</th><th>Time Out</th><th>Duration</th><th>Walk-in Revenue</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {detailShifts.map((s, i) => (
                      <tr key={s.id}>
                        <td style={{ color:"var(--muted)", fontSize:12 }}>{i+1}</td>
                        <td>{s.date}</td>
                        <td>{s.time_in ? new Date(s.time_in).toLocaleTimeString("en-PH", { hour:"2-digit", minute:"2-digit" }) : "-"}</td>
                        <td>{s.time_out ? new Date(s.time_out).toLocaleTimeString("en-PH", { hour:"2-digit", minute:"2-digit" }) : <span style={{color:"#00e676"}}>Active</span>}</td>
                        <td>{duration(s.time_in, s.time_out)}</td>
                        <td style={{ fontWeight:700, color:"#00e676" }}>P{fmt(s.shift_revenue)}</td>
                        <td>
                          {s.time_out
                            ? <span className="badge badge-expired">Ended</span>
                            : <span className="badge badge-active">On Shift</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      )}
    </Layout>
  );
}

export default Shifts;
