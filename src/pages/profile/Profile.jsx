import { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";

/* ─── Toast ────────────────────────────────── */
const Toast = ({ message, type, onClose }) => {
  const colors = { success: "#28c76f", error: "#ea5455", warn: "#ff9f43" };
  const icons  = { success: "✅", error: "❌", warn: "⚠️" };
  return (
    <div style={{
      position: "fixed", top: 24, right: 24, zIndex: 9999,
      background: "#fff", borderRadius: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,.14)",
      padding: "14px 20px", display: "flex", alignItems: "center", gap: 12,
      minWidth: 320, borderLeft: `4px solid ${colors[type] || colors.success}`,
      animation: "pf-toast .25s cubic-bezier(.34,1.56,.64,1)",
    }}>
      <span style={{ fontSize: 18 }}>{icons[type] || icons.success}</span>
      <span style={{ fontSize: 13.5, color: "#333", fontWeight: 500, flex: 1 }}>{message}</span>
      <button onClick={onClose}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#aaa", padding: 0, lineHeight: 1 }}>×</button>
    </div>
  );
};

/* ─── Section heading ──────────────────────── */
const SectionHead = ({ icon, title, subtitle }) => (
  <div className="d-flex align-items-center gap-2 mb-4"
    style={{ borderBottom: "1px solid #f0f1f5", paddingBottom: 12 }}>
    <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
      style={{ width: 30, height: 30, background: "rgba(115,103,240,.1)", fontSize: 15 }}>
      {icon}
    </div>
    <div>
      <div className="fw-semibold text-dark" style={{ fontSize: 13.5 }}>{title}</div>
      {subtitle && <div className="text-muted" style={{ fontSize: 11.5 }}>{subtitle}</div>}
    </div>
  </div>
);

/* ─── Field ────────────────────────────────── */
const Field = ({ label, children, hint }) => (
  <div>
    <label className="form-label mb-1"
      style={{ fontSize: 12, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: ".4px" }}>
      {label}
    </label>
    {children}
    {hint && <div className="text-muted mt-1" style={{ fontSize: 11.5 }}>{hint}</div>}
  </div>
);

/* ─── Avatar initials ──────────────────────── */
const getInitials = (name = "") =>
  name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "U";

/* ─── Activity row ─────────────────────────── */
const ActivityRow = ({ icon, label, value, color = "#7367f0" }) => (
  <div className="d-flex align-items-center justify-content-between py-2"
    style={{ borderBottom: "1px solid #f8f9fc" }}>
    <div className="d-flex align-items-center gap-3">
      <div className="rounded-2 d-flex align-items-center justify-content-center"
        style={{ width: 30, height: 30, background: color + "18", fontSize: 15 }}>
        {icon}
      </div>
      <span style={{ fontSize: 13 }}>{label}</span>
    </div>
    <span className="text-muted" style={{ fontSize: 12.5 }}>{value}</span>
  </div>
);

