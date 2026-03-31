import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPurchaseOrder } from "../../../lib/purchaseOrdersAPI";
import { getSuppliers } from "../../../lib/suppliersAPI";
import { getWarehouses } from "../../../lib/WarehouseAPI";
import { getProducts } from "../../../lib/productApi";

/* ─────────────────────────────────────────────
   HELPERS (same pattern as ProductForm)
───────────────────────────────────────────── */
const Field = ({ label, required, children, hint, col = "col-12" }) => (
  <div className={col}>
    <label className="form-label mb-1"
      style={{ fontSize: 12.5, fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: ".4px" }}>
      {label}{required && <span className="text-danger ms-1">*</span>}
    </label>
    {children}
    {hint && <div className="text-muted mt-1" style={{ fontSize: 11.5 }}>{hint}</div>}
  </div>
);

const SectionHead = ({ icon, title, subtitle, action }) => (
  <div className="d-flex align-items-center justify-content-between mb-3"
    style={{ borderBottom: "1px solid #f0f1f5", paddingBottom: 10 }}>
    <div className="d-flex align-items-center gap-2">
      <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
        style={{ width: 30, height: 30, background: "rgba(115,103,240,.1)", fontSize: 15 }}>
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

const Toast = ({ message, type }) => {
  const meta = { success: { border: "#28c76f", icon: "✅" }, error: { border: "#ea5455", icon: "❌" } };
  const m = meta[type] || meta.error;
  return (
    <div style={{
      position: "fixed", top: 24, right: 24, zIndex: 9999,
      background: "#fff", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,.14)",
      padding: "14px 20px", display: "flex", alignItems: "center", gap: 12,
      minWidth: 300, borderLeft: `4px solid ${m.border}`,
      animation: "pof-slidein .25s cubic-bezier(.34,1.56,.64,1)",
    }}>
      <span style={{ fontSize: 18 }}>{m.icon}</span>
      <span style={{ fontSize: 13.5, color: "#333", fontWeight: 500 }}>{message}</span>
    </div>
  );
};

const ITEM_COLORS = ["#7367f0", "#28c76f", "#00cfe8", "#ff9f43", "#ea5455", "#82868b"];

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function PurchaseOrderForm() {
  const navigate = useNavigate();

  const [suppliers,  setSuppliers]  = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products,   setProducts]   = useState([]);

  const [form, setForm] = useState({
    supplierId: "",
    warehouseId: "",
    items: [
    {
      productId: "",
      variantId: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 0
    }
  ],
    expectedDeliveryDate: "", 
    notes: "",
  });

  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);
  const [error,    setError]    = useState("");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Load reference data ───────────────────────────────── */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [sup, wh, prod] = await Promise.all([
          getSuppliers(), getWarehouses(), getProducts(),
        ]);
        setSuppliers(sup.data.data   || []);
        setWarehouses(wh.data.data   || []);
        setProducts(prod.data.data   || []);
      } catch (err) {
        showToast("Failed to load reference data", "error");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  /* ── Items ─────────────────────────────────────────────── */
  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { productId: "", variantId: "", quantity: 1, unitPrice: 0, taxRate: 0 }],
    }));
  };

  const removeItem = (index) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const updateItem = (index, field, value) => {
  setForm((prev) => {
    const items = [...prev.items];
    items[index] = { ...items[index], [field]: value };

    if (field === "productId") {
      const selectedProduct = products.find((p) => p._id === value);

      items[index].variantId = "";
      items[index].unitPrice = 0;

      //SET TAX RATE FROM PRODUCT
      items[index].taxRate = selectedProduct?.taxRate || 0;
    }

    return { ...prev, items };
  });
};

  /* ── Submit ─────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.items.length === 0) {
      setError("Please add at least one item.");
      showToast("Please add at least one item.", "error");
      return;
    }

    setSaving(true);
    try {
      await createPurchaseOrder({ ...form, subtotal, taxAmount:totalTax, totalAmount:grandTotal });
      showToast("Purchase order created successfully!", "success");
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      const msg = err?.response?.data?.error || "Error creating purchase order";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(
  (p) => p.supplierId === form.supplierId
);

  /* ── Derived totals ────────────────────────────────────── */
