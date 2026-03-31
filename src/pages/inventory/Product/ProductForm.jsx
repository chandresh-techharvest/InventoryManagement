import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createProduct, getProduct, updateProduct } from "../../../lib/productApi";
import { getParentCategories } from "../../../lib/parentCategoryAPI";
import api from "../../../lib/api";

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const Field = ({ label, required, children, hint, col = "col-12" }) => (
  <div className={col}>
    <label className="form-label mb-1" style={{ fontSize: 12.5, fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: ".4px" }}>
      {label}{required && <span className="text-danger ms-1">*</span>}
    </label>
    {children}
    {hint && <div className="text-muted mt-1" style={{ fontSize: 11.5 }}>{hint}</div>}
  </div>
);

const SectionHead = ({ icon, title, subtitle, action }) => (
  <div className="d-flex align-items-center justify-content-between mb-3" style={{ borderBottom: "1px solid #f0f1f5", paddingBottom: 10 }}>
    <div className="d-flex align-items-center gap-2">
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
    {action}
  </div>
);

/* ─────────────────────────────────────────────
   TOAST
───────────────────────────────────────────── */
const Toast = ({ message, type }) => {
  const meta = { success: { border: "#28c76f", icon: "✅" }, error: { border: "#ea5455", icon: "❌" } };
  const m = meta[type] || meta.error;
  return (
    <div style={{
      position: "fixed", top: 24, right: 24, zIndex: 9999,
      background: "#fff", borderRadius: 12,
      boxShadow: "0 8px 30px rgba(0,0,0,.14)",
      padding: "14px 20px",
      display: "flex", alignItems: "center", gap: 12,
      minWidth: 300, borderLeft: `4px solid ${m.border}`,
      animation: "pf-slidein .25s cubic-bezier(.34,1.56,.64,1)",
    }}>
      <span style={{ fontSize: 18 }}>{m.icon}</span>
      <span style={{ fontSize: 13.5, color: "#333", fontWeight: 500 }}>{message}</span>
    </div>
  );
};

