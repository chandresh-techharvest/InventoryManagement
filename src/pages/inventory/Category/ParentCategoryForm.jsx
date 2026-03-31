import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createParentCategory, updateParentCategory, getParentCategory } from "../../../lib/parentCategoryAPI";

const Toast = ({ message, type }) => {
  const meta = { success: { border: "#28c76f", icon: "✅" }, error: { border: "#ea5455", icon: "❌" } };
  const m = meta[type] || meta.error;
  return (
    <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, background: "#fff", borderRadius: 12,
      boxShadow: "0 8px 30px rgba(0,0,0,.14)", padding: "14px 20px", display: "flex", alignItems: "center",
      gap: 12, minWidth: 300, borderLeft: `4px solid ${m.border}`,
      animation: "pf-slidein .25s cubic-bezier(.34,1.56,.64,1)" }}>
      <span style={{ fontSize: 18 }}>{m.icon}</span>
      <span style={{ fontSize: 13.5, color: "#333", fontWeight: 500 }}>{message}</span>
    </div>
  );
};

const Field = ({ label, required, children, hint }) => (
  <div>
    <label className="form-label mb-1" style={{ fontSize: 12.5, fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: ".4px" }}>
      {label}{required && <span className="text-danger ms-1">*</span>}
    </label>
    {children}
    {hint && <div className="text-muted mt-1" style={{ fontSize: 11.5 }}>{hint}</div>}
  </div>
);