const subtotal = form.items.reduce(
  (sum, item) =>
    sum + (Number(item.unitPrice) * Number(item.quantity || 0)),
  0
);

const totalTax = form.items.reduce(
  (sum, item) => {
    const lineTotal =
      Number(item.unitPrice) * Number(item.quantity || 0);
    const itemTax =
      lineTotal * (Number(item.taxRate || 0) / 100);
    return sum + itemTax;
  },
  0
);

const grandTotal = subtotal + totalTax;

  const fmt = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

  const inp = { fontSize: 13.5, borderColor: "#e0e2e9" };
  const fc  = "pof-inp";

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @keyframes pof-slidein { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pof-fadein  { from{opacity:0;transform:translateY(6px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes pof-vslide  { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .pof-inp:focus { border-color:#7367f0!important; box-shadow:0 0 0 .18rem rgba(115,103,240,.2)!important; }
        .pof-section     { background:#fff;    border-radius:12px; border:1px solid #eef0f6; padding:24px; animation:pof-fadein .22s ease; }
        .pof-section-alt { background:#fafbff; border-radius:12px; border:1px solid #eef0f6; padding:24px; animation:pof-fadein .22s ease; }
        .pof-item-row { border-radius:10px; border:1px solid #e8eaf0; padding:16px; margin-bottom:12px; background:#fff; animation:pof-vslide .2s ease; position:relative; }
        .pof-remove { position:absolute;top:12px;right:12px;width:28px;height:28px;padding:0;border-radius:7px;
          display:flex;align-items:center;justify-content:center;font-size:13px;
          background:rgba(234,84,85,.08);color:#ea5455;border:none;transition:all .15s; }
        .pof-remove:hover { background:#ea5455;color:#fff;transform:scale(1.08); }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="container-xxl container-p-y">

        {/* ── PAGE HEADER ── */}
        <div className="d-flex align-items-center gap-2 mb-4">
          <button type="button" className="btn btn-sm btn-outline-secondary"
            onClick={() => navigate(-1)}
            style={{ width: 34, height: 34, padding: 0, borderRadius: 8, flexShrink: 0 }}>
            <i className="bx bx-arrow-back" style={{ fontSize: 16 }} />
          </button>
          <div>
            <h4 className="fw-bold mb-0" style={{ lineHeight: 1.2 }}>
              <i className="bx bx-plus-circle me-2 text-primary" />
              Create Purchase Order
            </h4>
            <p className="text-muted mb-0" style={{ fontSize: 12.5 }}>
              Select supplier, warehouse and add items to create a new PO
            </p>
          </div>
        </div>

        {/* ── LOADING ── */}
        {loading ? (
          <div className="pof-section text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="text-muted mt-3 mb-0" style={{ fontSize: 13 }}>Loading reference data…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="row g-4">

              {/* ════ LEFT COLUMN ════ */}
              <div className="col-12 col-xl-8">

                {/* ── PO Details ── */}
                <div className="pof-section mb-4">
                  <SectionHead icon="📋" title="Order Details" subtitle="Supplier, warehouse and delivery info" />
                  <div className="row g-3">

                    <Field label="Supplier" required col="col-md-6">
                      <select
                        className={`form-select ${fc}`} style={inp}
                        value={form.supplierId}
                        onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                        required
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map((s) => (
                          <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Warehouse" required col="col-md-6">
                      <select
                        className={`form-select ${fc}`} style={inp}
                        value={form.warehouseId}
                        onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                        required
                      >
                        <option value="">Select Warehouse</option>
                        {warehouses.map((w) => (
                          <option key={w._id} value={w._id}>{w.name}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Expected Delivery Date" col="col-md-6">
                      <input
                        type="date"
                        className={`form-control ${fc}`} style={inp}
                        value={form.expectedDeliveryDate}
                        onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </Field>

                  </div>
                </div>

                {/* ── Items ── */}
                <div className="pof-section mb-4">
                  <SectionHead
                    icon="📦"
                    title="Order Items"
                    subtitle={`${form.items.length} item${form.items.length !== 1 ? "s" : ""} added`}
                    action={
                      <button type="button" className="btn btn-sm btn-outline-primary"
                        style={{ fontSize: 12, borderRadius: 8 }} onClick={addItem}>
                        <i className="bx bx-plus me-1" />Add Item
                      </button>
                    }
                  />

                  {form.items.length === 0 && (
                    <div className="text-center py-4 rounded-3"
                      style={{ border: "2px dashed #e0e2e9", color: "#aaa", fontSize: 13 }}>
                      <i className="bx bx-package d-block mb-1" style={{ fontSize: 28 }} />
                      No items yet. Click "Add Item" to begin.
                    </div>
                  )}

                  {form.items.map((item, idx) => {
                    const color   = ITEM_COLORS[idx % ITEM_COLORS.length];
                    const product = products.find((p) => p._id === item.productId);
                    const lineTotal = Number(item.unitPrice) * Number(item.quantity || 0);
                    const Producttax = Number(item.taxRate) / 100 * lineTotal;

                    return (
                      <div key={idx} className="pof-item-row">
                        {/* row label */}
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <div className="rounded-2 d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                            style={{ width: 26, height: 26, background: color + "20", color, fontSize: 12 }}>
                            {idx + 1}
                          </div>
                          <span className="fw-semibold text-muted" style={{ fontSize: 12.5 }}>Item {idx + 1}</span>
                        </div>

                        {/* remove button */}
                        <button type="button" className="pof-remove" onClick={() => removeItem(idx)} title="Remove item">
                          <i className="bx bx-x" style={{ fontSize: 15 }} />
                        </button>

                        <div className="row g-3">
                          {/* product */}
                          <Field label="Product" required col="col-md-5">
                            <select
                              className={`form-select ${fc}`} style={{ ...inp, fontSize: 13 }}
                              value={item.productId}
                              onChange={(e) => updateItem(idx, "productId", e.target.value)}
                              disabled={!form.supplierId}
                            >
                              <option value="">{form.supplierId ? "Select Product" : "Select Supplier First"}</option>
                              {filteredProducts.map((p) => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                              ))}
                            </select>
                          </Field>

                          {/* variant */}
                          <Field label="Variant" col="col-md-4">
                            <select
                              className={`form-select ${fc}`} style={{ ...inp, fontSize: 13 }}
                              value={item.variantId}
                              disabled={!product}
                              onChange={(e) => {
                                const vid = e.target.value;
                                const v   = product?.variants?.find((v) => v._id === vid);
                                updateItem(idx, "variantId", vid);
                                updateItem(idx, "unitPrice", v?.cost || 0);
                              }}
                            >
                              <option value="">{product ? "Select Variant" : "Select product first"}</option>
                              {product?.variants?.map((v) => (
                                <option key={v._id} value={v._id}>
                                  {Object.values(v.attributes || {}).join(", ") || `Variant ${v._id.slice(-4)}`}
                                </option>
                              ))}
                            </select>
                          </Field>

                          {/* qty */}
                          <Field label="Quantity" required col="col-md-3">
                            <input
                              type="number"
                              className={`form-control ${fc}`} style={{ ...inp, fontSize: 13 }}
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                              min={1}
                            />
                          </Field>

                          {/* unit price */}
                          <Field label="Unit Cost Price" col="col-md-4"
                            hint="Auto-filled from variant cost">
                            <div className="input-group">
                              <span className="input-group-text bg-transparent"
                                style={{ borderColor: "#e0e2e9", color: "#ff9f43", fontWeight: 700, fontSize: 13 }}>₹</span>
                              <input
                                className={`form-control border-start-0 ${fc}`}
                                style={{ ...inp, fontSize: 13, background: "#fafbff" }}
                                value={item.unitPrice}
                                disabled
                              />
                            </div>
                          </Field>

                          {/* line total */}
                          {lineTotal > 0 && (
                            <div className="col-md-4 d-flex align-items-end">
                              <div className="rounded-3 px-3 py-2 w-100"
                                style={{ background: "rgba(40,199,111,.08)", border: "1px solid rgba(40,199,111,.2)" }}>
                                <div className="text-muted" style={{ fontSize: 11 }}>Line Total</div>
                                <div className="fw-bold" style={{ fontSize: 15, color: "#28c76f" }}>{fmt(lineTotal)} 
<div style={{ fontSize: 11, color: "#ff9f43" }}>
  + {fmt(Producttax)} tax ({item.taxRate}%)
</div></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {form.items.length > 0 && (
                    <button type="button" className="btn btn-outline-primary w-100 mt-2"
                      style={{ borderStyle: "dashed", fontSize: 13, borderRadius: 10 }}
                      onClick={addItem}>
                      <i className="bx bx-plus me-1" />Add Another Item
                    </button>
                  )}
                </div>

                {/* ── Notes ── */}
                <div className="pof-section-alt">
                  <SectionHead icon="📝" title="Notes" subtitle="Internal notes for this order" />
                  <textarea
                    className={`form-control ${fc}`} style={{ ...inp, resize: "none" }}
                    rows={3}
                    placeholder="Optional notes or instructions…"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>

              </div>

              {/* ════ RIGHT COLUMN ════ */}
              <div className="col-12 col-xl-4">

                {/* ── Order Summary ── */}
                <div className="rounded-3 p-4 mb-4"
                  style={{ background: "rgba(115,103,240,.05)", border: "1px solid rgba(115,103,240,.15)" }}>
                  <div className="fw-semibold mb-3" style={{ fontSize: 13, color: "#7367f0" }}>
                    <i className="bx bx-receipt me-1" /> Order Summary
                  </div>
                  <div className="d-flex flex-column gap-2" style={{ fontSize: 13 }}>
                    {[
                      { label: "Items",     value: `${form.items.length} item${form.items.length !== 1 ? "s" : ""}` },
                      { label: "Subtotal",  value: fmt(subtotal) },
                      { label: "Total Tax", value: fmt(totalTax) }
                    ].map(({ label, value }) => (
                      <div key={label} className="d-flex justify-content-between align-items-center"
                        style={{ borderBottom: "1px dashed #e8eaf0", paddingBottom: 6 }}>
                        <span className="text-muted">{label}</span>
                        <span className="fw-semibold">{value}</span>
                      </div>
                    ))}
                    <div className="d-flex justify-content-between align-items-center pt-1">
                      <span className="fw-bold" style={{ fontSize: 14 }}>Grand Total</span>
                      <span className="fw-bold" style={{ fontSize: 16, color: "#28c76f" }}>{fmt(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* ── Tips ── */}
                <div className="rounded-3 p-4 mb-4"
                  style={{ background: "#f8f9fc", border: "1px solid #eef0f6", fontSize: 12.5, color: "#555" }}>
                  <div className="fw-semibold mb-2" style={{ color: "#444", fontSize: 13 }}>
                    <i className="bx bx-bulb me-1 text-warning" /> Tips
                  </div>
                  <ul className="mb-0 ps-3" style={{ lineHeight: 1.9 }}>
                    <li>Select a product first to load its variants</li>
                    <li>Unit cost is auto-filled from the variant cost</li>
                    <li>Tax is applied on the total items subtotal</li>
                    <li>Expected delivery helps track order timeliness</li>
                  </ul>
                </div>

                {/* ── Error ── */}
                {error && (
                  <div className="rounded-3 p-3 mb-3 d-flex align-items-start gap-2"
                    style={{ background: "rgba(234,84,85,.07)", border: "1px solid rgba(234,84,85,.25)", fontSize: 13, color: "#c0392b" }}>
                    <i className="bx bx-error-circle mt-1 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* ── Actions ── */}
                <div className="d-flex flex-column gap-2">
                  <button type="submit" className="btn btn-primary w-100"
                    style={{ borderRadius: 10, fontWeight: 600 }} disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" style={{ width: 14, height: 14 }} />
                        Creating…
                      </>
                    ) : (
                      <><i className="bx bx-check me-1" />Create Purchase Order</>
                    )}
                  </button>
                  <button type="button" className="btn btn-outline-secondary w-100"
                    style={{ borderRadius: 10 }} onClick={() => navigate(-1)} disabled={saving}>
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