/* ─── Main ─────────────────────────────────── */
export default function Profile() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("personal");
  const [toast,     setToast]     = useState(null);
  const [saving,    setSaving]    = useState(false);
  const fileRef = useRef();

  /* personal info form */
  const [personal, setPersonal] = useState({
    fullName:    user?.fullName    || "",
    email:       user?.email       || "",
    phone:       user?.phone       || "",
    designation: user?.designation || "",
    department:  user?.department  || "",
    bio:         user?.bio         || "",
  });

  /* password form */
  const [pwd, setPwd] = useState({
    current: "", newPwd: "", confirm: "",
  });
  const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false });
  const [pwdErrors, setPwdErrors] = useState({});

  /* 2FA */
  const [twoFA, setTwoFA] = useState(user?.twoFAEnabled || false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* save personal info */
  const savePersonal = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put("/auth/profile", personal);
      showToast("Profile updated successfully!");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  /* change password */
  const savePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwd.current)              errs.current = "Enter current password";
    if (pwd.newPwd.length < 6)     errs.newPwd  = "Min 6 characters";
    if (pwd.newPwd !== pwd.confirm) errs.confirm = "Passwords don't match";
    setPwdErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: pwd.current,
        newPassword:     pwd.newPwd,
      });
      setPwd({ current: "", newPwd: "", confirm: "" });
      showToast("Password changed successfully!");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to change password", "error");
    } finally {
      setSaving(false);
    }
  };

  /* password strength */
  const pwdStrength = (p) => {
    if (!p) return { score: 0, label: "", color: "" };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const map = [
      { label: "",         color: "#e0e2e9" },
      { label: "Weak",     color: "#ea5455" },
      { label: "Fair",     color: "#ff9f43" },
      { label: "Good",     color: "#00cfe8" },
      { label: "Strong",   color: "#28c76f" },
    ];
    return { score, ...map[score] };
  };
  const strength = pwdStrength(pwd.newPwd);

  const inp = { fontSize: 13.5, borderColor: "#e0e2e9" };
  const fc  = "pf-inp";

  const TABS = [
    { id: "personal",  label: "Personal Info",  icon: "bx-user"      },
    { id: "security",  label: "Security",       icon: "bx-lock-alt"  },
    { id: "activity",  label: "Activity",       icon: "bx-time-five" },
  ];

  return (
    <>
      <style>{`
        @keyframes pf-toast { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pf-in    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .pf-inp:focus { border-color:#7367f0!important;box-shadow:0 0 0 .18rem rgba(115,103,240,.2)!important; }
        .pf-tab { cursor:pointer;padding:10px 18px;border-radius:10px;font-size:13.5px;
          transition:all .15s;color:#6e6b7b;display:flex;align-items:center;gap:8px; }
        .pf-tab:hover  { background:rgba(115,103,240,.06);color:#7367f0; }
        .pf-tab.active { background:rgba(115,103,240,.1);color:#7367f0;font-weight:600; }
        .pf-section { animation: pf-in .22s ease; }
        .pf-avatar-wrap:hover .pf-avatar-overlay { opacity:1!important; }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="container-xxl container-p-y">

        {/* ── Cover + Avatar ── */}
        <div className="card mb-4 overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,.08)", borderRadius: 14 }}>
          {/* Cover strip */}
          <div style={{
            height: 120,
            background: "linear-gradient(135deg, #7367f0 0%, #9e95f5 50%, #ce9ffc 100%)",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "radial-gradient(circle at 20% 80%, rgba(255,255,255,.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,.06) 0%, transparent 50%)",
            }} />
          </div>

          <div className="card-body pt-0 pb-4 px-4">
            <div className="d-flex align-items-end justify-content-between flex-wrap gap-3"
              style={{ marginTop: -40 }}>

              {/* Avatar */}
              <div className="position-relative pf-avatar-wrap" style={{ cursor: "pointer" }}
                onClick={() => fileRef.current?.click()}>
                <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                  style={{
                    width: 84, height: 84,
                    background: "linear-gradient(135deg,#7367f0,#ce9ffc)",
                    color: "#fff", fontSize: 28,
                    border: "4px solid #fff",
                    boxShadow: "0 4px 16px rgba(115,103,240,.3)",
                  }}>
                  {getInitials(personal.fullName)}
                </div>
                <div className="pf-avatar-overlay rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    position: "absolute", inset: 4, background: "rgba(0,0,0,.4)",
                    opacity: 0, transition: "opacity .2s", borderRadius: "50%",
                  }}>
                  <i className="bx bx-camera text-white" style={{ fontSize: 20 }} />
                </div>
                <div className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    position: "absolute", bottom: 2, right: 2,
                    width: 22, height: 22, background: "#7367f0",
                    border: "2px solid #fff", fontSize: 11, color: "#fff",
                  }}>
                  <i className="bx bx-edit-alt" style={{ fontSize: 11 }} />
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={() => showToast("Avatar upload coming soon", "warn")} />
              </div>

              {/* Name + role */}
              <div className="flex-fill" style={{ paddingLeft: 12, paddingBottom: 4 }}>
                <h5 className="fw-bold mb-0" style={{ fontSize: 18 }}>{personal.fullName || "Your Name"}</h5>
                <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                  {personal.designation || "No designation set"}
                  {personal.department && <span className="ms-2 badge bg-label-primary" style={{ fontSize: 11 }}>{personal.department}</span>}
                </p>
              </div>

              {/* Role badge */}
              <div className="d-flex gap-2 align-items-center pb-1">
                <span className="badge bg-label-success" style={{ fontSize: 12, padding: "6px 12px" }}>
                  <i className="bx bx-shield-check me-1" />{user?.role || "User"}
                </span>
                <span className="badge bg-label-secondary" style={{ fontSize: 12, padding: "6px 12px" }}>
                  <i className="bx bx-buildings me-1" />{user?.tenantId?.name || "Tenant"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">

          {/* ── Left: tabs ── */}
          <div className="col-12 col-xl-3">
            <div className="card" style={{ borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}>
              <div className="card-body p-3">
                <nav className="d-flex flex-column gap-1">
                  {TABS.map(t => (
                    <div key={t.id} className={`pf-tab ${activeTab === t.id ? "active" : ""}`}
                      onClick={() => setActiveTab(t.id)}>
                      <i className={`bx ${t.icon}`} style={{ fontSize: 17 }} />
                      {t.label}
                    </div>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* ── Right: content ── */}
          <div className="col-12 col-xl-9">

            {/* ── PERSONAL INFO ── */}
            {activeTab === "personal" && (
              <div className="card pf-section" style={{ borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}>
                <div className="card-body p-4">
                  <SectionHead icon="👤" title="Personal Information" subtitle="Update your name, contact and role details" />
                  <form onSubmit={savePersonal}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <Field label="Full Name">
                          <input className={`form-control ${fc}`} style={inp}
                            value={personal.fullName}
                            onChange={e => setPersonal(p => ({ ...p, fullName: e.target.value }))}
                            placeholder="John Doe" />
                        </Field>
                      </div>
                      <div className="col-md-6">
                        <Field label="Email Address">
                          <input type="email" className={`form-control ${fc}`} style={inp}
                            value={personal.email}
                            onChange={e => setPersonal(p => ({ ...p, email: e.target.value }))}
                            placeholder="john@company.com" />
                        </Field>
                      </div>
                      <div className="col-md-6">
                        <Field label="Phone Number">
                          <div className="input-group">
                            <span className="input-group-text bg-transparent" style={{ borderColor: "#e0e2e9" }}>
                              <i className="bx bx-phone text-muted" style={{ fontSize: 15 }} />
                            </span>
                            <input className={`form-control border-start-0 ${fc}`} style={inp}
                              value={personal.phone}
                              onChange={e => setPersonal(p => ({ ...p, phone: e.target.value }))}
                              placeholder="+91 XXXXX XXXXX" />
                          </div>
                        </Field>
                      </div>
                      <div className="col-md-6">
                        <Field label="Designation">
                          <input className={`form-control ${fc}`} style={inp}
                            value={personal.designation}
                            onChange={e => setPersonal(p => ({ ...p, designation: e.target.value }))}
                            placeholder="e.g. Inventory Manager" />
                        </Field>
                      </div>
                      <div className="col-md-6">
                        <Field label="Department">
                          <select className={`form-select ${fc}`} style={inp}
                            value={personal.department}
                            onChange={e => setPersonal(p => ({ ...p, department: e.target.value }))}>
                            <option value="">Select department</option>
                            {["Operations","Procurement","Warehouse","Finance","Sales","IT","HR","Management"].map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </Field>
                      </div>
                      <div className="col-md-6">
                        <Field label="Role" hint="Assigned by admin — read only">
                          <input className="form-control" style={{ ...inp, background: "#f8f9fc", cursor: "not-allowed" }}
                            value={user?.role || "user"} readOnly />
                        </Field>
                      </div>
                      <div className="col-12">
                        <Field label="Bio / Notes">
                          <textarea className={`form-control ${fc}`} style={{ ...inp, resize: "none" }}
                            rows={3} value={personal.bio}
                            onChange={e => setPersonal(p => ({ ...p, bio: e.target.value }))}
                            placeholder="A short bio about yourself…" />
                        </Field>
                      </div>
                    </div>

                    <div className="d-flex gap-2 mt-4">
                      <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                        {saving
                          ? <><span className="spinner-border spinner-border-sm me-2" style={{ width: 14, height: 14 }} />Saving…</>
                          : <><i className="bx bx-check me-1" />Save Changes</>}
                      </button>
                      <button type="button" className="btn btn-outline-secondary px-4"
                        onClick={() => setPersonal({ fullName: user?.fullName || "", email: user?.email || "", phone: user?.phone || "", designation: user?.designation || "", department: user?.department || "", bio: user?.bio || "" })}>
                        Discard
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── SECURITY ── */}
            {activeTab === "security" && (
              <div className="d-flex flex-column gap-4 pf-section">

                {/* Change password */}
                <div className="card" style={{ borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}>
                  <div className="card-body p-4">
                    <SectionHead icon="🔑" title="Change Password" subtitle="Use a strong password you haven't used before" />
                    <form onSubmit={savePassword}>
                      <div className="row g-3">
                        {[
                          { key: "current", label: "Current Password" },
                          { key: "newPwd",  label: "New Password"     },
                          { key: "confirm", label: "Confirm Password" },
                        ].map(({ key, label }) => (
                          <div key={key} className="col-md-6">
                            <Field label={label}>
                              <div className="input-group">
                                <input type={showPwd[key] ? "text" : "password"}
                                  className={`form-control ${fc} ${pwdErrors[key] ? "is-invalid" : ""}`}
                                  style={inp}
                                  value={pwd[key]}
                                  onChange={e => { setPwd(p => ({ ...p, [key]: e.target.value })); setPwdErrors(p => ({ ...p, [key]: "" })); }}
                                  placeholder="••••••••" />
                                <button type="button" className="btn btn-outline-secondary"
                                  style={{ borderColor: "#e0e2e9" }}
                                  onClick={() => setShowPwd(p => ({ ...p, [key]: !p[key] }))}>
                                  <i className={`bx ${showPwd[key] ? "bx-hide" : "bx-show"}`} style={{ fontSize: 15 }} />
                                </button>
                              </div>
                              {pwdErrors[key] && <div className="text-danger mt-1" style={{ fontSize: 11.5 }}>{pwdErrors[key]}</div>}
                            </Field>
                          </div>
                        ))}

                        {/* Strength bar */}
                        {pwd.newPwd && (
                          <div className="col-12">
                            <div className="d-flex align-items-center gap-3">
                              <div style={{ flex: 1, height: 5, background: "#f0f1f5", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${(strength.score / 4) * 100}%`, background: strength.color, borderRadius: 3, transition: "all .3s" }} />
                              </div>
                              <span style={{ fontSize: 12, color: strength.color, fontWeight: 600, minWidth: 48 }}>{strength.label}</span>
                            </div>
                            <div className="text-muted mt-1" style={{ fontSize: 11.5 }}>
                              Use 8+ chars, uppercase, numbers and symbols for a strong password
                            </div>
                          </div>
                        )}
                      </div>

                      <button type="submit" className="btn btn-primary mt-4 px-4" disabled={saving}>
                        {saving ? "Updating…" : <><i className="bx bx-lock-alt me-1" />Update Password</>}
                      </button>
                    </form>
                  </div>
                </div>

                {/* 2FA */}
                <div className="card" style={{ borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}>
                  <div className="card-body p-4">
                    <SectionHead icon="🛡️" title="Two-Factor Authentication" subtitle="Add an extra layer of security to your account" />
                    <div className="d-flex align-items-center justify-content-between p-3 rounded-3"
                      style={{
                        background: twoFA ? "rgba(40,199,111,.06)" : "#f8f9fc",
                        border: `1px solid ${twoFA ? "rgba(40,199,111,.2)" : "#eef0f6"}`,
                        transition: "all .2s",
                      }}>
                      <div>
                        <div className="fw-semibold" style={{ fontSize: 14 }}>
                          {twoFA ? "2FA is Enabled" : "2FA is Disabled"}
                        </div>
                        <div className="text-muted" style={{ fontSize: 12.5 }}>
                          {twoFA
                            ? "Your account is protected with two-factor authentication"
                            : "Enable 2FA to secure your account with a time-based OTP"}
                        </div>
                      </div>
                      <div className="form-check form-switch mb-0 ms-3">
                        <input type="checkbox" className="form-check-input"
                          style={{ width: 44, height: 24, cursor: "pointer" }}
                          checked={twoFA}
                          onChange={() => { setTwoFA(p => !p); showToast(twoFA ? "2FA disabled" : "2FA setup coming soon", twoFA ? "warn" : "success"); }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danger zone */}
                <div className="card" style={{ borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,.06)", border: "1px solid rgba(234,84,85,.15)" }}>
                  <div className="card-body p-4">
                    <SectionHead icon="⚠️" title="Danger Zone" subtitle="Irreversible account actions" />
                    <div className="d-flex align-items-center justify-content-between p-3 rounded-3"
                      style={{ background: "rgba(234,84,85,.04)", border: "1px solid rgba(234,84,85,.15)" }}>
                      <div>
                        <div className="fw-semibold text-danger" style={{ fontSize: 13.5 }}>Deactivate Account</div>
                        <div className="text-muted" style={{ fontSize: 12.5 }}>This will disable your account. Contact admin to reactivate.</div>
                      </div>
                      <button className="btn btn-sm btn-outline-danger ms-3"
                        onClick={() => showToast("Contact your admin to deactivate the account", "warn")}>
                        Deactivate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ACTIVITY ── */}
            {activeTab === "activity" && (
              <div className="d-flex flex-column gap-4 pf-section">

                {/* Account info */}
                <div className="card" style={{ borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}>
                  <div className="card-body p-4">
                    <SectionHead icon="📋" title="Account Overview" subtitle="Your account details and activity summary" />
                    <div className="row g-3">
                      {[
                        { label: "Account Created",   value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—", icon: "📅", color: "#7367f0" },
                        { label: "Last Login",         value: "Just now",   icon: "🔑", color: "#28c76f" },
                        { label: "Role",               value: user?.role || "user", icon: "👤", color: "#00cfe8" },
                        { label: "Tenant",             value: user?.tenantId?.name || "—", icon: "🏢", color: "#ff9f43" },
                        { label: "Email Verified",     value: "Yes",        icon: "✅", color: "#28c76f" },
                        { label: "2FA Status",         value: twoFA ? "Enabled" : "Disabled", icon: "🛡️", color: twoFA ? "#28c76f" : "#ea5455" },
                      ].map(({ label, value, icon, color }) => (
                        <div key={label} className="col-6 col-md-4">
                          <div className="p-3 rounded-3" style={{ background: "#f8f9fc", border: "1px solid #eef0f6" }}>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span style={{ fontSize: 16 }}>{icon}</span>
                              <span className="text-muted" style={{ fontSize: 11.5 }}>{label}</span>
                            </div>
                            <div className="fw-semibold" style={{ fontSize: 14, color }}>{value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent sessions */}
                <div className="card" style={{ borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,.06)" }}>
                  <div className="card-body p-4">
                    <SectionHead icon="💻" title="Recent Sessions" subtitle="Your recent login activity across devices" />
                    {[
                      { device: "Chrome on Windows", location: "Indore, IN", time: "Active now",   current: true  },
                      { device: "Safari on iPhone",  location: "Indore, IN", time: "2 hours ago",  current: false },
                      { device: "Firefox on Mac",    location: "Mumbai, IN", time: "Yesterday",    current: false },
                    ].map((s, i) => (
                      <div key={i} className="d-flex align-items-center justify-content-between py-3"
                        style={{ borderBottom: i < 2 ? "1px solid #f0f1f5" : "none" }}>
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-2 d-flex align-items-center justify-content-center"
                            style={{ width: 38, height: 38, background: s.current ? "rgba(40,199,111,.1)" : "rgba(115,103,240,.08)", fontSize: 18 }}>
                            {s.device.includes("iPhone") ? "📱" : "💻"}
                          </div>
                          <div>
                            <div className="fw-semibold" style={{ fontSize: 13.5 }}>{s.device}</div>
                            <div className="text-muted" style={{ fontSize: 12 }}>
                              <i className="bx bx-map-pin me-1" style={{ fontSize: 11 }} />{s.location} · {s.time}
                            </div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          {s.current
                            ? <span className="badge bg-label-success" style={{ fontSize: 11 }}>Current</span>
                            : <button className="btn btn-sm btn-outline-danger" style={{ fontSize: 12 }}
                                onClick={() => showToast("Session revoked", "success")}>Revoke</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}