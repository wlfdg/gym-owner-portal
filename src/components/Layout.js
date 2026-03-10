import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { api } from "../api/config";

const NAV = [
  { to:"/dashboard", icon:"⚡", label:"Overview" },
  { to:"/admins",    icon:"👥", label:"Manage Admins" },
  { to:"/members",   icon:"🏋", label:"Members" },
  { to:"/shifts",    icon:"🗓", label:"Shifts & Revenue" },
  { to:"/dtr",       icon:"🕐", label:"Employee DTR" },
  { to:"/deletions", icon:"🗑", label:"Deletion Requests" },
  { to:"/logs",      icon:"📋", label:"Activity Logs" },
  { to:"/settings",  icon:"⚙️",  label:"Settings" },
];

function Layout({ children }) {
  const navigate = useNavigate();
  const [unread, setUnread]               = useState(0);
  const [popups, setPopups]               = useState([]);
  const [notifications, setNotifs]        = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [loggingOut, setLoggingOut]       = useState(false);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      const newCount = res.data.count;
      if (newCount > unread && unread >= 0) {
        const nRes = await api.get("/notifications");
        const newNotifs = nRes.data.filter(n => !n.is_read);
        setNotifs(nRes.data);
        if (newCount > unread) {
          newNotifs.slice(0, newCount - unread).forEach(n => {
            const id = Date.now() + Math.random();
            setPopups(prev => [...prev, { id, title: n.title, message: n.message }]);
            setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 6000);
          });
        }
      }
      setUnread(newCount);
    } catch {}
  }, [unread]);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  const openNotifs = async () => {
    setShowNotifPanel(!showNotifPanel);
    if (!showNotifPanel) {
      try {
        const res = await api.get("/notifications");
        setNotifs(res.data);
        await api.post("/notifications/mark-read");
        setUnread(0);
      } catch {}
    }
  };

  // ── Logout: sends shift_id so backend saves revenue & resets for next admin ──
  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const username = localStorage.getItem("gym_admin") || "";
      const shiftId  = localStorage.getItem("shift_id");
      // POST to /logout — backend saves shift revenue, closes the shift
      await api.post("/logout", {
        username,
        ...(shiftId ? { shift_id: parseInt(shiftId) } : {})
      });
    } catch {
      // Even if the request fails, still clear local state and redirect
    }
    // ✅ Clear all auth keys
    localStorage.removeItem("owner_logged_in");
    localStorage.removeItem("gym_admin");
    localStorage.removeItem("gym_role");
    localStorage.removeItem("shift_id");
    navigate("/", { replace: true });
  };

  return (
    <div className="layout">
      {/* Notification popups */}
      <div style={{ position:"fixed", top:20, right:20, zIndex:9999, display:"flex", flexDirection:"column", gap:10 }}>
        {popups.map(p => (
          <div key={p.id} className="notif-popup">
            <button className="notif-popup-close" onClick={() => setPopups(prev => prev.filter(x => x.id !== p.id))}>×</button>
            <div style={{ fontSize:20, marginBottom:6 }}>🔔</div>
            <div className="notif-popup-title">{p.title}</div>
            <div className="notif-popup-msg">{p.message}</div>
            <button className="btn btn-primary btn-sm" style={{ marginTop:10, width:"100%" }}
              onClick={() => { navigate("/admins"); setPopups([]); }}>
              Review Request →
            </button>
          </div>
        ))}
      </div>

      {/* Notification panel */}
      {showNotifPanel && (
        <div style={{ position:"fixed", top:0, right:0, bottom:0, width:320, background:"#161616", borderLeft:"1px solid var(--border)", zIndex:500, display:"flex", flexDirection:"column", overflowY:"auto" }}>
          <div style={{ padding:"20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <h3 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:24, color:"var(--accent)" }}>Notifications</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowNotifPanel(false)}>✕</button>
          </div>
          {notifications.length === 0
            ? <div className="empty-state">No notifications yet.</div>
            : notifications.map(n => (
              <div key={n.id} style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", background: n.is_read ? "transparent" : "rgba(232,255,0,0.03)" }}>
                <div style={{ fontWeight:600, fontSize:13, color: n.is_read ? "var(--text)" : "var(--accent)", marginBottom:4 }}>{n.title}</div>
                <div style={{ fontSize:12, color:"var(--muted)", marginBottom:4 }}>{n.message}</div>
                <div style={{ fontSize:10, color:"var(--muted)" }}>{new Date(n.created_at).toLocaleString("en-PH")}</div>
              </div>
            ))
          }
        </div>
      )}

      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>LOYD'S FITNESS</h1>
          <div className="role-badge">★ Owner Portal</div>
        </div>
        <nav>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
              <span className="icon">{icon}</span>
              <span style={{ flex:1 }}>{label}</span>
              {to === "/admins" && unread > 0 && (
                <span className="badge-count">{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button
            className="btn btn-ghost btn-sm"
            style={{ width:"100%", marginBottom:8, justifyContent:"space-between" }}
            onClick={openNotifs}>
            🔔 Notifications
            {unread > 0 && <span className="badge-count">{unread}</span>}
          </button>
          <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>
            {localStorage.getItem("gym_admin") || "owner"}
          </div>
          <button className="logout-btn" onClick={logout} disabled={loggingOut}>
            {loggingOut ? "Logging out..." : "↩ Logout"}
          </button>
        </div>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
}

export default Layout;
