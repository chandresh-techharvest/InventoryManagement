import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCategory, updateCategory, createCategory } from "../../../lib/categoryAPI";
import { getParentCategories } from "../../../lib/parentCategoryAPI";

/* ─── Toast ──────────────────────────────────── */
const Toast = ({ message, type }) => {
  const meta = {
    success: { border: "#28c76f", icon: "✅" },
    error:   { border: "#ea5455", icon: "❌" },
  };
  const m = meta[type] || meta.error;
  return (
    <div style={{
      position: "fixed", top: 24, right: 24, zIndex: 9999,
      background: "#fff", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,.14)",
      padding: "14px 20px", display: "flex", alignItems: "center", gap: 12,
      minWidth: 300, borderLeft: `4px solid ${m.border}`,
      animation: "cf-slidein .25s cubic-bezier(.34,1.56,.64,1)",
    }}>
      <span style={{ fontSize: 18 }}>{m.icon}</span>
      <span style={{ fontSize: 13.5, color: "#333", fontWeight: 500 }}>{message}</span>
    </div>
  );
};

/* ─── Field wrapper ──────────────────────────── */
const Field = ({ label, required, children, hint }) => (
  <div>
    <label className="form-label mb-1" style={{ fontSize: 12.5, fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: ".4px" }}>
      {label}{required && <span className="text-danger ms-1">*</span>}
    </label>
    {children}
    {hint && <div className="text-muted mt-1" style={{ fontSize: 11.5 }}>{hint}</div>}
  </div>
);

