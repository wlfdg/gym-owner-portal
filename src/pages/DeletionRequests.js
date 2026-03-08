import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api/config";
import Layout from "../components/Layout";

function DeletionRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState(null);
  const mounted = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const showMsg = (text, type="success") => { setMsg({text,type}); setTimeout(()=>setMsg(null),5000); };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/deletion-requests");
      if (mounted.current) setRequests(res.data);
    } catch { showMsg("Failed to load requests.", "error"); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const action = async (url, successMsg) => {
    try {
      await api.post(url);
      showMsg(successMsg);
      fetchRequests();
    } catch (e) { showMsg(e.response?.data?.message || "Action failed.", "error"); }
  };

  const pending  = requests.filter(r => r.status === "pending");
  const resolved = requests.filter(r => r.status !== "pending");

  return (
    <Layout>
      <div className="page-header">
        <h2>Member Deletion Requests</h2>
        <p>Review and approve or reject admin requests to delete members</p>
      </div>

      {msg && (
        <div style={{
          padding:"12px 16px", borderRadius:8, marginBottom:20, fontSize:14, fontWeight:600,
          background: msg.type==="success" ? "rgba(0,230,118,0.1)" : "rgba(255,23,68,0.1)",
          border:`1px solid ${msg.type==="success" ? "rgba(0,230,118,0.3)" : "rgba(255,23,68,0.3)"}`,
          color: msg.type==="success" ? "var(--success)" : "var(--danger)"
        }}>{msg.text}</div>
      )}

      {/* Pending */}
      <div className="card" style={{ marginBottom:20, borderColor: pending.length > 0 ? "rgba(255,193,7,0.4)" : undefined }}>
        <div className="dash-section-header" style={{ marginBottom:16 }}>
          <h3 style={{ fontSize:20 }}>Pending Approval</h3>
          <span className="badge badge-expiring">{pending.length}</span>
        </div>
        {loading ? <div className="empty-state">Loading...</div>
          : pending.length === 0 ? <div className="empty-state">No pending deletion requests</div>
          : <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Member</th><th>Plan</th><th>Requested By</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {pending.map((r,i) => (
                    <tr key={r.id}>
                      <td style={{color:"var(--muted)",fontSize:12}}>{i+1}</td>
                      <td style={{fontWeight:700,color:"#ff1744"}}>{r.member_name}</td>
                      <td>{r.member_plan || "-"}</td>
                      <td style={{color:"var(--accent)",fontWeight:600}}>{r.requested_by}</td>
                      <td style={{fontSize:12,color:"var(--muted)"}}>{new Date(r.created_at).toLocaleString("en-PH")}</td>
                      <td>
                        <div style={{display:"flex",gap:8}}>
                          <button className="btn btn-danger btn-sm"
                            onClick={() => { if(window.confirm(`Approve deletion of ${r.member_name}? This cannot be undone.`)) action(`/deletion-requests/${r.id}/approve`, `${r.member_name} deleted successfully.`); }}>
                            Approve Delete
                          </button>
                          <button className="btn btn-ghost btn-sm"
                            onClick={() => action(`/deletion-requests/${r.id}/reject`, `Deletion of ${r.member_name} rejected.`)}>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>

      {/* History */}
      <div className="card">
        <div className="dash-section-header" style={{ marginBottom:16 }}>
          <h3 style={{ fontSize:20 }}>History</h3>
          <span className="badge badge-expired">{resolved.length}</span>
        </div>
        {resolved.length === 0 ? <div className="empty-state">No resolved requests</div>
          : <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Member</th><th>Plan</th><th>Requested By</th><th>Status</th><th>Reviewed By</th><th>Date</th></tr></thead>
                <tbody>
                  {resolved.map((r,i) => (
                    <tr key={r.id}>
                      <td style={{color:"var(--muted)",fontSize:12}}>{i+1}</td>
                      <td style={{fontWeight:600}}>{r.member_name}</td>
                      <td>{r.member_plan || "-"}</td>
                      <td style={{color:"var(--accent)"}}>{r.requested_by}</td>
                      <td>
                        {r.status === "approved"
                          ? <span className="badge badge-expired">Approved</span>
                          : <span className="badge badge-active">Rejected</span>}
                      </td>
                      <td style={{color:"var(--muted)"}}>{r.reviewed_by || "-"}</td>
                      <td style={{fontSize:12,color:"var(--muted)"}}>{new Date(r.created_at).toLocaleString("en-PH")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>
    </Layout>
  );
}

export default DeletionRequests;