export default function ParentCategoryForm() {
  const { id }   = useParams();
  const navigate = useNavigate();

  /* original state unchanged */
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");

  /* UI-only */
  const [saving, setSaving]           = useState(false);
  const [loadingForm, setLoadingForm] = useState(!!id);
  const [toast, setToast]             = useState(null);
  const [error, setError]             = useState("");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => { if (id) loadParentCategory(); }, [id]);

  const loadParentCategory = async () => {
    try {
      setLoadingForm(true);
      const res = await getParentCategory(id);
      const cat = res.data.data;
      setName(cat?.name || "");
      setDescription(cat?.description || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingForm(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setSaving(true);
    try {
      if (id) await updateParentCategory(id, { name, description });
      else    await createParentCategory({ name, description });
      showToast(id ? "Parent category updated!" : "Parent category created!", "success");
      setTimeout(() => navigate("../"), 1200);
    } catch (err) {
      console.error("Parent category error:", err.response?.data);
      const msg = err.response?.data?.error || "Failed to save";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const inp = { fontSize: 13.5, borderColor: "#e0e2e9" };
  const fc  = "pcf-inp";

  return (
    <>
      <style>{`
        @keyframes pf-slidein { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pf-fadein  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .pcf-inp:focus { border-color:#7367f0!important;box-shadow:0 0 0 .18rem rgba(115,103,240,.2)!important; }
        .pcf-section { background:#fff;border-radius:12px;border:1px solid #eef0f6;padding:24px;animation:pf-fadein .22s ease; }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="container-xxl flex-grow-1 container-p-y">

        <div className="d-flex align-items-center gap-2 mb-4">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => navigate(-1)}
            style={{ width: 34, height: 34, padding: 0, borderRadius: 8, flexShrink: 0 }}>
            <i className="bx bx-arrow-back" style={{ fontSize: 16 }} />
          </button>
          <div>
            <h4 className="fw-bold mb-0" style={{ lineHeight: 1.2 }}>
              <i className={`bx ${id ? "bx-edit" : "bx-plus-circle"} me-2 text-primary`} />
              {id ? "Edit Parent Category" : "Add Parent Category"}
            </h4>
            <p className="text-muted mb-0" style={{ fontSize: 12.5 }}>
              {id ? "Update this top-level category group" : "Create a new top-level category group"}
            </p>
          </div>
        </div>

        {loadingForm ? (
          <div className="pcf-section text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-3 mb-0" style={{ fontSize: 13 }}>Loading category…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="row g-4">

              {/* LEFT */}
              <div className="col-12 col-xl-8">
                <div className="pcf-section">
                  <div className="d-flex align-items-center gap-2 mb-3" style={{ borderBottom: "1px solid #f0f1f5", paddingBottom: 10 }}>
                    <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 30, height: 30, background: "rgba(115,103,240,.1)", fontSize: 15 }}>📁</div>
                    <div>
                      <div className="fw-semibold text-dark" style={{ fontSize: 13.5 }}>Category Details</div>
                      <div className="text-muted" style={{ fontSize: 11.5 }}>Name and description of this parent group</div>
                    </div>
                  </div>
                  <div className="row g-3">
                    <div className="col-12">
                      <Field label="Category Name" required hint="Must be unique across all parent categories">
                        <div className="input-group">
                          <span className="input-group-text bg-transparent" style={{ borderColor: "#e0e2e9" }}>
                            <i className="bx bx-folder text-muted" style={{ fontSize: 16 }} />
                          </span>
                          <input className={`form-control border-start-0 ${fc}`} style={inp}
                            value={name} onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Food & Beverages, Electronics…" required />
                        </div>
                      </Field>
                    </div>
                    <div className="col-12">
                      <Field label="Description" hint="Optional — helps team members understand this group">
                        <textarea className={`form-control ${fc}`} style={{ ...inp, resize: "none" }} rows={4}
                          value={description} onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describe what kinds of sub-categories belong here…" />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="col-12 col-xl-4">

                {/* Preview */}
                <div className="pcf-section mb-4">
                  <div className="d-flex align-items-center gap-2 mb-3" style={{ borderBottom: "1px solid #f0f1f5", paddingBottom: 10 }}>
                    <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 30, height: 30, background: "rgba(115,103,240,.1)", fontSize: 15 }}>👁️</div>
                    <div className="fw-semibold text-dark" style={{ fontSize: 13.5 }}>Preview</div>
                  </div>
                  <div className="d-flex align-items-center gap-3 p-3 rounded-3"
                    style={{ background: "#f8f9fc", border: "1px solid #eef0f6" }}>
                    <div className="rounded-2 d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                      style={{ width: 42, height: 42, fontSize: 14, background: "rgba(115,103,240,.12)", color: "#7367f0" }}>
                      {name ? name.slice(0, 2).toUpperCase() : "PC"}
                    </div>
                    <div className="overflow-hidden">
                      <div className="fw-semibold text-dark text-truncate" style={{ fontSize: 14 }}>
                        {name || <span className="text-muted">Category name…</span>}
                      </div>
                      <div className="text-muted text-truncate" style={{ fontSize: 12 }}>
                        {description || "No description"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="rounded-3 p-4 mb-4"
                  style={{ background: "rgba(115,103,240,.05)", border: "1px solid rgba(115,103,240,.15)", fontSize: 12.5, color: "#555" }}>
                  <div className="fw-semibold mb-2" style={{ color: "#7367f0", fontSize: 13 }}>
                    <i className="bx bx-info-circle me-1" /> Tips
                  </div>
                  <ul className="mb-0 ps-3" style={{ lineHeight: 1.9 }}>
                    <li>Parent names should be broad groups</li>
                    <li>Sub-categories are assigned to parents</li>
                    <li>Use clear, descriptive names</li>
                    <li>Description helps other team members</li>
                  </ul>
                </div>

                {error && (
                  <div className="rounded-3 p-3 mb-3 d-flex align-items-start gap-2"
                    style={{ background: "rgba(234,84,85,.07)", border: "1px solid rgba(234,84,85,.25)", fontSize: 13, color: "#c0392b" }}>
                    <i className="bx bx-error-circle mt-1 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="d-flex flex-column gap-2">
                  <button type="submit" className="btn btn-primary w-100" style={{ borderRadius: 10, fontWeight: 600 }}
                    disabled={saving || !name.trim()}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2" style={{ width: 14, height: 14 }} />Saving…</>
                      : <><i className={`bx ${id ? "bx-check" : "bx-plus"} me-1`} />{id ? "Update Category" : "Create Category"}</>}
                  </button>
                  <button type="button" className="btn btn-outline-secondary w-100" style={{ borderRadius: 10 }}
                    onClick={() => navigate(-1)} disabled={saving}>
                    <i className="bx bx-x me-1" />Cancel
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