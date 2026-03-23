import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getWarehouse, createWarehouse, updateWarehouse } from "../../../lib/warehouseAPI";
import { getParentCategories } from "../../../lib/parentCategoryAPI";

/* ─── section label ───────────────────────── */
const SectionLabel = ({ icon, title, subtitle }) => (
  <div className="d-flex align-items-center gap-2 mb-3" style={{ borderBottom: "1px solid #f0f1f5", paddingBottom: 10 }}>
    <div
      className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
      style={{ width: 30, height: 30, background: "rgba(115,103,240,.1)", fontSize: 15 }}
    >
      {icon}
    </div>
    <div>
      <div className="fw-semibold text-dark" style={{ fontSize: 13.5 }}>{title}</div>
      {subtitle && <div className="text-muted" style={{ fontSize: 11.5 }}>{subtitle}</div>}
    </div>
  </div>
);

/* ─── field wrapper ───────────────────────── */
const Field = ({ label, required, children, hint }) => (
  <div>
    <label className="form-label mb-1" style={{ fontSize: 13, fontWeight: 500, color: "#444" }}>
      {label}
      {required && <span className="text-danger ms-1">*</span>}
    </label>
    {children}
    {hint && <div className="text-muted mt-1" style={{ fontSize: 11.5 }}>{hint}</div>}
  </div>
);

/* ─── toast ───────────────────────────────── */
const Toast = ({ message, type }) => {
  const colors = {
    success: { bg: "#28c76f", icon: "✅" },
    error:   { bg: "#ea5455", icon: "❌" },
  };
  const c = colors[type] || colors.error;
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 9999,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 8px 30px rgba(0,0,0,.14)",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        minWidth: 300,
        animation: "wf-slidein .25s cubic-bezier(.34,1.56,.64,1)",
        borderLeft: `4px solid ${c.bg}`,
      }}
    >
      <span style={{ fontSize: 18 }}>{c.icon}</span>
      <span style={{ fontSize: 13.5, color: "#333", fontWeight: 500 }}>{message}</span>
    </div>
  );
};

