import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api/config";
import Layout from "../components/Layout";

const MONTHS = [
  ["01","January"],["02","February"],["03","March"],["04","April"],
  ["05","May"],["06","June"],["07","July"],["08","August"],
  ["09","September"],["10","October"],["11","November"],["12","December"]
];

function fmtMoney(n) {
  return Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Parse "08:30 AM" or ISO timestamp → minutes since midnight ────────────────
function parseToMinutes(val) {
  if (!val) return null;
  try {
    // ISO timestamp: "2026-03-10T10:20:00" or "2026-03-10 10:20:00"
    if (val.includes("T") || val.match(/^\d{4}-\d{2}-\d{2} /)) {
      const d = new Date(val.replace(" ", "T"));
      return isNaN(d) ? null : d.getHours() * 60 + d.getMinutes();
    }
    // "10:20 PM" format
    const m = val.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (m) {
      let h = parseInt(m[1]), min = parseInt(m[2]), p = m[3].toUpperCase();
      if (p === "PM" && h !== 12) h += 12;
      if (p === "AM" && h === 12) h = 0;
      return h * 60 + min;
    }
  } catch {}
  return null;
}

// ── Duration between two time values ─────────────────────────────────────────
function duration(tsIn, tsOut) {
  if (!tsIn || !tsOut) return tsIn ? "Active" : "—";
  // Prefer ISO timestamps for accurate cross-midnight calc
  if ((tsIn.includes("T") || tsIn.match(/^\d{4}-\d{2}-\d{2} /)) &&
      (tsOut.includes("T") || tsOut.match(/^\d{4}-\d{2}-\d{2} /))) {
    try {
      const ms = new Date(tsOut.replace(" ","T")) - new Date(tsIn.replace(" ","T"));
      if (isNaN(ms) || ms < 0) return "—";
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      return `${h}h ${m}m`;
    } catch { return "—"; }
  }
  // Fallback: parse AM/PM strings
  const a = parseToMinutes(tsIn), b = parseToMinutes(tsOut);
  if (a === null || b === null) return "—";
  const diff = b >= a ? b - a : (b + 1440) - a; // handle midnight wrap
  if (diff <= 0) return "—";
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
}

// ── Format time value for display ─────────────────────────────────────────────
function fmtTime(val) {
  if (!val) return "—";
  try {
    if (val.includes("T") || val.match(/^\d{4}-\d{2}-\d{2} /)) {
      return new Date(val.replace(" ", "T")).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    return val; // already "08:30 AM"
  } catch { return val; }
}

// ── Shift row component ───────────────────────────────────────────────────────
function ShiftRow({ s, i }) {
  const timeIn  = s.shift_ts_in  || s.time_in;
  const timeOut = s.shift_ts_out || s.time_out;
  return (
    <tr key={s.id}>
      <td style={{ color:"var(--muted)", fontSize:12 }}>{i+1}</td>
      <td>{s.date}</td>
      <td style={{ color:"var(--success)", fontWeight:600 }}>{fmtTime(timeIn)}</td>
      <td style={{ color: timeOut ? "var(--text)" : "var(--success)", fontWeight: timeOut ? 400 : 600 }}>
        {timeOut ? fmtTime(timeOut) : <span style={{ color:"var(--success)" }}>Active</span>}
      </td>
      <td style={{ color:"var(--muted)", fontSize:12 }}>{duration(timeIn, timeOut)}</td>
      <td style={{ fontWeight:700, color:"var(--success)" }}>₱{fmtMoney(s.shift_revenue)}</td>
      <td>
        {timeOut
          ? <span className="badge badge-expired">Ended</span>
          : <span className="badge badge-active">On Shift</span>}
      </td>
    </tr>
  );
}

// ── Local date helper (avoids UTC offset giving wrong date in PHT) ───────────
function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// ── Main Component ────────────────────────────────────────────────────────────
function Shifts() {
  const now = new Date();
  const todayStr = localDateStr(now);

  const [tab, setTab]           = useState("monthly"); // "monthly" | "daily"
  const [month, setMonth]       = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [year, setYear]         = useState(String(now.getFullYear()));
  const [date, setDate]         = useState(todayStr);
  const [shifts, setShifts]     = useState([]);
  const [summary, setSummary]   = useState([]);
  const [dailyShifts, setDailyShifts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const mounted = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);

  // ── Fetch monthly ──
  const fetchMonthly = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/shifts", { params: { month, year } });
      if (!mounted.current) return;
      setShifts(res.data.shifts || []);
      setSummary(res.data.summary || []);
    } catch (e) {
      if (mounted.current) setError("Could not load shift data. The server may be starting up.");
    }
    if (mounted.current) setLoading(false);
  }, [month, year]);

  // ── Fetch daily ──
  const fetchDaily = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/shifts/daily", { params: { date } });
      if (!mounted.current) return;
      setDailyShifts(res.data.shifts || []);
    } catch (e) {
      if (mounted.current) setError("Could not load shift data. The server may be starting up.");
    }
    if (mounted.current) setLoading(false);
  }, [date]);

  useEffect(() => {
    if (tab === "monthly") fetchMonthly();
    else fetchDaily();
  }, [tab, fetchMonthly, fetchDaily]);

  // Sort helper — latest time_in first
  const sortByLatest = (arr) => [...arr].sort((a, b) => {
    const ta = new Date((a.shift_ts_in || a.time_in || "").replace(" ", "T"));
    const tb = new Date((b.shift_ts_in || b.time_in || "").replace(" ", "T"));
    return tb - ta;
  });

  const detailShifts = selected ? sortByLatest(shifts.filter(s => s.admin_username === selected)) : [];
  const totalRevenue = summary.reduce((a, s) => a + parseFloat(s.total_revenue || 0), 0);
  const totalShiftsAll = summary.reduce((a, s) => a + s.total_shifts, 0);
  const sortedDailyShifts = [...dailyShifts].sort((a, b) => new Date((b.shift_ts_in || b.time_in || "").replace(" ","T")) - new Date((a.shift_ts_in || a.time_in || "").replace(" ","T")));
  const dailyRevenue = dailyShifts.reduce((a, s) => a + parseFloat(s.shift_revenue || 0), 0);

  return (
    <Layout>
      <div className="page-header">
        <h2>Shifts & Revenue</h2>
        <p>Per-shift revenue remittance and time tracking for each admin</p>
      </div>

      {/* Revenue reset info */}
      <div style={{
        background: "rgba(232,255,0,0.05)", border: "1px solid rgba(232,255,0,0.15)",
        borderRadius: 10, padding: "12px 16px", marginBottom: 20,
        fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 8
      }}>
        <span style={{ fontSize: 16 }}>💡</span>
        <span>Walk-in revenue is tracked <strong style={{ color: "var(--accent)" }}>per shift</strong>. Each admin's revenue resets to ₱0 when they log in and starts fresh for their new shift.</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button className={`btn ${tab === "monthly" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => { setTab("monthly"); setSelected(null); }}>
          📅 Monthly View
        </button>
        <button className={`btn ${tab === "daily" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => { setTab("daily"); setSelected(null); }}>
          🗓 Daily View
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          padding:"12px 16px", borderRadius:8, marginBottom:20,
          fontSize:14, fontWeight:600,
          background:"rgba(255,23,68,0.1)", border:"1px solid rgba(255,23,68,0.3)",
          color:"var(--danger)", display:"flex", alignItems:"center", justifyContent:"space-between"
        }}>
          <span>⚠ {error}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => tab === "daily" ? fetchDaily() : fetchMonthly()}>
            ↺ Retry
          </button>
        </div>
      )}

      {/* ══ MONTHLY VIEW ══════════════════════════════════════════════════════ */}
      {tab === "monthly" && (<>
        <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
          <select value={month} onChange={e => { setMonth(e.target.value); setSelected(null); }} style={{ padding:"8px 14px" }}>
            {MONTHS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={year} onChange={e => { setYear(e.target.value); setSelected(null); }} style={{ padding:"8px 14px" }}>
            {["2024","2025","2026","2027"].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={fetchMonthly}>↺ Refresh</button>
        </div>

        {/* Summary cards */}
        <div className="stats-grid" style={{ marginBottom:20 }}>
          <div className="stat-card">
            <div className="stat-label">Total Shifts</div>
            <div className="stat-value yellow">{loading ? "—" : totalShiftsAll}</div>
            <div className="stat-sub">This month</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Walk-in Revenue</div>
            <div className="stat-value green" style={{ fontSize:28 }}>₱{loading ? "—" : fmtMoney(totalRevenue)}</div>
            <div className="stat-sub">All admins combined</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Admins</div>
            <div className="stat-value" style={{ color:"#00b0ff" }}>{loading ? "—" : summary.length}</div>
            <div className="stat-sub">Who worked this month</div>
          </div>
        </div>

        {/* Per-admin summary table */}
        <div className="card" style={{ marginBottom:20 }}>
          <h3 style={{ fontSize:20, marginBottom:16 }}>
            Admin Summary — {MONTHS.find(m2 => m2[0] === month)?.[1]} {year}
          </h3>
          {loading ? <div className="empty-state">Loading...</div>
            : summary.length === 0
              ? <div className="empty-state">No shift data for this period.</div>
              : <div className="table-wrap">
                  <table>
                    <thead><tr><th>#</th><th>Admin</th><th>Shifts</th><th>Total Hours</th><th>Walk-in Revenue</th><th></th></tr></thead>
                    <tbody>
                      {[...summary].sort((a,b) => parseFloat(b.total_revenue||0) - parseFloat(a.total_revenue||0)).map((s, i) => (
                        <tr key={s.admin} style={{ background: selected === s.admin ? "rgba(232,255,0,0.05)" : "" }}>
                          <td style={{ color:"var(--muted)", fontSize:12 }}>{i+1}</td>
                          <td style={{ fontWeight:700, color:"var(--accent)" }}>{s.admin}</td>
                          <td>{s.total_shifts}</td>
                          <td>{Number(s.total_hours || 0).toFixed(1)}h</td>
                          <td style={{ fontWeight:700, color:"var(--success)" }}>₱{fmtMoney(s.total_revenue)}</td>
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
                Shifts — <span style={{ color:"var(--accent)" }}>{selected}</span>
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>
            </div>
            {detailShifts.length === 0
              ? <div className="empty-state">No shifts found.</div>
              : <div className="table-wrap">
                  <table>
                    <thead><tr><th>#</th><th>Date</th><th>Time In</th><th>Time Out</th><th>Duration</th><th>Walk-in Revenue</th><th>Status</th></tr></thead>
                    <tbody>{detailShifts.map((s, i) => <ShiftRow key={s.id} s={s} i={i} />)}</tbody>
                  </table>
                </div>
            }
          </div>
        )}
      </>)}

      {/* ══ DAILY VIEW ════════════════════════════════════════════════════════ */}
      {tab === "daily" && (<>
        <div style={{ display:"flex", gap:10, marginBottom:20, alignItems:"center", flexWrap:"wrap" }}>
          <input type="date" value={date} max={todayStr}
            onChange={e => setDate(e.target.value)}
            style={{ width:"auto", padding:"8px 14px" }} />
          <button className="btn btn-ghost btn-sm" onClick={fetchDaily}>↺ Refresh</button>
          {/* Quick day buttons */}
          {[0,1,2].map(offset => {
            const d = new Date(now); d.setDate(d.getDate() - offset);
            const ds = localDateStr(d);
            const label = offset === 0 ? "Today" : offset === 1 ? "Yesterday" : ds;
            return (
              <button key={offset}
                className={`btn btn-sm ${date === ds ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setDate(ds)}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Daily summary cards */}
        <div className="stats-grid" style={{ marginBottom:20 }}>
          <div className="stat-card">
            <div className="stat-label">Shifts on {date}</div>
            <div className="stat-value yellow">{loading ? "—" : dailyShifts.length}</div>
            <div className="stat-sub">Total shifts logged</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Walk-in Revenue</div>
            <div className="stat-value green" style={{ fontSize:28 }}>₱{loading ? "—" : fmtMoney(dailyRevenue)}</div>
            <div className="stat-sub">Combined for this day</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Admins On Duty</div>
            <div className="stat-value" style={{ color:"#00b0ff" }}>
              {loading ? "—" : new Set(dailyShifts.map(s => s.admin_username)).size}
            </div>
            <div className="stat-sub">Unique admins</div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize:20, marginBottom:16 }}>
            Shift Log — <span style={{ color:"var(--accent)" }}>{date}</span>
          </h3>
          {loading
            ? <div className="empty-state">Loading...</div>
            : dailyShifts.length === 0
              ? <div className="empty-state">No shifts recorded for {date}.</div>
              : <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>#</th><th>Admin</th><th>Time In</th><th>Time Out</th><th>Duration</th><th>Walk-in Revenue</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {sortedDailyShifts.map((s, i) => (
                        <tr key={s.id}>
                          <td style={{ color:"var(--muted)", fontSize:12 }}>{i+1}</td>
                          <td style={{ fontWeight:700, color:"var(--accent)" }}>{s.admin_username}</td>
                          <td style={{ color:"var(--success)", fontWeight:600 }}>{fmtTime(s.shift_ts_in || s.time_in)}</td>
                          <td style={{ color: (s.shift_ts_out || s.time_out) ? "var(--text)" : "var(--success)" }}>
                            {(s.shift_ts_out || s.time_out)
                              ? fmtTime(s.shift_ts_out || s.time_out)
                              : <span style={{ color:"var(--success)" }}>Active</span>}
                          </td>
                          <td style={{ color:"var(--muted)", fontSize:12 }}>
                            {duration(s.shift_ts_in || s.time_in, s.shift_ts_out || s.time_out)}
                          </td>
                          <td style={{ fontWeight:700, color:"var(--success)" }}>₱{fmtMoney(s.shift_revenue)}</td>
                          <td>
                            {(s.shift_ts_out || s.time_out)
                              ? <span className="badge badge-expired">Ended</span>
                              : <span className="badge badge-active">On Shift</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
          }
        </div>
      </>)}
    </Layout>
  );
}

export default Shifts;
