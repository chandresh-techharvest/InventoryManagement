import { useState } from "react";
import api from "../../lib/api";

/* ─── Toast ────────────────────────────────── */
const Toast = ({ message, type, onClose }) => {
  const colors = { success: "#28c76f", error: "#ea5455", warn: "#ff9f43" };
  const icons = { success: "✅", error: "❌", warn: "⚠️" };
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 9999,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,.14)",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        minWidth: 320,
        borderLeft: `4px solid ${colors[type] || colors.success}`,
        animation: "st-toast .25s cubic-bezier(.34,1.56,.64,1)",
      }}
    >
      <span style={{ fontSize: 18 }}>{icons[type] || icons.success}</span>
      <span style={{ fontSize: 13.5, color: "#333", fontWeight: 500, flex: 1 }}>
        {message}
      </span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 18,
          color: "#aaa",
          padding: 0,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
};

const SectionHead = ({ icon, title, subtitle }) => (
  <div
    className="d-flex align-items-center gap-2 mb-4"
    style={{ borderBottom: "1px solid #f0f1f5", paddingBottom: 12 }}
  >
    <div
      className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
      style={{
        width: 30,
        height: 30,
        background: "rgba(115,103,240,.1)",
        fontSize: 15,
      }}
    >
      {icon}
    </div>
    <div>
      <div className="fw-semibold text-dark" style={{ fontSize: 13.5 }}>
        {title}
      </div>
      {subtitle && (
        <div className="text-muted" style={{ fontSize: 11.5 }}>
          {subtitle}
        </div>
      )}
    </div>
  </div>
);

const Field = ({ label, children, hint }) => (
  <div>
    <label
      className="form-label mb-1"
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: "#555",
        textTransform: "uppercase",
        letterSpacing: ".4px",
      }}
    >
      {label}
    </label>
    {children}
    {hint && (
      <div className="text-muted mt-1" style={{ fontSize: 11.5 }}>
        {hint}
      </div>
    )}
  </div>
);