/* ─── main component ──────────────────────── */
export default function WarehouseForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const emptyForm = {
    name: "",
    code: "",
    parentCategoryId: "",
    contactPerson: "",
    contactPhone: "",
    isActive: true,
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    },
  };

  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");

  // UI-only state
  const [saving, setSaving] = useState(false);
  const [loadingForm, setLoadingForm] = useState(!!id);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    loadCategories();
    if (id) loadWarehouse();
  }, [id]);

  /* ── all original logic unchanged ── */
  const loadCategories = async () => {
    try {
      const { data } = await getParentCategories();
      setCategories(data.data || []);
    } catch (err) {
      console.error("Category load error:", err);
    }
  };

  const loadWarehouse = async () => {
    try {
      setLoadingForm(true);
      const { data } = await getWarehouse(id);
      const w = data.data;
      setForm({
        ...emptyForm,
        ...w,
        parentCategoryId: w.parentCategoryId?._id || "",
        address: { ...emptyForm.address, ...w.address },
      });
    } catch (err) {
      console.error("Warehouse load error:", err);
    } finally {
      setLoadingForm(false);
    }
  };

  const handleAddress = (field, value) => {
    setForm((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = { ...form };
      if (!payload.parentCategoryId) delete payload.parentCategoryId;

      if (id) {
        await updateWarehouse(id, payload);
      } else {
        await createWarehouse(payload);
      }

      showToast(
        id ? "Warehouse updated successfully!" : "Warehouse created successfully!",
        "success"
      );

      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      console.error("Backend error:", err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Something went wrong";
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── input style ── */
  const inputStyle = { fontSize: 13.5, borderColor: "#e0e2e9" };
  const focusClass = "wf-input";

  return (
    <>
      <style>{`
        @keyframes wf-slidein {
          from { opacity:0; transform: translateX(20px) }
          to   { opacity:1; transform: translateX(0) }
        }
        @keyframes wf-fadein { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .wf-input:focus { border-color:#7367f0 !important; box-shadow:0 0 0 .18rem rgba(115,103,240,.2) !important; }
        .wf-card-section {
          background:#fff; border-radius:12px;
          border:1px solid #eef0f6; padding:24px;
          animation: wf-fadein .25s ease;
        }
        .wf-toggle { position:relative; display:inline-flex; align-items:center; gap:10px; cursor:pointer; }
        .wf-save-btn { min-width:130px; position:relative; transition: all .18s; }
        .wf-save-btn:disabled { opacity:.8; }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="container-xxl container-p-y">

        {/* ── PAGE HEADER ── */}
        <div className="d-flex align-items-center gap-2 mb-4">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => navigate(-1)}
            style={{ width: 34, height: 34, padding: 0, borderRadius: 8, flexShrink: 0 }}
          >
            <i className="bx bx-arrow-back" style={{ fontSize: 16 }} />
          </button>
          <div>
            <h4 className="fw-bold mb-0" style={{ lineHeight: 1.2 }}>
              <i className={`bx ${id ? "bx-edit" : "bx-plus-circle"} me-2 text-primary`} />
              {id ? "Edit Warehouse" : "Add Warehouse"}
            </h4>
            <p className="text-muted mb-0" style={{ fontSize: 12.5 }}>
              {id ? "Update warehouse details below" : "Fill in the details to register a new warehouse"}
            </p>
          </div>
        </div>

        {/* skeleton while loading edit data */}
        {loadingForm ? (
          <div className="wf-card-section text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-3 mb-0" style={{ fontSize: 13 }}>Loading warehouse details…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="row g-4">

              {/* ─── LEFT COLUMN ─── */}
              <div className="col-12 col-xl-8">

                {/* Basic Info */}
                <div className="wf-card-section mb-4">
                  <SectionLabel icon="🏭" title="Basic Information" subtitle="Name, code, and category" />

                  <div className="row g-3">
                    <div className="col-md-6">
                      <Field label="Warehouse Name" required>
                        <input
                          className={`form-control ${focusClass}`}
                          style={inputStyle}
                          placeholder="e.g. Main Distribution Centre"
                          value={form.name}
                          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                          required
                        />
                      </Field>
                    </div>

                    <div className="col-md-3">
                      <Field label="Warehouse Code" required hint="Unique short identifier">
                        <input
                          className={`form-control ${focusClass}`}
                          style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase" }}
                          placeholder="e.g. WH-01"
                          value={form.code}
                          onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                          required
                        />
                      </Field>
                    </div>

                    <div className="col-md-3">
                      <Field label="Category">
                        <select
                          className={`form-select ${focusClass}`}
                          style={inputStyle}
                          value={form.parentCategoryId}
                          onChange={(e) => setForm((p) => ({ ...p, parentCategoryId: e.target.value }))}
                        >
                          <option value="">Select category</option>
                          {categories.map((c) => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="wf-card-section mb-4" style={{ background: "#fafbff" }}>
                  <SectionLabel icon="📍" title="Address Details" subtitle="Physical location of the warehouse" />

                  <div className="row g-3">
                    <div className="col-12">
                      <Field label="Street Address">
                        <div className="input-group">
                          <span className="input-group-text bg-transparent" style={{ borderColor: "#e0e2e9" }}>
                            <i className="bx bx-map text-muted" style={{ fontSize: 15 }} />
                          </span>
                          <input
                            className={`form-control border-start-0 ${focusClass}`}
                            style={inputStyle}
                            placeholder="Street, building, area…"
                            value={form.address.street}
                            onChange={(e) => handleAddress("street", e.target.value)}
                          />
                        </div>
                      </Field>
                    </div>

                    <div className="col-md-3">
                      <Field label="City">
                        <input
                          className={`form-control ${focusClass}`}
                          style={inputStyle}
                          placeholder="City"
                          value={form.address.city}
                          onChange={(e) => handleAddress("city", e.target.value)}
                        />
                      </Field>
                    </div>

                    <div className="col-md-3">
                      <Field label="State">
                        <input
                          className={`form-control ${focusClass}`}
                          style={inputStyle}
                          placeholder="State"
                          value={form.address.state}
                          onChange={(e) => handleAddress("state", e.target.value)}
                        />
                      </Field>
                    </div>

                    <div className="col-md-3">
                      <Field label="Pincode">
                        <input
                          className={`form-control ${focusClass}`}
                          style={inputStyle}
                          placeholder="PIN"
                          value={form.address.pincode}
                          onChange={(e) => handleAddress("pincode", e.target.value)}
                          maxLength={6}
                        />
                      </Field>
                    </div>

                    <div className="col-md-3">
                      <Field label="Country">
                        <input
                          className={`form-control ${focusClass}`}
                          style={inputStyle}
                          placeholder="Country"
                          value={form.address.country}
                          onChange={(e) => handleAddress("country", e.target.value)}
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="wf-card-section">
                  <SectionLabel icon="📞" title="Contact Details" subtitle="Person responsible for this warehouse" />

                  <div className="row g-3">
                    <div className="col-md-6">
                      <Field label="Contact Person">
                        <div className="input-group">
                          <span className="input-group-text bg-transparent" style={{ borderColor: "#e0e2e9" }}>
                            <i className="bx bx-user text-muted" style={{ fontSize: 15 }} />
                          </span>
                          <input
                            className={`form-control border-start-0 ${focusClass}`}
                            style={inputStyle}
                            placeholder="Full name"
                            value={form.contactPerson || ""}
                            onChange={(e) => setForm((p) => ({ ...p, contactPerson: e.target.value }))}
                          />
                        </div>
                      </Field>
                    </div>

                    <div className="col-md-6">
                      <Field label="Contact Phone">
                        <div className="input-group">
                          <span className="input-group-text bg-transparent" style={{ borderColor: "#e0e2e9" }}>
                            <i className="bx bx-phone text-muted" style={{ fontSize: 15 }} />
                          </span>
                          <input
                            className={`form-control border-start-0 ${focusClass}`}
                            style={inputStyle}
                            placeholder="+91 XXXXX XXXXX"
                            value={form.contactPhone || ""}
                            onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                          />
                        </div>
                      </Field>
                    </div>
                  </div>
                </div>

              </div>

              {/* ─── RIGHT COLUMN ─── */}
              <div className="col-12 col-xl-4">

                {/* Status card */}
                <div className="wf-card-section mb-4">
                  <SectionLabel icon="⚙️" title="Settings" />

                  <div
                    className="rounded-3 p-3 d-flex align-items-center justify-content-between"
                    style={{
                      background: form.isActive ? "rgba(40,199,111,.07)" : "rgba(110,107,123,.07)",
                      border: `1px solid ${form.isActive ? "rgba(40,199,111,.2)" : "rgba(110,107,123,.2)"}`,
                      transition: "all .2s",
                    }}
                  >
                    <div>
                      <div className="fw-semibold" style={{ fontSize: 13.5 }}>
                        {form.isActive ? "Active" : "Inactive"}
                      </div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {form.isActive
                          ? "Warehouse is operational"
                          : "Warehouse is disabled"}
                      </div>
                    </div>
                    <div className="form-check form-switch mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        style={{ width: 40, height: 22, cursor: "pointer" }}
                        checked={form.isActive}
                        onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Help card */}
                <div
                  className="rounded-3 p-4"
                  style={{
                    background: "rgba(115,103,240,.05)",
                    border: "1px solid rgba(115,103,240,.15)",
                    fontSize: 12.5,
                    color: "#555",
                  }}
                >
                  <div className="fw-semibold mb-2" style={{ color: "#7367f0", fontSize: 13 }}>
                    <i className="bx bx-info-circle me-1" /> Tips
                  </div>
                  <ul className="mb-0 ps-3" style={{ lineHeight: 1.8 }}>
                    <li>Use a short, unique code (e.g. WH-01)</li>
                    <li>Pincode helps with logistics routing</li>
                    <li>Inactive warehouses won't appear in stock forms</li>
                    <li>Category helps group warehouses by type</li>
                  </ul>
                </div>

                {/* Form actions */}
                <div className="mt-4 d-flex flex-column gap-2">
                  {error && (
                    <div
                      className="rounded-3 p-3 d-flex align-items-start gap-2"
                      style={{
                        background: "rgba(234,84,85,.07)",
                        border: "1px solid rgba(234,84,85,.25)",
                        fontSize: 13,
                        color: "#c0392b",
                      }}
                    >
                      <i className="bx bx-error-circle mt-1 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary wf-save-btn w-100"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          style={{ width: 14, height: 14 }}
                        />
                        Saving…
                      </>
                    ) : (
                      <>
                        <i className={`bx ${id ? "bx-check" : "bx-plus"} me-1`} />
                        {id ? "Update Warehouse" : "Create Warehouse"}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100"
                    onClick={() => navigate(-1)}
                    disabled={saving}
                  >
                    <i className="bx bx-x me-1" />
                    Cancel
                  </button>
                </div>

              </div>
            </div>
          </form>
        )}
      </div>
    </>
  );
}