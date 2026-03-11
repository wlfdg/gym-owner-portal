import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

const Login     = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admins    = lazy(() => import("./pages/Admins"));
const Logs      = lazy(() => import("./pages/Logs"));
const Members   = lazy(() => import("./pages/Members"));
const Settings  = lazy(() => import("./pages/Settings"));
const Shifts    = lazy(() => import("./pages/Shifts"));
const Deletions = lazy(() => import("./pages/DeletionRequests"));

function Loader() {
  return (
    <div style={{ minHeight:"100vh", background:"#111", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:36, height:36, border:"3px solid rgba(232,255,0,0.2)", borderTop:"3px solid #e8ff00", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function PrivateRoute({ children }) {
  return localStorage.getItem("owner_logged_in") === "true" ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/"          element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/admins"    element={<PrivateRoute><Admins /></PrivateRoute>} />
          <Route path="/logs"      element={<PrivateRoute><Logs /></PrivateRoute>} />
          <Route path="/members"   element={<PrivateRoute><Members /></PrivateRoute>} />
          <Route path="/settings"  element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/shifts"    element={<PrivateRoute><Shifts /></PrivateRoute>} />
          <Route path="/deletions"  element={<PrivateRoute><Deletions /></PrivateRoute>} />
          <Route path="*"          element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