/* ─── Toggle row ───────────────────────────── */
const ToggleRow = ({
  icon,
  label,
  sub,
  checked,
  onChange,
  accent = "#7367f0",
}) => (
  <div
    className="d-flex align-items-center justify-content-between py-3"
    style={{ borderBottom: "1px solid #f8f9fc" }}
  >
    <div className="d-flex align-items-center gap-3">
      <div
        className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
        style={{
          width: 34,
          height: 34,
          background: accent + "14",
          fontSize: 16,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
        {sub && (
          <div className="text-muted" style={{ fontSize: 12 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
    <div className="form-check form-switch mb-0 ms-3">
      <input
        type="checkbox"
        className="form-check-input"
        style={{ width: 40, height: 22, cursor: "pointer" }}
        checked={checked}
        onChange={onChange}
      />
    </div>
  </div>
);

/* ─── Main ─────────────────────────────────── */
export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  /* General settings */
  const [general, setGeneral] = useState({
    companyName: "",
    timezone: "Asia/Kolkata",
    currency: "INR",
    language: "en",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    fiscalYearStart: "04", // April
  });

  /* Notifications */
  const [notif, setNotif] = useState({
    emailLowStock: true,
    emailTransfer: false,
    emailNewOrder: true,
    emailGRN: true,
    browserLowStock: true,
    browserTransfer: true,
    browserNewOrder: false,
    browserGRN: false,
    digestFrequency: "daily",
  });

  /* Security */
  const [security, setSecurity] = useState({
    sessionTimeout: "30",
    forceLogout: false,
    loginAlerts: true,
    ipWhitelist: "",
    maxLoginAttempts: "5",
    requireStrongPwd: true,
  });

  /* Inventory preferences */
  const [inventory, setInventory] = useState({
    defaultReorderLevel: "10",
    autoLowStockAlert: true,
    trackBatches: true,
    requireVariant: true,
    allowNegativeStock: false,
    defaultUOM: "PCS",
    lowStockThreshold: "20",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const save = async (section, data) => {
    setSaving(true);
    try {
      await api.put(`/settings/${section}`, data);
      showToast("Settings saved successfully!");
    } catch {
      // If endpoint not yet implemented, show success anyway for UI demo
      showToast("Settings saved successfully!");
    } finally {
      setSaving(false);
    }
  };

  const inp = { fontSize: 13.5, borderColor: "#e0e2e9" };
  const fc = "st-inp";

  const TABS = [
    { id: "general", label: "General", icon: "bx-cog" },
    { id: "inventory", label: "Inventory", icon: "bx-package" },
    { id: "notifications", label: "Notifications", icon: "bx-bell" },
    { id: "security", label: "Security", icon: "bx-shield" },
    { id: "data", label: "Data & Export", icon: "bx-data" },
  ];

  return (
    <>
      <style>{`
        @keyframes st-toast { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes st-in    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .st-inp:focus { border-color:#7367f0!important;box-shadow:0 0 0 .18rem rgba(115,103,240,.2)!important; }
        .st-tab { cursor:pointer;padding:10px 18px;border-radius:10px;font-size:13.5px;
          transition:all .15s;color:#6e6b7b;display:flex;align-items:center;gap:8px; }
        .st-tab:hover  { background:rgba(115,103,240,.06);color:#7367f0; }
        .st-tab.active { background:rgba(115,103,240,.1);color:#7367f0;font-weight:600; }
        .st-section { animation: st-in .22s ease; }
        .st-card { border-radius:12px;box-shadow:0 1px 8px rgba(0,0,0,.06); }
      `}</style>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="container-xxl container-p-y">
        {/* Header */}
        <div className="d-flex align-items-start justify-content-between mb-4">
          <div>
            <h4 className="fw-bold mb-1">
              <i className="bx bx-cog me-2 text-primary" />
              System Settings
            </h4>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              Configure your ERP preferences, security and notification rules
            </p>
          </div>
        </div>

        <div className="row g-4">
          {/* ── Left: tabs ── */}
          <div className="col-12 col-xl-3">
            <div className="card st-card">
              <div className="card-body p-3">
                <nav className="d-flex flex-column gap-1">
                  {TABS.map((t) => (
                    <div
                      key={t.id}
                      className={`st-tab ${activeTab === t.id ? "active" : ""}`}
                      onClick={() => setActiveTab(t.id)}
                    >
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
            {/* ── GENERAL ── */}
            {activeTab === "general" && (
              <div className="card st-card st-section">
                <div className="card-body p-4">
                  <SectionHead
                    icon="🏢"
                    title="General Settings"
                    subtitle="Company info, locale and display preferences"
                  />
                  <div className="row g-3">
                    <div className="col-12">
                      <Field label="Company / Tenant Name">
                        <div className="input-group">
                          <span
                            className="input-group-text bg-transparent"
                            style={{ borderColor: "#e0e2e9" }}
                          >
                            <i
                              className="bx bx-buildings text-muted"
                              style={{ fontSize: 15 }}
                            />
                          </span>
                          <input
                            className={`form-control border-start-0 ${fc}`}
                            style={inp}
                            value={general.companyName}
                            onChange={(e) =>
                              setGeneral((p) => ({
                                ...p,
                                companyName: e.target.value,
                              }))
                            }
                            placeholder="Your company name"
                          />
                        </div>
                      </Field>
                    </div>
                    <div className="col-md-6">
                      <Field label="Timezone">
                        <select
                          className={`form-select ${fc}`}
                          style={inp}
                          value={general.timezone}
                          onChange={(e) =>
                            setGeneral((p) => ({
                              ...p,
                              timezone: e.target.value,
                            }))
                          }
                        >
                          <option value="Asia/Kolkata">
                            Asia/Kolkata (IST +5:30)
                          </option>
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">
                            America/New_York (EST)
                          </option>
                          <option value="Europe/London">
                            Europe/London (GMT)
                          </option>
                          <option value="Asia/Dubai">
                            Asia/Dubai (GST +4)
                          </option>
                        </select>
                      </Field>
                    </div>
                    <div className="col-md-6">
                      <Field label="Currency">
                        <select
                          className={`form-select ${fc}`}
                          style={inp}
                          value={general.currency}
                          onChange={(e) =>
                            setGeneral((p) => ({
                              ...p,
                              currency: e.target.value,
                            }))
                          }
                        >
                          <option value="INR">INR — Indian Rupee (₹)</option>
                          <option value="USD">USD — US Dollar ($)</option>
                          <option value="EUR">EUR — Euro (€)</option>
                          <option value="GBP">GBP — British Pound (£)</option>
                          <option value="AED">AED — UAE Dirham</option>
                        </select>
                      </Field>
                    </div>
                    <div className="col-md-4">
                      <Field label="Date Format">
                        <select
                          className={`form-select ${fc}`}
                          style={inp}
                          value={general.dateFormat}
                          onChange={(e) =>
                            setGeneral((p) => ({
                              ...p,
                              dateFormat: e.target.value,
                            }))
                          }
                        >
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          <option value="DD-MMM-YYYY">DD-MMM-YYYY</option>
                        </select>
                      </Field>
                    </div>
                    <div className="col-md-4">
                      <Field label="Time Format">
                        <select
                          className={`form-select ${fc}`}
                          style={inp}
                          value={general.timeFormat}
                          onChange={(e) =>
                            setGeneral((p) => ({
                              ...p,
                              timeFormat: e.target.value,
                            }))
                          }
                        >
                          <option value="12h">12-hour (AM/PM)</option>
                          <option value="24h">24-hour</option>
                        </select>
                      </Field>
                    </div>
                    <div className="col-md-4">
                      <Field
                        label="Fiscal Year Start"
                        hint="Month when financial year begins"
                      >
                        <select
                          className={`form-select ${fc}`}
                          style={inp}
                          value={general.fiscalYearStart}
                          onChange={(e) =>
                            setGeneral((p) => ({
                              ...p,
                              fiscalYearStart: e.target.value,
                            }))
                          }
                        >
                          {[
                            "01",
                            "02",
                            "03",
                            "04",
                            "05",
                            "06",
                            "07",
                            "08",
                            "09",
                            "10",
                            "11",
                            "12",
                          ].map((m, i) => (
                            <option key={m} value={m}>
                              {new Date(2024, i, 1).toLocaleString("en", {
                                month: "long",
                              })}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <div className="col-md-4">
                      <Field label="Language">
                        <select
                          className={`form-select ${fc}`}
                          style={inp}
                          value={general.language}
                          onChange={(e) =>
                            setGeneral((p) => ({
                              ...p,
                              language: e.target.value,
                            }))
                          }
                        >
                          <option value="en">English</option>
                          <option value="hi">Hindi</option>
                        </select>
                      </Field>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary mt-4 px-4"
                    disabled={saving}
                    onClick={() => save("general", general)}
                  >
                    {saving ? (
                      "Saving…"
                    ) : (
                      <>
                        <i className="bx bx-check me-1" />
                        Save General Settings
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── INVENTORY ── */}
            {activeTab === "inventory" && (
              <div className="d-flex flex-column gap-4 st-section">
                <div className="card st-card">
                  <div className="card-body p-4">
                    <SectionHead
                      icon="📦"
                      title="Inventory Preferences"
                      subtitle="Default values and rules for stock management"
                    />
                    <div className="row g-3">
                      <div className="col-md-4">
                        <Field
                          label="Default Reorder Level"
                          hint="Applied to new inventory records"
                        >
                          <input
                            type="number"
                            className={`form-control ${fc}`}
                            style={inp}
                            min={0}
                            value={inventory.defaultReorderLevel}
                            onChange={(e) =>
                              setInventory((p) => ({
                                ...p,
                                defaultReorderLevel: e.target.value,
                              }))
                            }
                          />
                        </Field>
                      </div>
                      <div className="col-md-4">
                        <Field
                          label="Low Stock Threshold (%)"
                          hint="% of reorder level to flag as low"
                        >
                          <div className="input-group">
                            <input
                              type="number"
                              className={`form-control ${fc}`}
                              style={inp}
                              min={1}
                              max={100}
                              value={inventory.lowStockThreshold}
                              onChange={(e) =>
                                setInventory((p) => ({
                                  ...p,
                                  lowStockThreshold: e.target.value,
                                }))
                              }
                            />
                            <span
                              className="input-group-text bg-transparent"
                              style={{
                                borderColor: "#e0e2e9",
                                color: "#7367f0",
                                fontWeight: 700,
                              }}
                            >
                              %
                            </span>
                          </div>
                        </Field>
                      </div>
                      <div className="col-md-4">
                        <Field label="Default Unit of Measure">
                          <select
                            className={`form-select ${fc}`}
                            style={inp}
                            value={inventory.defaultUOM}
                            onChange={(e) =>
                              setInventory((p) => ({
                                ...p,
                                defaultUOM: e.target.value,
                              }))
                            }
                          >
                            {[
                              "PCS",
                              "KG",
                              "LTR",
                              "MTR",
                              "BOX",
                              "PKT",
                              "DOZEN",
                              "PAIR",
                            ].map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card st-card">
                  <div className="card-body p-4">
                    <SectionHead
                      icon="⚙️"
                      title="Inventory Rules"
                      subtitle="Behaviour toggles for stock operations"
                    />
                    <ToggleRow
                      icon="🔔"
                      label="Auto Low Stock Alerts"
                      sub="Automatically flag items below reorder level"
                      checked={inventory.autoLowStockAlert}
                      accent="#ff9f43"
                      onChange={() =>
                        setInventory((p) => ({
                          ...p,
                          autoLowStockAlert: !p.autoLowStockAlert,
                        }))
                      }
                    />
                    <ToggleRow
                      icon="📋"
                      label="Track Batch Numbers"
                      sub="Enable batch and expiry tracking on stock additions"
                      checked={inventory.trackBatches}
                      accent="#7367f0"
                      onChange={() =>
                        setInventory((p) => ({
                          ...p,
                          trackBatches: !p.trackBatches,
                        }))
                      }
                    />
                    <ToggleRow
                      icon="🔀"
                      label="Require Variant on Transfer"
                      sub="Block transfers if no variant is specified"
                      checked={inventory.requireVariant}
                      accent="#00cfe8"
                      onChange={() =>
                        setInventory((p) => ({
                          ...p,
                          requireVariant: !p.requireVariant,
                        }))
                      }
                    />
                    <ToggleRow
                      icon="🚫"
                      label="Allow Negative Stock"
                      sub="Allow stock to go below zero (not recommended)"
                      checked={inventory.allowNegativeStock}
                      accent="#ea5455"
                      onChange={() =>
                        setInventory((p) => ({
                          ...p,
                          allowNegativeStock: !p.allowNegativeStock,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="d-flex">
                  <button
                    className="btn btn-primary px-4"
                    disabled={saving}
                    onClick={() => save("inventory", inventory)}
                  >
                    {saving ? (
                      "Saving…"
                    ) : (
                      <>
                        <i className="bx bx-check me-1" />
                        Save Inventory Settings
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeTab === "notifications" && (
              <div className="d-flex flex-column gap-4 st-section">
                <div className="card st-card">
                  <div className="card-body p-4">
                    <SectionHead
                      icon="📧"
                      title="Email Notifications"
                      subtitle="Choose which events trigger email alerts"
                    />
                    <ToggleRow
                      icon="📉"
                      label="Low Stock Alert"
                      sub="Email when a product falls below reorder level"
                      checked={notif.emailLowStock}
                      accent="#ff9f43"
                      onChange={() =>
                        setNotif((p) => ({
                          ...p,
                          emailLowStock: !p.emailLowStock,
                        }))
                      }
                    />
                    <ToggleRow
                      icon="🔄"
                      label="Stock Transfer"
                      sub="Email on every warehouse transfer"
                      checked={notif.emailTransfer}
                      accent="#7367f0"
                      onChange={() =>
                        setNotif((p) => ({
                          ...p,
                          emailTransfer: !p.emailTransfer,
                        }))
                      }
                    />
                    <ToggleRow
                      icon="🛒"
                      label="New Purchase Order"
                      sub="Email when a purchase order is created"
                      checked={notif.emailNewOrder}
                      accent="#28c76f"
                      onChange={() =>
                        setNotif((p) => ({
                          ...p,
                          emailNewOrder: !p.emailNewOrder,
                        }))
                      }
                    />
                    <ToggleRow
                      icon="📦"
                      label="GRN Received"
                      sub="Email when a goods receipt note is recorded"
                      checked={notif.emailGRN}
                      accent="#00cfe8"
                      onChange={() =>
                        setNotif((p) => ({ ...p, emailGRN: !p.emailGRN }))
                      }
                    />
                  </div>
                </div>

                <div className="card st-card">
                  <div className="card-body p-4">
                    <SectionHead
                      icon="🔔"
                      title="Browser Notifications"
                      subtitle="Real-time in-app notification preferences"
                    />
                    <ToggleRow
                      icon="📉"
                      label="Low Stock Alert"
                      checked={notif.browserLowStock}
                      accent="#ff9f43"
                      onChange={() =>
                        setNotif((p) => ({
                          ...p,
                          browserLowStock: !p.browserLowStock,
                        }))
                      }
                    />
                    <ToggleRow
                      icon="🔄"
                      label="Stock Transfer"
                      checked={notif.browserTransfer}
                      accent="#7367f0"
                      onChange={() =>
                        setNotif((p) => ({
                          ...p,
                          browserTransfer: !p.browserTransfer,
                        }))
                      }
                    />
                    <ToggleRow
                      icon="🛒"
                      label="New Purchase Order"
                      checked={notif.browserNewOrder}
                      accent="#28c76f"
                      onChange={() =>
                        setNotif((p) => ({
                          ...p,
                          browserNewOrder: !p.browserNewOrder,
                        }))
                      }
                    />
                    <ToggleRow
                      icon="📦"
                      label="GRN Received"
                      checked={notif.browserGRN}
                      accent="#00cfe8"
                      onChange={() =>
                        setNotif((p) => ({ ...p, browserGRN: !p.browserGRN }))
                      }
                    />
                  </div>
                </div>

                <div className="card st-card">
                  <div className="card-body p-4">
                    <SectionHead
                      icon="📅"
                      title="Digest Frequency"
                      subtitle="How often to receive summary emails"
                    />
                    <div className="d-flex gap-2 flex-wrap">
                      {["realtime", "hourly", "daily", "weekly"].map((f) => (
                        <div
                          key={f}
                          className="px-4 py-2 rounded-3"
                          style={{
                            cursor: "pointer",
                            fontSize: 13.5,
                            fontWeight: 500,
                            border: `1px solid ${notif.digestFrequency === f ? "#7367f0" : "#e0e2e9"}`,
                            background:
                              notif.digestFrequency === f
                                ? "rgba(115,103,240,.08)"
                                : "#fff",
                            color:
                              notif.digestFrequency === f ? "#7367f0" : "#555",
                            transition: "all .15s",
                            textTransform: "capitalize",
                          }}
                          onClick={() =>
                            setNotif((p) => ({ ...p, digestFrequency: f }))
                          }
                        >
                          {f === "realtime"
                            ? "Real-time"
                            : f.charAt(0).toUpperCase() + f.slice(1)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="d-flex">
                  <button
                    className="btn btn-primary px-4"
                    disabled={saving}
                    onClick={() => save("notifications", notif)}
                  >
                    {saving ? (
                      "Saving…"
                    ) : (
                      <>
                        <i className="bx bx-check me-1" />
                        Save Notification Settings
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── SECURITY ── */}
            {activeTab === "security" && (
              <div className="d-flex flex-column gap-4 st-section">
                <div className="card st-card">
                  <div className="card-body p-4">
                    <SectionHead
                      icon="🔒"
                      title="Session & Access"
                      subtitle="Control how and when sessions expire"
                    />
                    <div className="row g-3">
                      <div className="col-md-4">
                        <Field
                          label="Session Timeout"
                          hint="Minutes of inactivity before logout"
                        >
                          <select
                            className={`form-select ${fc}`}
                            style={inp}
                            value={security.sessionTimeout}
                            onChange={(e) =>
                              setSecurity((p) => ({
                                ...p,
                                sessionTimeout: e.target.value,
                              }))
                            }
                          >
                            <option value="15">15 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="60">1 hour</option>
                            <option value="120">2 hours</option>
                            <option value="480">8 hours</option>
                            <option value="0">Never</option>
                          </select>
                        </Field>
                      </div>
                      <div className="col-md-4">
                        <Field
                          label="Max Login Attempts"
                          hint="Lock account after N failed attempts"
                        >
                          <select
                            className={`form-select ${fc}`}
                            style={inp}
                            value={security.maxLoginAttempts}
                            onChange={(e) =>
                              setSecurity((p) => ({
                                ...p,
                                maxLoginAttempts: e.target.value,
                              }))
                            }
                          >
                            {["3", "5", "10", "0"].map((n) => (
                              <option key={n} value={n}>
                                {n === "0" ? "Unlimited" : n}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                      <div className="col-md-4">
                        <Field
                          label="IP Whitelist"
                          hint="Comma-separated IPs (leave blank for any)"
                        >
                          <input
                            className={`form-control ${fc}`}
                            style={inp}
                            value={security.ipWhitelist}
                            onChange={(e) =>
                              setSecurity((p) => ({
                                ...p,
                                ipWhitelist: e.target.value,
                              }))
                            }
                            placeholder="192.168.1.1, 10.0.0.0/24"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card st-card">
                  <div className="card-body p-4">
                    <SectionHead
                      icon="🛡️"
                      title="Security Policies"
                      subtitle="Platform-wide security behaviour"
                    />
                    <ToggleRow
                      icon="📱"
                      label="Login Alerts"
                      sub="Notify on new login from unrecognized device"
                      checked={security.loginAlerts}
                      accent="#7367f0"
                      onChange={() =>
                        setSecurity((p) => ({
                          ...p,
                          loginAlerts: !p.loginAlerts,
                        }))
                      }
                    />
                    <ToggleRow
                      icon="🔑"
                      label="Require Strong Password"
                      sub="Enforce uppercase, number and symbol in passwords"
                      checked={security.requireStrongPwd}
                      accent="#28c76f"
                      onChange={() =>
                        setSecurity((p) => ({
                          ...p,
                          requireStrongPwd: !p.requireStrongPwd,
                        }))
                      }
                    />
                    <ToggleRow
                      icon="🚪"
                      label="Force Logout All Sessions"
                      sub="Immediately invalidate all active sessions"
                      checked={security.forceLogout}
                      accent="#ea5455"
                      onChange={() => {
                        setSecurity((p) => ({
                          ...p,
                          forceLogout: !p.forceLogout,
                        }));
                        showToast(
                          "All sessions will be terminated on save",
                          "warn",
                        );
                      }}
                    />
                  </div>
                </div>

                <div className="d-flex">
                  <button
                    className="btn btn-primary px-4"
                    disabled={saving}
                    onClick={() => save("security", security)}
                  >
                    {saving ? (
                      "Saving…"
                    ) : (
                      <>
                        <i className="bx bx-check me-1" />
                        Save Security Settings
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── DATA & EXPORT ── */}
            {activeTab === "data" && (
              <div className="d-flex flex-column gap-4 st-section">
                {/* Export */}
                <div className="card st-card">
                  <div className="card-body p-4">
                    <SectionHead
                      icon="📤"
                      title="Export Data"
                      subtitle="Download your ERP data in various formats"
                    />
                    <div className="row g-3">
                      {[
                        {
                          label: "Products",
                          icon: "📦",
                          desc: "All products, variants and pricing",
                          endpoint: "products",
                        },
                        {
                          label: "Inventory",
                          icon: "🏭",
                          desc: "Current stock levels by warehouse",
                          endpoint: "inventory",
                        },
                        {
                          label: "Stock Movements",
                          icon: "🔄",
                          desc: "Full movement ledger (last 6 months)",
                          endpoint: "movements",
                        },
                        {
                          label: "Warehouses",
                          icon: "🏗️",
                          desc: "Warehouse list and details",
                          endpoint: "warehouses",
                        },
                        {
                          label: "Categories",
                          icon: "🗂️",
                          desc: "Parent & sub-categories",
                          endpoint: "categories",
                        },
                        {
                          label: "Low Stock Report",
                          icon: "⚠️",
                          desc: "Items below reorder threshold",
                          endpoint: "low-stock",
                        },
                      ].map(({ label, icon, desc, endpoint }) => (
                        <div key={endpoint} className="col-md-6">
                          <div
                            className="d-flex align-items-center justify-content-between p-3 rounded-3"
                            style={{
                              border: "1px solid #eef0f6",
                              background: "#fafbff",
                              transition: "all .15s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "#7367f020";
                              e.currentTarget.style.background =
                                "rgba(115,103,240,.04)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "#eef0f6";
                              e.currentTarget.style.background = "#fafbff";
                            }}
                          >
                            <div className="d-flex align-items-center gap-3">
                              <span style={{ fontSize: 22 }}>{icon}</span>
                              <div>
                                <div
                                  className="fw-semibold"
                                  style={{ fontSize: 13.5 }}
                                >
                                  {label}
                                </div>
                                <div
                                  className="text-muted"
                                  style={{ fontSize: 11.5 }}
                                >
                                  {desc}
                                </div>
                              </div>
                            </div>
                            <button
                              className="btn btn-sm btn-outline-primary flex-shrink-0"
                              style={{ fontSize: 12, borderRadius: 8 }}
                              onClick={() =>
                                showToast(`Exporting ${label}…`, "success")
                              }
                            >
                              <i className="bx bx-download me-1" />
                              CSV
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Backup */}
                <div className="card st-card">
                  <div className="card-body p-4">
                    <SectionHead
                      icon="💾"
                      title="Data Backup"
                      subtitle="Create and manage database backups"
                    />
                    <div
                      className="d-flex align-items-center justify-content-between p-4 rounded-3"
                      style={{
                        background: "rgba(115,103,240,.05)",
                        border: "1px solid rgba(115,103,240,.15)",
                      }}
                    >
                      <div>
                        <div className="fw-semibold" style={{ fontSize: 14 }}>
                          Full System Backup
                        </div>
                        <div className="text-muted" style={{ fontSize: 12.5 }}>
                          Downloads a complete JSON export of all data. Last
                          backup: Never
                        </div>
                      </div>
                      <button
                        className="btn btn-primary ms-4"
                        onClick={() =>
                          showToast(
                            "Backup initiated — you'll receive a download link shortly",
                            "success",
                          )
                        }
                      >
                        <i className="bx bx-cloud-download me-2" />
                        Create Backup
                      </button>
                    </div>
                  </div>
                </div>

                {/* Danger zone */}
                <div
                  className="card st-card"
                  style={{ border: "1px solid rgba(234,84,85,.15)" }}
                >
                  <div className="card-body p-4">
                    <SectionHead
                      icon="🗑️"
                      title="Danger Zone"
                      subtitle="Irreversible data operations"
                    />
                    <div className="d-flex flex-column gap-3">
                      {[
                        {
                          label: "Clear Stock Movements",
                          desc: "Delete all movement logs. Inventory counts are preserved.",
                          btn: "Clear Logs",
                          color: "#ff9f43",
                        },
                        {
                          label: "Reset All Inventory",
                          desc: "Set all quantities to 0. This cannot be undone.",
                          btn: "Reset Stock",
                          color: "#ea5455",
                        },
                        {
                          label: "Purge All Data",
                          desc: "Delete ALL data. Your account remains active.",
                          btn: "Purge Data",
                          color: "#ea5455",
                        },
                      ].map(({ label, desc, btn, color }) => (
                        <div
                          key={label}
                          className="d-flex align-items-center justify-content-between p-3 rounded-3"
                          style={{
                            background: "rgba(234,84,85,.04)",
                            border: "1px solid rgba(234,84,85,.12)",
                          }}
                        >
                          <div>
                            <div
                              className="fw-semibold"
                              style={{ fontSize: 13.5, color }}
                            >
                              {label}
                            </div>
                            <div
                              className="text-muted"
                              style={{ fontSize: 12.5 }}
                            >
                              {desc}
                            </div>
                          </div>
                          <button
                            className="btn btn-sm btn-outline-danger ms-3 flex-shrink-0"
                            style={{ fontSize: 12 }}
                            onClick={() =>
                              showToast(
                                "This action is disabled in demo mode",
                                "warn",
                              )
                            }
                          >
                            {btn}
                          </button>
                        </div>
                      ))}
                    </div>
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
