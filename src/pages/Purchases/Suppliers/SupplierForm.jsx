import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createSupplier,
  getSupplier,
  getSuppliers,
  updateSupplier,
} from "../../../lib/suppliersAPI";
import locations from "../../../data/locations.json";

/* ─────────────────────────────────────────────
   HELPERS (copied from ProductForm)
───────────────────────────────────────────── */
const Field = ({ label, required, children, hint, col = "col-12" }) => (
  <div className={col}>
    <label
      className="form-label mb-1"
      style={{
        fontSize: 12.5, fontWeight: 600, color: "#444",
        textTransform: "uppercase", letterSpacing: ".4px",
      }}
    >
      {label}{required && <span className="text-danger ms-1">*</span>}
    </label>
    {children}
    {hint && <div className="text-muted mt-1" style={{ fontSize: 11.5 }}>{hint}</div>}
  </div>
);

const SectionHead = ({ icon, title, subtitle }) => (
  <div
    className="d-flex align-items-center gap-2 mb-3"
    style={{ borderBottom: "1px solid #f0f1f5", paddingBottom: 10 }}
  >
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

/* ─────────────────────────────────────────────
   TOAST (copied from ProductForm)
───────────────────────────────────────────── */
const Toast = ({ message, type }) => {
  const meta = {
    success: { border: "#28c76f", icon: "✅" },
    error:   { border: "#ea5455", icon: "❌" },
  };
  const m = meta[type] || meta.error;
  return (
    <div style={{
      position: "fixed", top: 24, right: 24, zIndex: 9999,
      background: "#fff", borderRadius: 12,
      boxShadow: "0 8px 30px rgba(0,0,0,.14)",
      padding: "14px 20px",
      display: "flex", alignItems: "center", gap: 12,
      minWidth: 300, borderLeft: `4px solid ${m.border}`,
      animation: "sf-slidein .25s cubic-bezier(.34,1.56,.64,1)",
    }}>
      <span style={{ fontSize: 18 }}>{m.icon}</span>
      <span style={{ fontSize: 13.5, color: "#333", fontWeight: 500 }}>{message}</span>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function SupplierForm() {
  const navigate = useNavigate();
  const { id }   = useParams();

  const [form, setForm] = useState({
    code: "", name: "", contactPerson: "",
    email: "", phone: "", gstNumber: "",
    paymentTerms: "",
    street: "", city: "", state: "", pincode: "", country: "",
  });

  const states   = locations.states.map((s) => s.name);
  const [cities,   setCities]   = useState([]);
  const [pincodes, setPincodes] = useState([]);

  const [saving,      setSaving]      = useState(false);
  const [loadingForm, setLoadingForm] = useState(!!id);
  const [toast,       setToast]       = useState(null);
  const [error,       setError]       = useState("");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Location cascades ─────────────────────────────────── */
  useEffect(() => {
    if (form.state) {
      const stateData = locations.states.find((s) => s.name === form.state);
      setCities(stateData?.cities || []);
    }
    if (form.city) {
      const cityData = cities.find((c) => c.name === form.city);
      setPincodes(cityData?.pincodes || []);
    }
  }, [form.state, form.city, cities]);

  /* ── Load supplier for edit ────────────────────────────── */
  useEffect(() => {
    if (id) loadSupplier();
  }, [id]);

  const loadSupplier = async () => {
    try {
      setLoadingForm(true);
      const res = await getSupplier(id);
      if (!res.data.success) return;
      const sup = res.data.data;
      setForm({
        code:          sup.code          || "",
        name:          sup.name          || "",
        contactPerson: sup.contactPerson || "",
        email:         sup.email         || "",
        phone:         sup.phone         || "",
        gstNumber:     sup.gstNumber     || "",
        paymentTerms:  sup.paymentTerms  || "",
        street:        sup.address?.street  || "",
        city:          sup.address?.city    || "",
        state:         sup.address?.state   || "",
        pincode:       sup.address?.pincode || "",
        country:       sup.address?.country || "",
      });
    } catch (err) {
      console.error("Supplier load error", err);
      showToast("Failed to load supplier", "error");
    } finally {
      setLoadingForm(false);
    }
  };

  /* ── Auto-generate supplier code ───────────────────────── */
  const generateSupplierCode = async () => {
    try {
      const res = await getSuppliers();
      if (!res.data.success) return;
      const all = res.data.data;
      if (all.length === 0) {
        setForm((prev) => ({ ...prev, code: "SUP-001" }));
        return;
      }
      const maxNumber = Math.max(
        ...all.map((s) => parseInt((s.code || "SUP-000").split("-")[1]) || 0)
      );
      setForm((prev) => ({
        ...prev,
        code: `SUP-${String(maxNumber + 1).padStart(3, "0")}`,
      }));
    } catch (err) {
      console.error("Code generation error", err);
    }
  };

  useEffect(() => {
    if (!id) generateSupplierCode();
  }, [id]);

  /* ── Input change ──────────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "state") {
      setForm((prev) => ({ ...prev, state: value, city: "", pincode: "" }));
    } else if (name === "city") {
      const cityData = cities.find((c) => c.name === value);
      setForm((prev) => ({
        ...prev,
        city: value,
        pincode: cityData?.pincodes?.[0] || "",
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  /* ── Submit ────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        code:          form.code,
        name:          form.name,
        contactPerson: form.contactPerson,
        email:         form.email,
        phone:         form.phone,
        gstNumber:     form.gstNumber,
        paymentTerms:  form.paymentTerms,
        address: {
          street:  form.street,
          city:    form.city,
          state:   form.state,
          pincode: form.pincode,
          country: form.country,
        },
      };
      if (id) await updateSupplier(id, payload);
      else    await createSupplier(payload);
      showToast(id ? "Supplier updated successfully!" : "Supplier created successfully!", "success");
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      console.error(err.response?.data || err);
      const msg = err.response?.data?.error || "Error saving supplier";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  /* shared styles */
  const inp = { fontSize: 13.5, borderColor: "#e0e2e9" };
  const fc  = "sf-inp";

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @keyframes sf-slidein { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes sf-fadein  { from{opacity:0;transform:translateY(6px)}  to{opacity:1;transform:translateY(0)} }
        .sf-inp:focus { border-color:#7367f0!important; box-shadow:0 0 0 .18rem rgba(115,103,240,.2)!important; }
        .sf-section     { background:#fff;    border-radius:12px; border:1px solid #eef0f6; padding:24px; animation:sf-fadein .22s ease; }
        .sf-section-alt { background:#fafbff; border-radius:12px; border:1px solid #eef0f6; padding:24px; animation:sf-fadein .22s ease; }
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
              {id ? "Edit Supplier" : "Add Supplier"}
            </h4>
            <p className="text-muted mb-0" style={{ fontSize: 12.5 }}>
              {id
                ? "Update supplier info, contact and address"
                : "Fill in details to add a new supplier to your directory"}
            </p>
          </div>
        </div>

        {/* ── LOADING ── */}
        {loadingForm ? (
          <div className="sf-section text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-3 mb-0" style={{ fontSize: 13 }}>Loading supplier…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="row g-4">

              {/* ════ LEFT COLUMN ════ */}
              <div className="col-12 col-xl-8">

                {/* ── Basic Info ── */}
                <div className="sf-section mb-4">
                  <SectionHead
                    icon="🏭"
                    title="Supplier Information"
                    subtitle="Name, code, GST and payment terms"
                  />
                  <div className="row g-3">

                    <Field label="Supplier Name" required col="col-md-8">
                      <input
                        name="name" value={form.name} onChange={handleChange}
                        className={`form-control ${fc}`} style={inp}
                        placeholder="Full supplier / company name" required
                      />
                    </Field>

                    <Field label="Supplier Code" col="col-md-4" hint="Auto-generated, read-only">
                      <div className="input-group">
                        <span className="input-group-text bg-transparent" style={{ borderColor: "#e0e2e9" }}>
                          <i className="bx bx-barcode text-muted" style={{ fontSize: 16 }} />
                        </span>
                        <input
                          name="code" value={form.code}
                          className={`form-control border-start-0 ${fc}`}
                          style={{ ...inp, fontFamily: "monospace", textTransform: "uppercase" }}
                          disabled
                        />
                      </div>
                    </Field>

                    <Field label="GST Number" col="col-md-6" hint="15-digit GSTIN">
                      <input
                        name="gstNumber" value={form.gstNumber} onChange={handleChange}
                        className={`form-control ${fc}`}
                        style={{ ...inp, fontFamily: "monospace", textTransform: "uppercase" }}
                        placeholder="e.g. 22AAAAA0000A1Z5"
                      />
                    </Field>

                    <Field label="Payment Terms" required col="col-md-6">
                      <select
                        name="paymentTerms" value={form.paymentTerms} onChange={handleChange}
                        className={`form-select ${fc}`} style={inp} required
                      >
                        <option value="">Select payment terms</option>
                        {["NET-5","NET-10","NET-15","NET-20","NET-25","NET-30","NET-35","NET-40","NET-45","NET-50"].map((t) => (
                          <option key={t} value={t}>{t.replace("-", " ")}</option>
                        ))}
                      </select>
                    </Field>

                  </div>
                </div>

                {/* ── Contact Info ── */}
                <div className="sf-section-alt mb-4">
                  <SectionHead
                    icon="👤"
                    title="Contact Details"
                    subtitle="Person, email and phone"
                  />
                  <div className="row g-3">

                    <Field label="Contact Person" required col="col-12">
                      <div className="input-group">
                        <span className="input-group-text bg-transparent" style={{ borderColor: "#e0e2e9" }}>
                          <i className="bx bx-user text-muted" style={{ fontSize: 16 }} />
                        </span>
                        <input
                          name="contactPerson" value={form.contactPerson} onChange={handleChange}
                          className={`form-control border-start-0 ${fc}`} style={inp}
                          placeholder="Full name of contact person" required
                        />
                      </div>
                    </Field>

                    <Field label="Email Address" col="col-md-6">
                      <div className="input-group">
                        <span className="input-group-text bg-transparent" style={{ borderColor: "#e0e2e9" }}>
                          <i className="bx bx-envelope text-muted" style={{ fontSize: 16 }} />
                        </span>
                        <input
                          type="email" name="email" value={form.email} onChange={handleChange}
                          className={`form-control border-start-0 ${fc}`} style={inp}
                          placeholder="contact@supplier.com"
                        />
                      </div>
                    </Field>

                    <Field label="Phone Number" required col="col-md-6">
                      <div className="input-group">
                        <span className="input-group-text bg-transparent" style={{ borderColor: "#e0e2e9" }}>
                          <i className="bx bx-phone text-muted" style={{ fontSize: 16 }} />
                        </span>
                        <input
                          name="phone" value={form.phone} onChange={handleChange}
                          className={`form-control border-start-0 ${fc}`} style={inp}
                          placeholder="+91 98765 43210" required
                        />
                      </div>
                    </Field>

                  </div>
                </div>

                {/* ── Address ── */}
                <div className="sf-section">
                  <SectionHead
                    icon="📍"
                    title="Address"
                    subtitle="Street, city, state and pincode"
                  />
                  <div className="row g-3">

                    <Field label="Country" col="col-md-4">
                      <input
                        name="country" value={form.country} onChange={handleChange}
                        className={`form-control ${fc}`} style={inp}
                        placeholder="e.g. India"
                      />
                    </Field>

                    <Field label="State" col="col-md-4">
                      <select
                        name="state" value={form.state || ""} onChange={handleChange}
                        className={`form-select ${fc}`} style={inp}
                      >
                        <option value="">Select State</option>
                        {states.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="City" col="col-md-4">
                      <select
                        name="city" value={form.city || ""} onChange={handleChange}
                        className={`form-select ${fc}`} style={inp}
                        disabled={!form.state}
                      >
                        <option value="">{form.state ? "Select City" : "Select state first"}</option>
                        {cities.map((c) => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Pincode" col="col-md-4">
                      <select
                        name="pincode" value={form.pincode || ""} onChange={handleChange}
                        className={`form-select ${fc}`} style={inp}
                        disabled={!form.city}
                      >
                        <option value="">{form.city ? "Select Pincode" : "Select city first"}</option>
                        {pincodes.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Street / Area" col="col-md-8">
                      <input
                        name="street" value={form.street} onChange={handleChange}
                        className={`form-control ${fc}`} style={inp}
                        placeholder="Building, street, locality"
                      />
                    </Field>

                  </div>
                </div>

              </div>

              {/* ════ RIGHT COLUMN ════ */}
              <div className="col-12 col-xl-4">

                {/* ── Summary (edit mode) ── */}
                {id && (
                  <div
                    className="rounded-3 p-4 mb-4"
                    style={{ background: "rgba(115,103,240,.05)", border: "1px solid rgba(115,103,240,.15)" }}
                  >
                    <div className="fw-semibold mb-3" style={{ fontSize: 13, color: "#7367f0" }}>
                      <i className="bx bx-info-circle me-1" /> Supplier Summary
                    </div>
                    <div className="d-flex flex-column gap-2" style={{ fontSize: 13 }}>
                      {[
                        { label: "Code",     value: form.code          || "—" },
                        { label: "GST",      value: form.gstNumber     || "—" },
                        { label: "Terms",    value: form.paymentTerms  || "—" },
                        { label: "State",    value: form.state         || "—" },
                        { label: "City",     value: form.city          || "—" },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="d-flex justify-content-between align-items-center"
                          style={{ borderBottom: "1px dashed #e8eaf0", paddingBottom: 6 }}
                        >
                          <span className="text-muted">{label}</span>
                          <span
                            className="fw-semibold"
                            style={{ fontFamily: label === "Code" || label === "GST" ? "monospace" : "inherit", fontSize: label === "Code" ? 12 : 13 }}
                          >
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Tips ── */}
                <div
                  className="rounded-3 p-4 mb-4"
                  style={{ background: "#f8f9fc", border: "1px solid #eef0f6", fontSize: 12.5, color: "#555" }}
                >
                  <div className="fw-semibold mb-2" style={{ color: "#444", fontSize: 13 }}>
                    <i className="bx bx-bulb me-1 text-warning" /> Tips
                  </div>
                  <ul className="mb-0 ps-3" style={{ lineHeight: 1.9 }}>
                    <li>Supplier code is auto-generated and read-only</li>
                    <li>Select state first to load available cities</li>
                    <li>Select city to auto-fill the first pincode</li>
                    <li>GST number must be a valid 15-character GSTIN</li>
                    <li>Payment terms affect purchase order due dates</li>
                  </ul>
                </div>

                {/* ── Error ── */}
                {error && (
                  <div
                    className="rounded-3 p-3 mb-3 d-flex align-items-start gap-2"
                    style={{
                      background: "rgba(234,84,85,.07)",
                      border: "1px solid rgba(234,84,85,.25)",
                      fontSize: 13, color: "#c0392b",
                    }}
                  >
                    <i className="bx bx-error-circle mt-1 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* ── Actions ── */}
                <div className="d-flex flex-column gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    style={{ borderRadius: 10, fontWeight: 600 }}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" style={{ width: 14, height: 14 }} />
                        Saving…
                      </>
                    ) : (
                      <>
                        <i className={`bx ${id ? "bx-check" : "bx-plus"} me-1`} />
                        {id ? "Update Supplier" : "Create Supplier"}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100"
                    style={{ borderRadius: 10 }}
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