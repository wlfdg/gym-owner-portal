import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api/config";
import Layout from "../components/Layout";

const POLL_INTERVAL = 5000; // refresh every 5 seconds

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function Walkins() {
  const [data, setData]           = useState({ walkins: [], total: 0, date: "" });
  const [selectedDate, setSelectedDate] = useState(() => localDateStr(new Date()));
  const [loading, setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [newIds, setNewIds]       = useState(new Set());
  const prevIds                   = useRef(new Set());
  const mounted                   = useRef(true);
  const pollRef                   = useRef(null);
  const today                     = localDateStr(new Date());
  const isToday                   = selectedDate === today;

  useEffect(() => { return () => { mounted.current = false; clearInterval(pollRef.current); }; }, []);

  const fetchWalkins = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/walkins?date=${selectedDate}`);
      if (!mounted.current) return;

      const incoming = res.data.walkins || [];
      const incomingIds = new Set(incoming.map(w => w.id));

      // highlight newly added entries
      const fresh = new Set([...incomingIds].filter(id => !prevIds.current.has(id)));
      if (fresh.size > 0) {
        setNewIds(fresh);
        setTimeout(() => { if (mounted.current) setNewIds(new Set()); }, 2000);
      }
      prevIds.current = incomingIds;

      setData(res.data);
      setLastUpdated(new Date());
    } catch {}
    if (!silent && mounted.current) setLoading(false);
  }, [selectedDate]);

  // initial load
  useEffect(() => {
    fetchWalkins(false);
  }, [fetchWalkins]);

  // live polling â€” only poll today's data
  useEffect(() => {
    clearInterval(pollRef.current);
    if (isToday) {
      pollRef.current = setInterval(() => fetchWalkins(true), POLL_INTERVAL);
    }
    return () => clearInterval(pollRef.current);
  }, [isToday, fetchWalkins]);

  const fmt = n => Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2>Walk-in Revenue</h2>
          <p>
            {isToday
              ? <span style={{ color: "var(--success)", fontWeight: 600 }}>
                  â— Live â€” refreshing every 5s
                </span>
              : `Viewing ${selectedDate}`}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input type="date" value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)" }} />
          <button className="btn btn-ghost btn-sm" onClick={() => fetchWalkins(false)}>â†º Refresh</button>
        </div>
      </div>

      {/* Revenue hero */}
      <div className="card" style={{ marginBottom: 20, borderColor: "rgba(232,255,0,0.3)", background: "linear-gradient(135deg,#1a1a1a 0%,#1f1f0a 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="stat-label" style={{ marginBottom: 4 }}>
              {isToday ? "Today's Total Walk-in Revenue" : `Walk-in Revenue â€” ${selectedDate}`}
            </div>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 64, color: "var(--accent)", lineHeight: 1 }}>
              â‚±{fmt(data.total)}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
              {data.walkins.length} walk-in{data.walkins.length !== 1 ? "s" : ""}
              {lastUpdated && isToday && (
                <span style={{ marginLeft: 10, color: "var(--success)", fontSize: 11 }}>
                  Last updated: {lastUpdated.toLocaleTimeString("en-PH")}
                </span>
              )}
            </div>
          </div>
          {isToday && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--success)", animation: "pulse 1.5s ease-in-out infinite" }} />
              <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 600 }}>LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 20 }}>Walk-in Entries</h3>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{selectedDate}</span>
        </div>

        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : data.walkins.length === 0 ? (
          <div className="empty-state">No walk-ins recorded for {selectedDate}.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Name</th><th>Amount</th><th>Note</th><th>Time</th></tr>
              </thead>
              <tbody>
                {data.walkins.map((w, i) => (
                  <tr key={w.id} style={{
                    transition: "background 0.5s",
                    background: newIds.has(w.id) ? "rgba(0,230,118,0.08)" : "transparent"
                  }}>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>
                      {w.name}
                      {newIds.has(w.id) && (
                        <span style={{ marginLeft: 8, fontSize: 10, color: "var(--success)", fontWeight: 700 }}>NEW</span>
                      )}
                    </td>
                    <td style={{ color: "var(--accent)", fontWeight: 700, fontFamily: "'Bebas Neue',cursive", fontSize: 18 }}>
                      â‚±{Number(w.amount).toLocaleString()}
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>{w.note || "â€”"}</td>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>
                      {w.created_at ? new Date(w.created_at).toLocaleTimeString("en-PH") : "â€”"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="2" style={{ fontWeight: 700, fontSize: 13, paddingTop: 14, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>Total</td>
                  <td style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 28, color: "var(--accent)", paddingTop: 14 }}>â‚±{fmt(data.total)}</td>
                  <td colSpan="2" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </Layout>
  );
}

export default Walkins;