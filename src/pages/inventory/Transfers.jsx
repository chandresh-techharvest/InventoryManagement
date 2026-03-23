import { useEffect, useState } from "react";
import { getProducts } from "../../lib/productApi";
import { getInventory, transferStock } from "../../lib/inventoryAPI";
import { getWarehouses } from "../../lib/WarehouseAPI";  

/* ─── Toast ────────────────────────────────── */
const Toast = ({ message, type, onClose }) => {
  const meta = {
    success: { bg: "#28c76f", icon: "✅", text: "#fff" },
    error:   { bg: "#ea5455", icon: "❌", text: "#fff" },
    warn:    { bg: "#ff9f43", icon: "⚠️", text: "#fff" },
  };
  const m = meta[type] || meta.error;
  return (
    <div style={{
      position: "fixed", top: 24, right: 24, zIndex: 9999,
      background: m.bg, borderRadius: 12,
      boxShadow: "0 8px 30px rgba(0,0,0,.2)",
      padding: "14px 20px", display: "flex", alignItems: "center", gap: 12,
      minWidth: 320, color: m.text,
      animation: "tf-slidein .25s cubic-bezier(.34,1.56,.64,1)",
    }}>
      <span style={{ fontSize: 18 }}>{m.icon}</span>
      <span style={{ fontSize: 13.5, fontWeight: 500, flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", color: m.text, cursor: "pointer", fontSize: 18, padding: 0, opacity: 0.8 }}>×</button>
    </div>
  );
};

/* ─── Step indicator ───────────────────────── */
const Step = ({ num, label, active, done }) => (
  <div className="d-flex align-items-center gap-2">
    <div
      style={{
        width: 32, height: 32, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700, transition: "all .2s",
        background: done ? "#28c76f" : active ? "#7367f0" : "rgba(115,103,240,.1)",
        color: done || active ? "#fff" : "#7367f0",
        boxShadow: active ? "0 0 0 4px rgba(115,103,240,.2)" : "none",
      }}
    >
      {done ? "✓" : num}
    </div>
    <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#333" : "#aaa" }}>
      {label}
    </span>
  </div>
);

const StepDivider = () => (
  <div style={{ flex: 1, height: 2, background: "#eef0f6", margin: "0 8px" }} />
);

/* ─── Field ────────────────────────────────── */
const Field = ({ label, required, children, hint, error }) => (
  <div>
    <label className="form-label mb-1" style={{ fontSize: 12.5, fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: ".4px" }}>
      {label}{required && <span className="text-danger ms-1">*</span>}
    </label>
    {children}
    {hint && !error && <div className="text-muted mt-1" style={{ fontSize: 11.5 }}>{hint}</div>}
    {error && <div className="text-danger mt-1" style={{ fontSize: 11.5 }}><i className="bx bx-error-circle me-1" />{error}</div>}
  </div>
);

/* ─── Main ─────────────────────────────────── */
export default function Transfers() {
  const [products,   setProducts]   = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventory,  setInventory]  = useState([]);

  const [form, setForm] = useState({
    productId:     "",
    variantId:     "",
    fromWarehouse: "",   // ← backend field name (not fromWarehouseId)
    toWarehouse:   "",   // ← backend field name (not toWarehouseId)
    quantity:      "",
  });

  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [step,    setStep]    = useState(1); // 1=product, 2=route, 3=review
  const [recentTransfers, setRecentTransfers] = useState([]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    Promise.all([
      getProducts().then(r => setProducts(r.data.data || [])),
      getWarehouses().then(r => setWarehouses(r.data.data || [])),
      getInventory().then(r => setInventory(r.data.data || [])),
    ]);
  }, []);

  /* selected product's variants */
  const selectedProduct = products.find(p => p._id === form.productId);
  const variants = selectedProduct?.variants || [];

  /* available stock in fromWarehouse for the selected product+variant */
  const fromInventory = inventory.find(
    i => i.productId?._id === form.productId &&
         i.warehouseId?._id === form.fromWarehouse &&
         (form.variantId ? i.variantId?.toString() === form.variantId : true)
  );
  const availableQty = fromInventory?.availableQuantity ?? 0;

  /* validation */
  const validate = () => {
    const e = {};
    if (!form.productId)     e.productId     = "Select a product";
    if (!form.variantId)     e.variantId     = "Select a variant";
    if (!form.fromWarehouse) e.fromWarehouse = "Select source warehouse";
    if (!form.toWarehouse)   e.toWarehouse   = "Select destination warehouse";
    if (form.fromWarehouse && form.toWarehouse && form.fromWarehouse === form.toWarehouse)
      e.toWarehouse = "Source and destination must be different";
    if (!form.quantity || Number(form.quantity) <= 0)
      e.quantity = "Enter a valid quantity";
    if (Number(form.quantity) > availableQty)
      e.quantity = `Only ${availableQty} units available`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleField = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: "" }));
    // reset downstream fields
    if (key === "productId") setForm(p => ({ ...p, productId: val, variantId: "", quantity: "" }));
    if (key === "fromWarehouse") setForm(p => ({ ...p, fromWarehouse: val, quantity: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await transferStock({
        productId:     form.productId,
        variantId:     form.variantId,
        fromWarehouse: form.fromWarehouse,
        toWarehouse:   form.toWarehouse,
        quantity:      Number(form.quantity),
      });

      // add to recent transfers log (UI only)
      setRecentTransfers(prev => [{
        id: Date.now(),
        product: selectedProduct?.name,
        from: warehouses.find(w => w._id === form.fromWarehouse)?.name,
        to:   warehouses.find(w => w._id === form.toWarehouse)?.name,
        qty:  form.quantity,
        at:   new Date().toLocaleTimeString("en-IN"),
      }, ...prev.slice(0, 4)]);

      showToast(`Successfully transferred ${form.quantity} units of ${selectedProduct?.name}`, "success");

      // reset form
      setForm({ productId: "", variantId: "", fromWarehouse: "", toWarehouse: "", quantity: "" });
      setStep(1);

      // refresh inventory
      getInventory().then(r => setInventory(r.data.data || []));
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || "Transfer failed";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const inp = { fontSize: 13.5, borderColor: errors ? "#e0e2e9" : "#e0e2e9" };
  const fc = "tf-inp";

  const stepDone = (s) => {
    if (s === 1) return !!(form.productId && form.variantId);
    if (s === 2) return !!(form.fromWarehouse && form.toWarehouse && form.fromWarehouse !== form.toWarehouse);
    return false;
  };

  return (
    <>
      <style>{`
        @keyframes tf-slidein { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes tf-fadein  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .tf-inp:focus { border-color:#7367f0!important;box-shadow:0 0 0 .18rem rgba(115,103,240,.2)!important; }
        .tf-section { background:#fff;border-radius:12px;border:1px solid #eef0f6;padding:24px;animation:tf-fadein .22s ease; }
        .tf-recent-item { padding:12px 0;border-bottom:1px solid #f0f1f5;animation:tf-fadein .2s ease; }
        .tf-recent-item:last-child { border-bottom:none; }
        .tf-variant-card { border:1px solid #e0e2e9;border-radius:10px;padding:12px 16px;cursor:pointer;transition:all .15s; }
        .tf-variant-card:hover { border-color:#7367f0;background:rgba(115,103,240,.03); }
        .tf-variant-card.selected { border-color:#7367f0;background:rgba(115,103,240,.06); }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="container-xxl container-p-y">

        {/* ── Header ── */}
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-4">
          <div>
            <h4 className="fw-bold mb-1">
              <i className="bx bx-transfer me-2 text-primary" />
              Stock Transfer
            </h4>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              Move stock between warehouses with full movement logging
            </p>
          </div>
        </div>

        {/* ── Step indicator ── */}
        <div className="tf-section mb-4">
          <div className="d-flex align-items-center">
            <Step num={1} label="Select Product" active={step === 1} done={stepDone(1)} />
            <StepDivider />
            <Step num={2} label="Set Route"      active={step === 2} done={stepDone(2)} />
            <StepDivider />
            <Step num={3} label="Review & Transfer" active={step === 3} done={false} />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-4">

            {/* ── LEFT: Form ── */}
            <div className="col-12 col-xl-8">

              {/* Step 1: Product */}
              <div className="tf-section mb-4">
                <div className="d-flex align-items-center gap-2 mb-4" style={{ borderBottom: "1px solid #f0f1f5", paddingBottom: 12 }}>
                  <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 30, height: 30, background: "rgba(115,103,240,.1)", fontSize: 15 }}>📦</div>
                  <div>
                    <div className="fw-semibold text-dark" style={{ fontSize: 13.5 }}>Product & Variant</div>
                    <div className="text-muted" style={{ fontSize: 11.5 }}>Which product are you moving?</div>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-12">
                    <Field label="Product" required error={errors.productId}>
                      <select className={`form-select ${fc} ${errors.productId ? "is-invalid" : ""}`} style={inp}
                        value={form.productId}
                        onChange={e => handleField("productId", e.target.value)}>
                        <option value="">Choose a product…</option>
                        {products.map(p => (
                          <option key={p._id} value={p._id}>{p.name} — SKU: {p.sku}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {/* Variants */}
                  {form.productId && variants.length > 0 && (
                    <div className="col-12">
                      <Field label="Variant" required error={errors.variantId}
                        hint="Select which variant to transfer">
                        <div className="row g-2 mt-1">
                          {variants.map((v) => {
                            const attrStr = Object.entries(v.attributes || {})
                              .map(([k, val]) => `${k}: ${val}`).join(", ") || "Default";
                            return (
                              <div key={v._id} className="col-md-4">
                                <div
                                  className={`tf-variant-card ${form.variantId === v._id ? "selected" : ""}`}
                                  onClick={() => handleField("variantId", v._id)}
                                >
                                  <div className="fw-semibold" style={{ fontSize: 13, color: form.variantId === v._id ? "#7367f0" : "#333" }}>
                                    {attrStr}
                                  </div>
                                  <div className="text-muted" style={{ fontSize: 11.5 }}>
                                    ₹{v.price} · Cost ₹{v.cost}
                                  </div>
                                  {form.variantId === v._id && (
                                    <div className="mt-1">
                                      <span className="badge bg-label-primary" style={{ fontSize: 10 }}>Selected</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Field>
                    </div>
                  )}

                  {form.productId && variants.length === 0 && (
                    <div className="col-12">
                      <div className="rounded-3 p-3" style={{ background: "rgba(234,84,85,.06)", border: "1px solid rgba(234,84,85,.2)", fontSize: 13, color: "#c0392b" }}>
                        <i className="bx bx-info-circle me-2" />
                        This product has no variants defined. Please add variants in the product form first.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Warehouse Route */}
              <div className="tf-section mb-4" style={{ background: "#fafbff" }}>
                <div className="d-flex align-items-center gap-2 mb-4" style={{ borderBottom: "1px solid #f0f1f5", paddingBottom: 12 }}>
                  <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 30, height: 30, background: "rgba(0,207,232,.1)", fontSize: 15 }}>🏭</div>
                  <div>
                    <div className="fw-semibold text-dark" style={{ fontSize: 13.5 }}>Transfer Route</div>
                    <div className="text-muted" style={{ fontSize: 11.5 }}>From warehouse → To warehouse</div>
                  </div>
                </div>

                <div className="row g-3 align-items-end">
                  {/* From */}
                  <div className="col-md-5">
                    <Field label="From Warehouse" required error={errors.fromWarehouse}>
                      <select className={`form-select ${fc} ${errors.fromWarehouse ? "is-invalid" : ""}`} style={inp}
                        value={form.fromWarehouse}
                        onChange={e => handleField("fromWarehouse", e.target.value)}>
                        <option value="">Select source…</option>
                        {warehouses.filter(w => w.isActive).map(w => (
                          <option key={w._id} value={w._id}>{w.name}</option>
                        ))}
                      </select>
                    </Field>
                    {form.fromWarehouse && form.productId && form.variantId && (
                      <div className="mt-2 d-flex align-items-center gap-2" style={{ fontSize: 12.5 }}>
                        <span className="text-muted">Available:</span>
                        <span className={`fw-bold ${availableQty === 0 ? "text-danger" : availableQty < 10 ? "text-warning" : "text-success"}`}>
                          {availableQty} units
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="col-md-2 text-center pb-2">
                    <div style={{ fontSize: 24, color: "#7367f0" }}>
                      <i className="bx bx-right-arrow-alt" />
                    </div>
                  </div>

                  {/* To */}
                  <div className="col-md-5">
                    <Field label="To Warehouse" required error={errors.toWarehouse}>
                      <select className={`form-select ${fc} ${errors.toWarehouse ? "is-invalid" : ""}`} style={inp}
                        value={form.toWarehouse}
                        onChange={e => handleField("toWarehouse", e.target.value)}>
                        <option value="">Select destination…</option>
                        {warehouses.filter(w => w.isActive && w._id !== form.fromWarehouse).map(w => (
                          <option key={w._id} value={w._id}>{w.name}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>
              </div>

              {/* Step 3: Quantity */}
              <div className="tf-section">
                <div className="d-flex align-items-center gap-2 mb-4" style={{ borderBottom: "1px solid #f0f1f5", paddingBottom: 12 }}>
                  <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 30, height: 30, background: "rgba(40,199,111,.1)", fontSize: 15 }}>🔢</div>
                  <div>
                    <div className="fw-semibold text-dark" style={{ fontSize: 13.5 }}>Quantity</div>
                    <div className="text-muted" style={{ fontSize: 11.5 }}>How many units to transfer?</div>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <Field label="Transfer Quantity" required error={errors.quantity}
                      hint={availableQty > 0 ? `Max: ${availableQty} units` : ""}>
                      <div className="input-group">
                        <button type="button" className="btn btn-outline-secondary"
                          style={{ borderColor: "#e0e2e9" }}
                          onClick={() => setForm(p => ({ ...p, quantity: Math.max(0, Number(p.quantity) - 1).toString() }))}>
                          <i className="bx bx-minus" />
                        </button>
                        <input type="number" className={`form-control text-center ${fc} ${errors.quantity ? "is-invalid" : ""}`}
                          style={{ ...inp, fontWeight: 700, fontSize: 16 }}
                          value={form.quantity}
                          min={1} max={availableQty}
                          onChange={e => handleField("quantity", e.target.value)} />
                        <button type="button" className="btn btn-outline-secondary"
                          style={{ borderColor: "#e0e2e9" }}
                          onClick={() => setForm(p => ({ ...p, quantity: (Number(p.quantity) + 1).toString() }))}>
                          <i className="bx bx-plus" />
                        </button>
                      </div>
                    </Field>
                  </div>

                  {/* Quick set buttons */}
                  {availableQty > 0 && (
                    <div className="col-md-8 d-flex align-items-end gap-2 flex-wrap">
                      {[25, 50, 75, 100].map(pct => {
                        const qty = Math.floor(availableQty * pct / 100);
                        return qty > 0 ? (
                          <button key={pct} type="button"
                            className="btn btn-sm btn-outline-secondary"
                            style={{ fontSize: 12, borderRadius: 8 }}
                            onClick={() => handleField("quantity", qty.toString())}>
                            {pct}% ({qty})
                          </button>
                        ) : null;
                      })}
                      <button type="button"
                        className="btn btn-sm btn-outline-primary"
                        style={{ fontSize: 12, borderRadius: 8 }}
                        onClick={() => handleField("quantity", availableQty.toString())}>
                        All ({availableQty})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Summary + Recent ── */}
            <div className="col-12 col-xl-4">

              {/* Transfer summary */}
              <div className="tf-section mb-4">
                <div className="fw-semibold mb-3" style={{ fontSize: 13.5, color: "#333" }}>
                  <i className="bx bx-receipt me-2 text-primary" />Transfer Summary
                </div>

                <div className="d-flex flex-column gap-2" style={{ fontSize: 13 }}>
                  {[
                    { label: "Product",     value: selectedProduct?.name || "—" },
                    { label: "Variant",     value: form.variantId ? variants.find(v => v._id === form.variantId) ? Object.entries(variants.find(v => v._id === form.variantId)?.attributes || {}).map(([k,v]) => `${k}: ${v}`).join(", ") || "Default" : "—" : "—" },
                    { label: "From",        value: warehouses.find(w => w._id === form.fromWarehouse)?.name || "—" },
                    { label: "To",          value: warehouses.find(w => w._id === form.toWarehouse)?.name || "—" },
                    { label: "Quantity",    value: form.quantity ? `${form.quantity} units` : "—", accent: true },
                    { label: "Remaining",   value: form.quantity && availableQty ? `${availableQty - Number(form.quantity)} units` : "—" },
                  ].map(({ label, value, accent }) => (
                    <div key={label} className="d-flex justify-content-between align-items-center py-1"
                      style={{ borderBottom: "1px dashed #f0f1f5" }}>
                      <span className="text-muted">{label}</span>
                      <span className={`fw-semibold text-truncate ms-3 ${accent ? "text-primary" : "text-dark"}`}
                        style={{ maxWidth: 160, fontSize: accent ? 15 : 13 }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 d-flex flex-column gap-2">
                  <button type="submit" className="btn btn-primary w-100" disabled={loading}
                    style={{ borderRadius: 10, fontWeight: 600 }}>
                    {loading
                      ? <><span className="spinner-border spinner-border-sm me-2" style={{ width: 14, height: 14 }} />Transferring…</>
                      : <><i className="bx bx-transfer me-2" />Execute Transfer</>}
                  </button>
                  <button type="button" className="btn btn-outline-secondary w-100"
                    style={{ borderRadius: 10 }}
                    onClick={() => { setForm({ productId: "", variantId: "", fromWarehouse: "", toWarehouse: "", quantity: "" }); setErrors({}); setStep(1); }}>
                    <i className="bx bx-reset me-1" />Reset
                  </button>
                </div>
              </div>

              {/* Recent transfers */}
              {recentTransfers.length > 0 && (
                <div className="tf-section">
                  <div className="fw-semibold mb-3" style={{ fontSize: 13.5, color: "#333" }}>
                    <i className="bx bx-history me-2 text-muted" />Recent Transfers
                  </div>
                  {recentTransfers.map(t => (
                    <div key={t.id} className="tf-recent-item">
                      <div className="fw-semibold" style={{ fontSize: 13 }}>{t.product}</div>
                      <div className="text-muted" style={{ fontSize: 11.5 }}>
                        {t.from} → {t.to} · <strong>{t.qty} units</strong>
                      </div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{t.at}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tips */}
              <div className="rounded-3 p-4 mt-4" style={{ background: "#f8f9fc", border: "1px solid #eef0f6", fontSize: 12.5, color: "#555" }}>
                <div className="fw-semibold mb-2" style={{ color: "#444", fontSize: 13 }}>
                  <i className="bx bx-bulb me-1 text-warning" /> How it works
                </div>
                <ul className="mb-0 ps-3" style={{ lineHeight: 1.9 }}>
                  <li>Stock is deducted from source warehouse</li>
                  <li>Destination warehouse receives the stock</li>
                  <li>Both movements are logged automatically</li>
                  <li>You cannot exceed available quantity</li>
                  <li>Inactive warehouses are excluded</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}