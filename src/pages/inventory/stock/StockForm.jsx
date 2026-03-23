import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addStock, getInventoryById, updateStock } from "../../../lib/inventoryAPI";
import { getProducts } from "../../../lib/productApi";
import { getWarehouses } from "../../../lib/WarehouseAPI";

/* ─── Toast ────────────────────────────────── */
const Toast = ({ message, type }) => {
  const c = { success: "#28c76f", error: "#ea5455" };
  return (
    <div style={{
      position: "fixed", top: 24, right: 24, zIndex: 9999,
      background: "#fff", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,.14)",
      padding: "14px 20px", display: "flex", alignItems: "center", gap: 12,
      minWidth: 300, borderLeft: `4px solid ${c[type] || c.success}`,
      animation: "sf-slidein .25s cubic-bezier(.34,1.56,.64,1)",
    }}>
      <span style={{ fontSize: 18 }}>{type === "success" ? "✅" : "❌"}</span>
      <span style={{ fontSize: 13.5, color: "#333", fontWeight: 500 }}>{message}</span>
    </div>
  );
};

const Field = ({ label, required, children, hint, error }) => (
  <div>
    <label className="form-label mb-1"
      style={{ fontSize: 12.5, fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: ".4px" }}>
      {label}{required && <span className="text-danger ms-1">*</span>}
    </label>
    {children}
    {hint && !error && <div className="text-muted mt-1" style={{ fontSize: 11.5 }}>{hint}</div>}
    {error && <div className="text-danger mt-1" style={{ fontSize: 11.5 }}><i className="bx bx-error-circle me-1" />{error}</div>}
  </div>
);