/* ─────────────────────────────────────────────
   VARIANT CARD COLORS (cycles)
───────────────────────────────────────────── */
const VARIANT_COLORS = ["#7367f0", "#28c76f", "#00cfe8", "#ff9f43", "#ea5455", "#82868b"];

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function ProductForm() {
  const navigate  = useNavigate();
  const { id }    = useParams();

  /* ── all original state unchanged ── */
  const [categories, setCategories]           = useState([]);
  const [parentCategories, setParentCategories] = useState([]);

  const [form, setForm] = useState({
    sku: "", name: "", description: "",
    parentCategoryId: "", categoryId: "",
    brand: "", uom: "PCS", taxRate: 0, isActive: true,
    variants: [{ attributes: [{ key: "", value: "" }], price: "", cost: "" }],
  });

  /* UI-only state */
  const [saving, setSaving]         = useState(false);
  const [loadingForm, setLoadingForm] = useState(!!id);
  const [toast, setToast]           = useState(null);
  const [error, setError]           = useState("");
  const [expandedVariants, setExpandedVariants] = useState(new Set([0]));

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const toggleVariant = (idx) => {
    setExpandedVariants((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  /* ── all original logic unchanged ── */
  useEffect(() => {
    loadParentCategories();
    if (id) loadProduct();
  }, [id]);

  const loadParentCategories = async () => {
    try {
      const res = await getParentCategories();
      if (res.data.success) setParentCategories(res.data.data);
    } catch (err) {
      console.error("Parent categories load error", err);
    }
  };

  const loadCategories = async (parentId) => {
    try {
      if (!parentId) { setCategories([]); return; }
      const res = await api.get(`/categories?parentCategoryId=${parentId}`);
      if (res.data.success) setCategories(res.data.data);
    } catch (err) {
      console.error("Categories load error", err);
    }
  };

  const loadProduct = async () => {
    try {
      setLoadingForm(true);
      const res = await getProduct(id);
      if (!res.data.success) return;
      const p = res.data.data;
      const parentId = p.categoryId?.parentCategoryId || "";
      if (parentId) await loadCategories(parentId);
      setForm({
        ...p,
        isActive: p.isActive ?? true,
        parentCategoryId: parentId,
        categoryId: p.categoryId?._id || "",
        variants:
          p.variants?.map((v) => ({
            ...v,
            attributes: Object.entries(v.attributes || {}).map(([k, val]) => ({ key: k, value: val })),
          })) || [{ attributes: [{ key: "", value: "" }], price: "", cost: "" }],
      });
      setExpandedVariants(new Set(p.variants?.map((_, i) => i) || [0]));
    } catch (err) {
      console.error("Product load error", err);
    } finally {
      setLoadingForm(false);
    }
  };

  const handleParentChange = (e) => {
    const parentId = e.target.value;
    setForm((prev) => ({ ...prev, parentCategoryId: parentId, categoryId: "" }));
    loadCategories(parentId);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleVariantChange = (vIndex, field, value) => {
    const updated = [...form.variants];
    updated[vIndex][field] = value;
    setForm({ ...form, variants: updated });
  };

  const addVariant = () => {
    const newIdx = form.variants.length;
    setForm({
      ...form,
      variants: [...form.variants, { attributes: [{ key: "", value: "" }], price: "", cost: "" }],
    });
    setExpandedVariants((prev) => new Set([...prev, newIdx]));
  };

  const removeVariant = (vIndex) => {
    setForm({ ...form, variants: form.variants.filter((_, i) => i !== vIndex) });
    setExpandedVariants((prev) => {
      const next = new Set();
      prev.forEach((idx) => { if (idx < vIndex) next.add(idx); else if (idx > vIndex) next.add(idx - 1); });
      return next;
    });
  };

  const handleAttributeChange = (vIndex, aIndex, field, value) => {
    const updated = [...form.variants];
    updated[vIndex].attributes[aIndex][field] = value;
    setForm({ ...form, variants: updated });
  };

  const addAttribute = (vIndex) => {
    const updated = [...form.variants];
    updated[vIndex].attributes.push({ key: "", value: "" });
    setForm({ ...form, variants: updated });
  };

  const removeAttribute = (vIndex, aIndex) => {
    const updated = [...form.variants];
    updated[vIndex].attributes.splice(aIndex, 1);
    setForm({ ...form, variants: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        taxRate: Number(form.taxRate),
        variants: form.variants.map((v) => ({
          attributes: Object.fromEntries(
            v.attributes.filter((a) => a.key).map((a) => [a.key, a.value])
          ),
          price: Number(v.price),
          cost:  Number(v.cost),
        })),
      };
      if (id) await updateProduct(id, payload);
      else    await createProduct(payload);
      showToast(id ? "Product updated successfully!" : "Product created successfully!", "success");
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      console.error(err.response?.data || err);
      const msg = err.response?.data?.error || "Error saving product";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  /* shared input style */
  const inp = { fontSize: 13.5, borderColor: "#e0e2e9" };
  const fc  = "pf-inp";

  /* ── RENDER ── */
  return (
    <>
      <style>{`
        @keyframes pf-slidein { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pf-fadein  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pf-vslide  { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .pf-inp:focus { border-color:#7367f0!important; box-shadow:0 0 0 .18rem rgba(115,103,240,.2)!important; }
        .pf-section { background:#fff;border-radius:12px;border:1px solid #eef0f6;padding:24px; animation:pf-fadein .22s ease; }
        .pf-section-alt { background:#fafbff;border-radius:12px;border:1px solid #eef0f6;padding:24px; animation:pf-fadein .22s ease; }
        .pf-variant { border-radius:12px;overflow:hidden;border:1px solid #e8eaf0;margin-bottom:16px;animation:pf-vslide .2s ease; }
        .pf-variant-header { padding:12px 18px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;transition:background .15s; }
        .pf-variant-header:hover { filter:brightness(.97); }
        .pf-variant-body { padding:20px;background:#fff;border-top:1px solid rgba(255,255,255,.2); }
        .pf-attr-row { display:flex;gap:8px;align-items:center;margin-bottom:8px;animation:pf-fadein .15s ease; }
        .pf-remove-btn { width:32px;height:32px;padding:0;border-radius:8px;flex-shrink:0;
          display:flex;align-items:center;justify-content:center;font-size:14px;transition:all .15s; }
        .pf-remove-btn:hover { transform:scale(1.1); }
        .pf-chevron { transition:transform .2s; font-size:16px; }
        .pf-chevron.open { transform:rotate(90deg); }
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
              {id ? "Edit Product" : "Add Product"}
            </h4>
            <p className="text-muted mb-0" style={{ fontSize: 12.5 }}>
              {id ? "Update product info, variants and pricing" : "Fill in details to add a new product to your catalogue"}
            </p>
          </div>
        </div>

        {/* ── LOADING ── */}
        {loadingForm ? (
          <div className="pf-section text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-3 mb-0" style={{ fontSize: 13 }}>Loading product…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="row g-4">

              {/* ════ LEFT COLUMN ════ */}
              <div className="col-12 col-xl-8">

                {/* ── Basic Info ── */}
                <div className="pf-section mb-4">
                  <SectionHead icon="📦" title="Basic Information" subtitle="Name, SKU, brand and description" />
                  <div className="row g-3">

                    <Field label="SKU" required col="col-md-4"
                      hint="Unique stock-keeping unit identifier">
                      <div className="input-group">
                        <span className="input-group-text bg-transparent" style={{ borderColor: "#e0e2e9" }}>
                          <i className="bx bx-barcode text-muted" style={{ fontSize: 16 }} />
                        </span>
                        <input name="sku" value={form.sku} onChange={handleChange}
                          className={`form-control border-start-0 ${fc}`}
                          style={{ ...inp, fontFamily: "monospace", textTransform: "uppercase" }}
                          placeholder="e.g. PROD-001" required />
                      </div>
                    </Field>

                    <Field label="Product Name" required col="col-md-5">
                      <input name="name" value={form.name} onChange={handleChange}
                        className={`form-control ${fc}`} style={inp}
                        placeholder="Full product name" required />
                    </Field>

                    <Field label="Brand" col="col-md-3">
                      <input name="brand" value={form.brand} onChange={handleChange}
                        className={`form-control ${fc}`} style={inp}
                        placeholder="Brand name" />
                    </Field>

                    <Field label="Description" col="col-12">
                      <textarea name="description" value={form.description} onChange={handleChange}
                        className={`form-control ${fc}`} style={{ ...inp, resize: "none" }}
                        rows={3} placeholder="Optional: describe the product…" />
                    </Field>

                  </div>
                </div>

                {/* ── Category ── */}
                <div className="pf-section-alt mb-4">
                  <SectionHead icon="🗂️" title="Classification" subtitle="Category and measurement unit" />
                  <div className="row g-3">

                    <Field label="Parent Category" required col="col-md-6">
                      <select name="parentCategoryId" value={form.parentCategoryId}
                        onChange={handleParentChange}
                        className={`form-select ${fc}`} style={inp} required>
                        <option value="">Select parent category</option>
                        {parentCategories.map((p) => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Sub-Category" required col="col-md-6">
                      <select name="categoryId" value={form.categoryId}
                        onChange={handleChange}
                        className={`form-select ${fc}`} style={inp} required
                        disabled={!form.parentCategoryId}>
                        <option value="">
                          {form.parentCategoryId ? "Select category" : "Select parent first"}
                        </option>
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Unit of Measure (UOM)" col="col-md-3" hint="e.g. PCS, KG, LTR">
                      <input name="uom" value={form.uom} onChange={handleChange}
                        className={`form-control ${fc}`} style={{ ...inp, textTransform: "uppercase", fontFamily: "monospace" }} />
                    </Field>

                    <Field label="Tax Rate (%)" col="col-md-3">
                      <div className="input-group">
                        <input type="number" name="taxRate" value={form.taxRate} onChange={handleChange}
                          className={`form-control ${fc}`} style={inp}
                          min={0} max={100} step={0.01} />
                        <span className="input-group-text bg-transparent" style={{ borderColor: "#e0e2e9", color: "#7367f0", fontWeight: 700 }}>%</span>
                      </div>
                    </Field>

                  </div>
                </div>

                {/* ── Variants ── */}
                <div className="pf-section">
                  <SectionHead
                    icon="🔀"
                    title="Variants"
                    subtitle={`${form.variants.length} variant${form.variants.length !== 1 ? "s" : ""} defined`}
                    action={
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        style={{ fontSize: 12, borderRadius: 8 }}
                        onClick={addVariant}
                      >
                        <i className="bx bx-plus me-1" />
                        Add Variant
                      </button>
                    }
                  />

                  {form.variants.length === 0 && (
                    <div
                      className="text-center py-4 rounded-3"
                      style={{ border: "2px dashed #e0e2e9", color: "#aaa", fontSize: 13 }}
                    >
                      <i className="bx bx-layer d-block mb-1" style={{ fontSize: 28 }} />
                      No variants yet. Click "Add Variant" to begin.
                    </div>
                  )}

                  {form.variants.map((v, vi) => {
                    const color   = VARIANT_COLORS[vi % VARIANT_COLORS.length];
                    const isOpen  = expandedVariants.has(vi);
                    const attrStr = v.attributes.filter((a) => a.key).map((a) => `${a.key}: ${a.value}`).join(" · ") || "No attributes";

                    return (
                      <div key={vi} className="pf-variant">
                        {/* variant header */}
                        <div
                          className="pf-variant-header"
                          style={{ background: color + "12" }}
                          onClick={() => toggleVariant(vi)}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="rounded-2 d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                              style={{ width: 30, height: 30, background: color + "20", color, fontSize: 13 }}
                            >
                              V{vi + 1}
                            </div>
                            <div>
                              <div className="fw-semibold" style={{ fontSize: 13.5, color: "#333" }}>
                                Variant {vi + 1}
                              </div>
                              <div className="text-muted" style={{ fontSize: 11.5 }}>
                                {attrStr}
                                {v.price && <span className="ms-2" style={{ color }}>₹{v.price}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            {form.variants.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger pf-remove-btn"
                                title="Remove variant"
                                style={{ fontSize: 12, border: "none", background: "rgba(234,84,85,.1)", color: "#ea5455" }}
                                onClick={(e) => { e.stopPropagation(); removeVariant(vi); }}
                              >
                                <i className="bx bx-trash" />
                              </button>
                            )}
                            <i className={`bx bx-chevron-right pf-chevron ${isOpen ? "open" : ""}`} style={{ color: "#888" }} />
                          </div>
                        </div>

                        {/* variant body */}
                        {isOpen && (
                          <div className="pf-variant-body">

                            {/* Attributes */}
                            <div className="mb-4">
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <label className="form-label mb-0" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", color: "#555" }}>
                                  Attributes
                                </label>
                                <button
                                  type="button"
                                  className="btn btn-sm"
                                  style={{ fontSize: 11.5, color, background: color + "12", border: "none", borderRadius: 6, padding: "3px 10px" }}
                                  onClick={() => addAttribute(vi)}
                                >
                                  <i className="bx bx-plus me-1" />
                                  Add
                                </button>
                              </div>

                              {v.attributes.map((attr, ai) => (
                                <div key={ai} className="pf-attr-row">
                                  <input
                                    value={attr.key}
                                    onChange={(e) => handleAttributeChange(vi, ai, "key", e.target.value)}
                                    className={`form-control ${fc}`}
                                    style={{ ...inp, fontSize: 13 }}
                                    placeholder="Property (e.g. Color)"
                                  />
                                  <input
                                    value={attr.value}
                                    onChange={(e) => handleAttributeChange(vi, ai, "value", e.target.value)}
                                    className={`form-control ${fc}`}
                                    style={{ ...inp, fontSize: 13 }}
                                    placeholder="Value (e.g. Red)"
                                  />
                                  <button
                                    type="button"
                                    className="pf-remove-btn btn"
                                    style={{ background: "rgba(234,84,85,.08)", color: "#ea5455", border: "none" }}
                                    onClick={() => removeAttribute(vi, ai)}
                                    title="Remove attribute"
                                  >
                                    <i className="bx bx-x" style={{ fontSize: 16 }} />
                                  </button>
                                </div>
                              ))}

                              {v.attributes.length === 0 && (
                                <p className="text-muted mb-0" style={{ fontSize: 12 }}>No attributes. Click Add to define one.</p>
                              )}
                            </div>

                            {/* Price + Cost */}
                            <div className="row g-3">
                              <div className="col-6 col-md-4">
                                <label className="form-label mb-1" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", color: "#555" }}>
                                  Selling Price
                                </label>
                                <div className="input-group">
                                  <span className="input-group-text bg-transparent" style={{ borderColor: "#e0e2e9", color: "#28c76f", fontWeight: 700, fontSize: 13 }}>₹</span>
                                  <input
                                    type="number"
                                    value={v.price}
                                    onChange={(e) => handleVariantChange(vi, "price", e.target.value)}
                                    className={`form-control border-start-0 ${fc}`}
                                    style={{ ...inp, fontSize: 13 }}
                                    placeholder="0.00"
                                    min={0}
                                  />
                                </div>
                              </div>

                              <div className="col-6 col-md-4">
                                <label className="form-label mb-1" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", color: "#555" }}>
                                  Cost Price
                                </label>
                                <div className="input-group">
                                  <span className="input-group-text bg-transparent" style={{ borderColor: "#e0e2e9", color: "#ff9f43", fontWeight: 700, fontSize: 13 }}>₹</span>
                                  <input
                                    type="number"
                                    value={v.cost}
                                    onChange={(e) => handleVariantChange(vi, "cost", e.target.value)}
                                    className={`form-control border-start-0 ${fc}`}
                                    style={{ ...inp, fontSize: 13 }}
                                    placeholder="0.00"
                                    min={0}
                                  />
                                </div>
                              </div>

                              {/* Margin indicator */}
                              {v.price > 0 && v.cost > 0 && (
                                <div className="col-12 col-md-4 d-flex align-items-end">
                                  <div
                                    className="rounded-3 px-3 py-2 w-100"
                                    style={{
                                      background: v.price >= v.cost ? "rgba(40,199,111,.08)" : "rgba(234,84,85,.08)",
                                      border: `1px solid ${v.price >= v.cost ? "rgba(40,199,111,.2)" : "rgba(234,84,85,.2)"}`,
                                    }}
                                  >
                                    <div className="text-muted" style={{ fontSize: 11 }}>Margin</div>
                                    <div className="fw-bold" style={{ fontSize: 15, color: v.price >= v.cost ? "#28c76f" : "#ea5455" }}>
                                      {v.price > 0 ? Math.round(((v.price - v.cost) / v.price) * 100) : 0}%
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* bottom add btn if variants exist */}
                  {form.variants.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-outline-primary w-100 mt-2"
                      style={{ borderStyle: "dashed", fontSize: 13, borderRadius: 10 }}
                      onClick={addVariant}
                    >
                      <i className="bx bx-plus me-1" />
                      Add Another Variant
                    </button>
                  )}

                </div>
              </div>

              {/* ════ RIGHT COLUMN ════ */}
              <div className="col-12 col-xl-4">

                {/* ── Status ── */}
                <div className="pf-section mb-4">
                  <SectionHead icon="⚙️" title="Settings" />

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
                        {form.isActive ? "Visible in catalogue & stock" : "Hidden from all listings"}
                      </div>
                    </div>
                    <div className="form-check form-switch mb-0">
                      <input
                        id="is-active"
                        type="checkbox"
                        className="form-check-input"
                        style={{ width: 40, height: 22, cursor: "pointer" }}
                        checked={form.isActive}
                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Summary ── */}
                {id && (
                  <div
                    className="rounded-3 p-4 mb-4"
                    style={{ background: "rgba(115,103,240,.05)", border: "1px solid rgba(115,103,240,.15)" }}
                  >
                    <div className="fw-semibold mb-3" style={{ fontSize: 13, color: "#7367f0" }}>
                      <i className="bx bx-info-circle me-1" /> Product Summary
                    </div>
                    <div className="d-flex flex-column gap-2" style={{ fontSize: 13 }}>
                      {[
                        { label: "Variants", value: form.variants.length },
                        { label: "Attributes", value: form.variants.reduce((s, v) => s + v.attributes.filter((a) => a.key).length, 0) },
                        { label: "Tax Rate", value: `${form.taxRate}%` },
                        { label: "UOM", value: form.uom || "—" },
                      ].map(({ label, value }) => (
                        <div key={label} className="d-flex justify-content-between align-items-center" style={{ borderBottom: "1px dashed #e8eaf0", paddingBottom: 6 }}>
                          <span className="text-muted">{label}</span>
                          <span className="fw-semibold">{value}</span>
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
                    <li>SKU must be unique across all products</li>
                    <li>Select parent category first to load sub-categories</li>
                    <li>Each variant can have different price &amp; cost</li>
                    <li>Add attributes like Color, Size to describe variants</li>
                    <li>Margin indicator turns red if cost &gt; price</li>
                  </ul>
                </div>

                {/* ── Error ── */}
                {error && (
                  <div
                    className="rounded-3 p-3 mb-3 d-flex align-items-start gap-2"
                    style={{ background: "rgba(234,84,85,.07)", border: "1px solid rgba(234,84,85,.25)", fontSize: 13, color: "#c0392b" }}
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
                        {id ? "Update Product" : "Create Product"}
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