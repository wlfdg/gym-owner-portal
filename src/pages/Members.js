import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api/config";
import Layout from "../components/Layout";

function Members() {
  const [members, setMembers]   = useState([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState(null);
  const [editMember, setEditMember] = useState(null);
  const mounted = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);

  // ── Add form state
  const [name, setName]         = useState("");
  const [months, setMonths]     = useState("");
  const [price, setPrice]       = useState("");
  const [discount, setDiscount] = useState("");
  const [plan, setPlan]         = useState("Basic");
  const [adding, setAdding]     = useState(false);

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 5000);
  };

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/members");
      if (mounted.current) setMembers(res.data);
    } catch { showMsg("Failed to load members.", "error"); }
    if (mounted.current) setLoading(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const addMember = async () => {
    if (!name || !months || !price) { showMsg("Name, months, and price are required.", "error"); return; }
    setAdding(true);
    try {
      await api.post("/members", { name, months, price, discount: discount || 0, plan });
      showMsg(`${name} added successfully!`);
      setName(""); setMonths(""); setPrice(""); setDiscount(""); setPlan("Basic");
      fetchMembers();
    } catch (e) { showMsg(e.response?.data?.message || "Failed to add member.", "error"); }
    setAdding(false);
  };

  const deleteMember = async (id, memberName) => {
    if (!window.confirm(`Delete ${memberName}? This cannot be undone.`)) return;
    try {
      await api.delete(`/members/${id}`);
      showMsg(`${memberName} deleted.`);
      fetchMembers();
    } catch (e) { showMsg(e.response?.data?.message || "Failed to delete.", "error"); }
  };

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (exp) => {
    if (!exp) return <span className="badge badge-expired">Unknown</span>;
    const today = new Date().toISOString().split("T")[0];
    const daysLeft = Math.ceil((new Date(exp) - new Date(today)) / 86400000);
    if (daysLeft < 0)  return <span className="badge badge-expired">Expired</span>;
    if (daysLeft <= 7) return <span className="badge badge-expiring">Expiring Soon</span>;
    return <span className="badge badge-active">Active</span>;
  };

  return (
    <Layout>
      <div className="page-header">
        <h2>Members</h2>
        <p>Manage gym memberships</p>
      </div>

      {msg && (
        <div style={{
          padding:"12px 16px", borderRadius:8, marginBottom:20, fontSize:14, fontWeight:600,
          background: msg.type==="success" ? "rgba(0,230,118,0.1)" : "rgba(255,23,68,0.1)",
          border:`1px solid ${msg.type==="success" ? "rgba(0,230,118,0.3)" : "rgba(255,23,68,0.3)"}`,
          color: msg.type==="success" ? "var(--success)" : "var(--danger)"
        }}>
          {msg.type==="success" ? "✅" : "❌"} {msg.text}
        </div>
      )}

      {/* ── Add Member ── */}
      <div className="card" style={{ marginBottom:20 }}>
        <h3 style={{ fontSize:20, marginBottom:16 }}>➕ Add Member</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Full Name</label>
            <input placeholder="e.g. Juan Dela Cruz" value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Plan</label>
            <select value={plan} onChange={e=>setPlan(e.target.value)}>
              <option>Basic</option>
              <option>Standard</option>
              <option>Premium</option>
            </select>
          </div>
          <div className="form-group">
            <label>Months</label>
            <input type="number" min="1" max="60" placeholder="e.g. 3" value={months} onChange={e=>setMonths(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Price (₱)</label>
            <input type="number" min="0" placeholder="e.g. 1500" value={price} onChange={e=>setPrice(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Discount (%)</label>
            <input type="number" min="0" max="100" placeholder="0" value={discount} onChange={e=>setDiscount(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={addMember} disabled={adding}>
          {adding ? "Adding..." : "➕ Add Member"}
        </button>
      </div>

      {/* ── Members Table ── */}
      <div className="card">
        <div className="log-header">
          <h3 style={{ fontSize:20 }}>All Members ({filtered.length})</h3>
          <input
            placeholder="🔍 Search member..."
            value={search}
            onChange={e=>setSearch(e.target.value)}
            style={{ width:200, padding:"8px 12px" }}
          />
        </div>

        {loading
          ? <div className="empty-state">Loading...</div>
          : filtered.length === 0
            ? <div className="empty-state">No members found.</div>
            : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th><th>Name</th><th>Plan</th><th>Months</th>
                      <th>Price</th><th>Start</th><th>Expiration</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m, i) => (
                      <tr key={m.id}>
                        <td style={{color:"var(--muted)",fontSize:12}}>{i+1}</td>
                        <td style={{fontWeight:600}}>{m.name}</td>
                        <td>{m.plan || "Basic"}</td>
                        <td>{m.months}</td>
                        <td style={{color:"var(--success)"}}>
                          ₱{Number(m.price - (m.price * (m.discount||0) / 100)).toLocaleString()}
                          {m.discount > 0 && <span style={{fontSize:10,color:"var(--warning)",marginLeft:4}}>(-{m.discount}%)</span>}
                        </td>
                        <td style={{fontSize:12,color:"var(--muted)"}}>{m.start_date}</td>
                        <td style={{fontSize:12}}>{m.expiration_date}</td>
                        <td>{getStatusBadge(m.expiration_date)}</td>
                        <td>
                          <div style={{display:"flex",gap:6}}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditMember(m)}>✏️ Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteMember(m.id, m.name)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      </div>

      {/* ── Edit Modal ── */}
      {editMember && (
        <EditModal
          member={editMember}
          onClose={() => setEditMember(null)}
          onSaved={() => { setEditMember(null); fetchMembers(); showMsg("Member updated successfully!"); }}
          showMsg={showMsg}
        />
      )}
    </Layout>
  );
}

// ── Inline Edit Modal ──────────────────────────────────────────────────────────
function EditModal({ member, onClose, onSaved, showMsg }) {
  const [name, setName]         = useState(member.name || "");
  const [months, setMonths]     = useState(member.months || "");
  const [price, setPrice]       = useState(member.price || "");
  const [discount, setDiscount] = useState(member.discount || 0);
  const [plan, setPlan]         = useState(member.plan || "Basic");
  const [startDate, setStartDate] = useState(member.start_date || "");
  const [saving, setSaving]     = useState(false);

  const save = async () => {
    if (!name || !months || !price) { showMsg("Name, months, and price are required.", "error"); return; }
    setSaving(true);
    try {
      await api.put(`/members/${member.id}`, { name, months, price, discount, plan, start_date: startDate });
      onSaved();
    } catch (e) { showMsg(e.response?.data?.message || "Failed to update member.", "error"); }
    setSaving(false);
  };

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.75)",
      zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:20
    }}>
      <div className="card" style={{ width:480, maxWidth:"90vw" }}>
        <h3 style={{ fontSize:22, marginBottom:16 }}>✏️ Edit Member</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Full Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Plan</label>
            <select value={plan} onChange={e=>setPlan(e.target.value)}>
              <option>Basic</option>
              <option>Standard</option>
              <option>Premium</option>
            </select>
          </div>
          <div className="form-group">
            <label>Months</label>
            <input type="number" min="1" max="60" value={months} onChange={e=>setMonths(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Price (₱)</label>
            <input type="number" min="0" value={price} onChange={e=>setPrice(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Discount (%)</label>
            <input type="number" min="0" max="100" value={discount} onChange={e=>setDiscount(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} />
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <button className="btn btn-primary" onClick={save} disabled={saving} style={{ flex:1 }}>
            {saving ? "Saving..." : "💾 Save Changes"}
          </button>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex:1 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default Members;
