import { Outlet, Link, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const getInitials = (name = "") =>
  name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "U";

export default function ProfileLayout() {
  const { user }     = useAuth();
  const { subdomain } = useParams();
  const { pathname }  = useLocation();
  const base          = `/company/${subdomain}`;

  const isProfile  = pathname.includes("/profile");
  const isSettings = pathname.includes("/settings");

  return (
    <div style={{ minHeight: "100vh", background: "#f4f5fb" }}>

      {/* ── Top bar ── */}
      <div style={{
        height: 56, background: "#fff",
        borderBottom: "1px solid #eef0f6",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 8px rgba(0,0,0,.06)",
      }}>

        {/* Left: back + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link to={`${base}/dashboard`} style={{
            display: "flex", alignItems: "center", gap: 6,
            color: "#7367f0", fontWeight: 600, fontSize: 13.5,
            textDecoration: "none",
          }}>
            <i className="bx bx-arrow-back" style={{ fontSize: 18 }} />
            Back to Dashboard
          </Link>
          <div style={{ width: 1, height: 20, background: "#e0e2e9" }} />
          <span style={{ fontWeight: 700, fontSize: 15, color: "#333" }}>
            ERP System
          </span>
        </div>

        {/* Right: nav + avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Link to={`${base}/profile`} style={{
            padding: "6px 14px", borderRadius: 8,
            fontSize: 13, fontWeight: 500, textDecoration: "none",
            color: isProfile ? "#7367f0" : "#6e6b7b",
            background: isProfile ? "rgba(115,103,240,.1)" : "transparent",
            transition: "all .15s",
          }}>
            <i className="bx bx-user me-1" />Profile
          </Link>
          <Link to={`${base}/settings`} style={{
            padding: "6px 14px", borderRadius: 8,
            fontSize: 13, fontWeight: 500, textDecoration: "none",
            color: isSettings ? "#7367f0" : "#6e6b7b",
            background: isSettings ? "rgba(115,103,240,.1)" : "transparent",
            transition: "all .15s",
          }}>
            <i className="bx bx-cog me-1" />Settings
          </Link>

          <div style={{ width: 1, height: 20, background: "#e0e2e9", margin: "0 8px" }} />

          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg,#7367f0,#ce9ffc)",
            color: "#fff", fontWeight: 700, fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {getInitials(user?.fullName)}
          </div>
        </div>
      </div>

      {/* ── Page content ── */}
      <div style={{ maxWidth: 1500, margin: "0 auto", padding: "auto" }}>
        <Outlet />
      </div>
    </div>
  );
}