/* ─── Main ───────────────────────────────────── */
export default function CategoryForm() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = Boolean(id);

  /* ── original state unchanged ── */
  const [form, setForm] = useState({
    name: "", description: "", parentCategoryId: "", isActive: true,
  });
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading]             = useState(false);

  /* UI-only */
  const [loadingForm, setLoadingForm] = useState(isEdit);
  const [toast, setToast]             = useState(null);
  const [error, setError]             = useState("");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── original logic unchanged ── */
  const loadCategories = async () => {
    const res = await getParentCategories();
    if (res.data.success) setAllCategories(res.data.data);
  };

  const loadCategory = async () => {
    try {
      setLoadingForm(true);
      const res = await getCategory(id);
      if (res.data.success) {
        const c = res.data.data;
        setForm({
          name: c.name || "",
          description: c.description || "",
          parentCategoryId: typeof c.parentCategoryId === "object"
            ? c.parentCategoryId?._id
            : c.parentCategoryId || "",
          isActive: c.isActive ?? true,
        });
      }
    } catch (err) {
      console.error("Error loading category", err);
    } finally {
      setLoadingForm(false);
    }
  };

  useEffect(() => {
    loadCategories();
    if (isEdit) loadCategory();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isEdit) await updateCategory(id, form);
      else        await createCategory(form);
      showToast(isEdit ? "Category updated successfully!" : "Category created successfully!", "success");
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Error saving category";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  /* shared styles */
  const inp = { fontSize: 13.5, borderColor: "#e0e2e9" };
  const fc  = "cf-inp";

  return (
    <>
      <style>{`
        @keyframes cf-slidein { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes cf-fadein  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .cf-inp:focus { border-color:#7367f0!important;box-shadow:0 0 0 .18rem rgba(115,103,240,.2)!important; }
        .cf-section { background:#fff;border-radius:12px;border:1px solid #eef0f6;padding:24px;animation:cf-fadein .22s ease; }
        .cf-section-alt { background:#fafbff;border-radius:12px;border:1px solid #eef0f6;padding:24px;animation:cf-fadein .22s ease; }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="container-xxl flex-grow-1 container-p-y">

        {/* ── Header ── */}
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
              <i className={`bx ${isEdit ? "bx-edit" : "bx-plus-circle"} me-2 text-primary`} />
              {isEdit ? "Edit Category" : "Add Category"}
            </h4>
            <p className="text-muted mb-0" style={{ fontSize: 12.5 }}>
              {isEdit ? "Update sub-category details" : "Create a new sub-category under a parent group"}
            </p>
          </div>
        </div>

        {/* ── Loading skeleton ── */}
        {loadingForm ? (
          <div className="cf-section text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-3 mb-0" style={{ fontSize: 13 }}>Loading category…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="row g-4">

              {/* ════ LEFT ════ */}
              <div className="col-12 col-xl-8">

                {/* Basic Info */}
                <div className="cf-section mb-4">
                  <div className="d-flex align-items-center gap-2 mb-3" style={{ borderBottom: "1px solid #f0f1f5", paddingBottom: 10 }}>
                    <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 30, height: 30, background: "rgba(115,103,240,.1)", fontSize: 15 }}>🗂️</div>
                    <div>
                      <div className="fw-semibold text-dark" style={{ fontSize: 13.5 }}>Category Details</div>
                      <div className="text-muted" style={{ fontSize: 11.5 }}>Name, parent group and description</div>
                    </div>
                  </div>

                  <div className="row g-3">

                    <div className="col-md-6">
                      <Field label="Category Name" required>
                        <input
                          type="text"
                          name="name"
                          className={`form-control ${fc}`}
                          style={inp}
                          value={form.name}
                          onChange={handleChange}
                          placeholder="e.g. Beverages, Electronics…"
                          required
                        />
                      </Field>
                    </div>

                    <div className="col-md-6">
                      <Field label="Parent Category" hint="Group this category belongs to">
                        <select
                          name="parentCategoryId"
                          className={`form-select ${fc}`}
                          style={inp}
                          value={form.parentCategoryId}
                          onChange={handleChange}
                        >
                          <option value="">None / Top-Level</option>
                          {allCategories
                            .filter((c) => c._id !== id)
                            .map((c) => (
                              <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                      </Field>
                    </div>

                    <div className="col-12">
                      <Field label="Description" hint="Optional — helps identify the category">
                        <textarea
                          name="description"
                          rows={3}
                          className={`form-control ${fc}`}
                          style={{ ...inp, resize: "none" }}
                          value={form.description}
                          onChange={handleChange}
                          placeholder="Describe what products belong to this category…"
                        />
                      </Field>
                    </div>

                  </div>
                </div>

              </div>

              {/* ════ RIGHT ════ */}
              <div className="col-12 col-xl-4">

                {/* Status toggle */}
                <div className="cf-section mb-4">
                  <div className="d-flex align-items-center gap-2 mb-3" style={{ borderBottom: "1px solid #f0f1f5", paddingBottom: 10 }}>
                    <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 30, height: 30, background: "rgba(115,103,240,.1)", fontSize: 15 }}>⚙️</div>
                    <div className="fw-semibold text-dark" style={{ fontSize: 13.5 }}>Settings</div>
                  </div>

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
                        {form.isActive ? "Visible in product forms" : "Hidden from selections"}
                      </div>
                    </div>
                    <div className="form-check form-switch mb-0">
                      <input
                        type="checkbox"
                        name="isActive"
                        className="form-check-input"
                        style={{ width: 40, height: 22, cursor: "pointer" }}
                        checked={form.isActive}
                        onChange={handleChange}
                      />
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
                    <li>Assign a parent to group related categories</li>
                    <li>Inactive categories won't appear in product forms</li>
                    <li>Category name should be clear and unique</li>
                  </ul>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-3 p-3 mb-3 d-flex align-items-start gap-2"
                    style={{ background: "rgba(234,84,85,.07)", border: "1px solid rgba(234,84,85,.25)", fontSize: 13, color: "#c0392b" }}>
                    <i className="bx bx-error-circle mt-1 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="d-flex flex-column gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    style={{ borderRadius: 10, fontWeight: 600 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" style={{ width: 14, height: 14 }} />Saving…</>
                    ) : (
                      <><i className={`bx ${isEdit ? "bx-check" : "bx-plus"} me-1`} />
                        {isEdit ? "Update Category" : "Create Category"}</>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100"
                    style={{ borderRadius: 10 }}
                    onClick={() => navigate(-1)}
                    disabled={loading}
                  >
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