export default function StockForm() {
  const navigate  = useNavigate();
  const { id }    = useParams(); // present for edit mode (PUT /inventory/:id)
  const isEdit    = Boolean(id);

  const [products,   setProducts]   = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loadingForm, setLoadingForm] = useState(!!id);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);
  const [errors,  setErrors]  = useState({});
  const [error,   setError]   = useState("");

  const [form, setForm] = useState({
    warehouseId:  "",
    productId:    "",
    variantId:    "",
    quantity:     "",
    reorderLevel: "",
    safetyStock:  "",
    batchNumber:  "",
    expiryDate:   "",
  });

  /* batch array for edit mode (display-only, from GET /inventory/:id) */
  const [existingBatches, setExistingBatches] = useState([]);
  const [currentQty,      setCurrentQty]      = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    Promise.all([
      getProducts().then(r  => setProducts(r.data.data || [])),
      getWarehouses().then(r => setWarehouses(r.data.data || [])),
    ]);
    if (isEdit) loadInventory();
  }, [id]);

  const loadInventory = async () => {
    setLoadingForm(true);
    try {
      const res = await getInventoryById(id);
      const inv = res.data.data;
      setForm({
        warehouseId:  inv.warehouseId?._id || inv.warehouseId || "",
        productId:    inv.productId?._id   || inv.productId   || "",
        variantId:    inv.variantId        || "",
        quantity:     "",                  // edit via adjustStock; field here = reorder config
        reorderLevel: inv.reorderLevel     ?? "",
        safetyStock:  inv.safetyStock      ?? "",
        batchNumber:  "",
        expiryDate:   "",
      });
      setExistingBatches(inv.batches || []);
      setCurrentQty(inv.quantityOnHand);
    } catch (err) {
      console.error("Load inventory error:", err);
    } finally {
      setLoadingForm(false);
    }
  };

  /* derived: variants for selected product */
  const selectedProduct = products.find(p => p._id === form.productId);
  const variants = selectedProduct?.variants || [];

  const setField = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: "" }));
    if (key === "productId") setForm(p => ({ ...p, productId: val, variantId: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.warehouseId) e.warehouseId = "Select a warehouse";
    if (!form.productId)   e.productId   = "Select a product";
    if (!form.variantId)   e.variantId   = "Select a variant";
    if (!isEdit && (!form.quantity || Number(form.quantity) <= 0))
      e.quantity = "Enter quantity greater than 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        // PUT /inventory/:id — update reorderLevel / safetyStock
        await updateStock(id, {
          reorderLevel: Number(form.reorderLevel) || 0,
          safetyStock:  Number(form.safetyStock)  || 0,
        });
      } else {
        // POST /inventory — upsert (adds to existing if same warehouse+product+variant)
        await addStock({
          warehouseId:  form.warehouseId,
          productId:    form.productId,
          variantId:    form.variantId,
          quantity:     Number(form.quantity),
          reorderLevel: Number(form.reorderLevel) || 0,
          safetyStock:  Number(form.safetyStock)  || 0,
          ...(form.batchNumber ? { batchNumber: form.batchNumber } : {}),
          ...(form.expiryDate  ? { expiryDate:  form.expiryDate  } : {}),
        });
      }
      showToast(isEdit ? "Stock record updated!" : "Stock added successfully!", "success");
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || "Save failed";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const inp = { fontSize: 13.5, borderColor: "#e0e2e9" };
  const fc  = "sf-inp";

  return (
    <>
      <style>{`
        @keyframes sf-slidein { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes sf-fadein  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .sf-inp:focus { border-color:#7367f0!important;box-shadow:0 0 0 .18rem rgba(115,103,240,.2)!important; }
        .sf-section { background:#fff;border-radius:12px;border:1px solid #eef0f6;padding:24px;animation:sf-fadein .22s ease; }
        .sf-variant { border:1px solid #e0e2e9;border-radius:10px;padding:12px 16px;cursor:pointer;transition:all .15s; }
        .sf-variant:hover { border-color:#7367f0;background:rgba(115,103,240,.03); }
        .sf-variant.selected { border-color:#7367f0;background:rgba(115,103,240,.06); }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="container-xxl container-p-y">

        {/* ── Header ── */}
        <div className="d-flex align-items-center gap-2 mb-4">
          <button type="button" className="btn btn-sm btn-outline-secondary"
            onClick={() => navigate(-1)}
            style={{ width: 34, height: 34, padding: 0, borderRadius: 8, flexShrink: 0 }}>
            <i className="bx bx-arrow-back" style={{ fontSize: 16 }} />
          </button>
          <div>
            <h4 className="fw-bold mb-0">
              <i className={`bx ${isEdit ? "bx-edit" : "bx-plus-circle"} me-2 text-primary`} />
              {isEdit ? "Edit Stock Record" : "Add Stock"}
            </h4>
            <p className="text-muted mb-0" style={{ fontSize: 12.5 }}>
              {isEdit
                ? "Update reorder level and safety stock. Use Adjust Stock to change quantity."
                : "Adding to an existing record will increase its quantity (no duplicate created)."}
            </p>
          </div>
        </div>

        {loadingForm ? (
          <div className="sf-section text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-3 mb-0" style={{ fontSize: 13 }}>Loading record…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="row g-4">

              {/* ── Left ── */}
              <div className="col-12 col-xl-8">

                {/* Location + Product */}
                <div className="sf-section mb-4">
                  <div className="d-flex align-items-center gap-2 mb-4" style={{ borderBottom: "1px solid #f0f1f5", paddingBottom: 12 }}>
                    <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 30, height: 30, background: "rgba(115,103,240,.1)", fontSize: 15 }}>📍</div>
                    <div>
                      <div className="fw-semibold text-dark" style={{ fontSize: 13.5 }}>Warehouse & Product</div>
                      <div className="text-muted" style={{ fontSize: 11.5 }}>Where is this stock located?</div>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <Field label="Warehouse" required error={errors.warehouseId}>
                        <select className={`form-select ${fc} ${errors.warehouseId ? "is-invalid" : ""}`} style={inp}
                          value={form.warehouseId} onChange={e => setField("warehouseId", e.target.value)}
                          disabled={isEdit}>
                          <option value="">Select warehouse…</option>
                          {warehouses.filter(w => w.isActive).map(w => (
                            <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <div className="col-md-6">
                      <Field label="Product" required error={errors.productId}>
                        <select className={`form-select ${fc} ${errors.productId ? "is-invalid" : ""}`} style={inp}
                          value={form.productId} onChange={e => setField("productId", e.target.value)}
                          disabled={isEdit}>
                          <option value="">Select product…</option>
                          {products.map(p => (
                            <option key={p._id} value={p._id}>{p.name} — {p.sku}</option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    {/* Variant picker */}
                    {form.productId && variants.length > 0 && (
                      <div className="col-12">
                        <Field label="Variant" required error={errors.variantId}>
                          <div className="row g-2 mt-1">
                            {variants.map(v => {
                              const attrStr = Object.entries(v.attributes || {}).map(([k, val]) => `${k}: ${val}`).join(", ") || "Default";
                              const isSelected = form.variantId === v._id;
                              return (
                                <div key={v._id} className="col-md-4">
                                  <div className={`sf-variant ${isSelected ? "selected" : ""}`}
                                    onClick={() => !isEdit && setField("variantId", v._id)}>
                                    <div className="fw-semibold" style={{ fontSize: 13, color: isSelected ? "#7367f0" : "#333" }}>{attrStr}</div>
                                    <div className="text-muted" style={{ fontSize: 11.5 }}>₹{v.price} · Cost ₹{v.cost}</div>
                                    {isSelected && <span className="badge bg-label-primary mt-1" style={{ fontSize: 10 }}>Selected</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </Field>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quantity (add only) */}
                {!isEdit && (
                  <div className="sf-section mb-4" style={{ background: "#fafbff" }}>
                    <div className="d-flex align-items-center gap-2 mb-4" style={{ borderBottom: "1px solid #f0f1f5", paddingBottom: 12 }}>
                      <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: 30, height: 30, background: "rgba(40,199,111,.1)", fontSize: 15 }}>🔢</div>
                      <div>
                        <div className="fw-semibold text-dark" style={{ fontSize: 13.5 }}>Quantity & Batch</div>
                        <div className="text-muted" style={{ fontSize: 11.5 }}>How many units? Optional batch tracking.</div>
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-4">
                        <Field label="Quantity" required error={errors.quantity} hint="Added to existing stock if record exists">
                          <input type="number" className={`form-control ${fc} ${errors.quantity ? "is-invalid" : ""}`} style={inp}
                            value={form.quantity} onChange={e => setField("quantity", e.target.value)}
                            min={1} placeholder="0" />
                        </Field>
                      </div>
                      <div className="col-md-4">
                        <Field label="Batch Number" hint="Optional — for batch tracking">
                          <input type="text" className={`form-control ${fc}`} style={inp}
                            value={form.batchNumber} onChange={e => setField("batchNumber", e.target.value)}
                            placeholder="e.g. BATCH-2024-01" />
                        </Field>
                      </div>
                      <div className="col-md-4">
                        <Field label="Expiry Date" hint="Required if batch number set">
                          <input type="date" className={`form-control ${fc}`} style={inp}
                            value={form.expiryDate} onChange={e => setField("expiryDate", e.target.value)} />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reorder config */}
                <div className="sf-section">
                  <div className="d-flex align-items-center gap-2 mb-4" style={{ borderBottom: "1px solid #f0f1f5", paddingBottom: 12 }}>
                    <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 30, height: 30, background: "rgba(255,159,67,.1)", fontSize: 15 }}>⚠️</div>
                    <div>
                      <div className="fw-semibold text-dark" style={{ fontSize: 13.5 }}>Reorder Configuration</div>
                      <div className="text-muted" style={{ fontSize: 11.5 }}>Triggers low-stock alerts when threshold is breached</div>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <Field label="Reorder Level" hint="Alert when stock falls to or below this">
                        <div className="input-group">
                          <span className="input-group-text bg-transparent" style={{ borderColor: "#e0e2e9" }}>
                            <i className="bx bx-bell text-muted" style={{ fontSize: 15 }} />
                          </span>
                          <input type="number" className={`form-control border-start-0 ${fc}`} style={inp}
                            value={form.reorderLevel} onChange={e => setField("reorderLevel", e.target.value)}
                            min={0} placeholder="e.g. 10" />
                        </div>
                      </Field>
                    </div>
                    <div className="col-md-6">
                      <Field label="Safety Stock" hint="Minimum buffer stock to maintain">
                        <div className="input-group">
                          <span className="input-group-text bg-transparent" style={{ borderColor: "#e0e2e9" }}>
                            <i className="bx bx-shield text-muted" style={{ fontSize: 15 }} />
                          </span>
                          <input type="number" className={`form-control border-start-0 ${fc}`} style={inp}
                            value={form.safetyStock} onChange={e => setField("safetyStock", e.target.value)}
                            min={0} placeholder="e.g. 5" />
                        </div>
                      </Field>
                    </div>
                  </div>
                </div>

                {/* Existing batches (edit mode) */}
                {isEdit && existingBatches.length > 0 && (
                  <div className="sf-section mt-4">
                    <div className="fw-semibold mb-3" style={{ fontSize: 13.5 }}>
                      <i className="bx bx-layer me-2 text-primary" />Existing Batches
                      {currentQty !== null && (
                        <span className="ms-2 badge bg-label-primary">On Hand: {currentQty}</span>
                      )}
                    </div>
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered mb-0" style={{ fontSize: 12.5 }}>
                        <thead style={{ background: "#f8f9fc" }}>
                          <tr><th>Batch #</th><th>Expiry Date</th><th className="text-end">Qty</th></tr>
                        </thead>
                        <tbody>
                          {existingBatches.map((b, i) => (
                            <tr key={i}>
                              <td>{b.batchNumber}</td>
                              <td>{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString("en-IN") : "—"}</td>
                              <td className="text-end fw-semibold">{b.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-muted mt-2 mb-0" style={{ fontSize: 11.5 }}>
                      <i className="bx bx-info-circle me-1" />To change quantities, use the Adjust Stock action on the Stock page.
                    </p>
                  </div>
                )}
              </div>

              {/* ── Right ── */}
              <div className="col-12 col-xl-4">

                {/* Tips */}
                <div className="rounded-3 p-4 mb-4" style={{ background: "#f8f9fc", border: "1px solid #eef0f6", fontSize: 12.5, color: "#555" }}>
                  <div className="fw-semibold mb-2" style={{ color: "#444", fontSize: 13 }}>
                    <i className="bx bx-bulb me-1 text-warning" /> How it works
                  </div>
                  <ul className="mb-0 ps-3" style={{ lineHeight: 1.9 }}>
                    {isEdit ? (
                      <>
                        <li>Editing updates reorder level & safety stock only</li>
                        <li>Use "Adjust Stock" on the stock list to change quantity</li>
                        <li>Each adjustment is logged in the movement ledger</li>
                      </>
                    ) : (
                      <>
                        <li>If this product already exists in the warehouse, quantity is <strong>added</strong> — no duplicate created</li>
                        <li>Batch tracking is optional — leave blank if not needed</li>
                        <li>Reorder level triggers low-stock alerts</li>
                        <li>Safety stock is the minimum buffer to maintain</li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-3 p-3 mb-3 d-flex align-items-start gap-2"
                    style={{ background: "rgba(234,84,85,.07)", border: "1px solid rgba(234,84,85,.25)", fontSize: 13, color: "#c0392b" }}>
                    <i className="bx bx-error-circle mt-1 flex-shrink-0" /><span>{error}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="d-flex flex-column gap-2">
                  <button type="submit" className="btn btn-primary w-100" style={{ borderRadius: 10, fontWeight: 600 }} disabled={saving}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2" style={{ width: 14, height: 14 }} />Saving…</>
                      : <><i className={`bx ${isEdit ? "bx-check" : "bx-plus"} me-1`} />{isEdit ? "Update Record" : "Add Stock"}</>}
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