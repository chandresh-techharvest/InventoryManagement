import { useCallback, useEffect, useMemo, useState } from "react";
import { getProducts } from "../../lib/productApi";
import { getInventory, getStockMovements, transferStock } from "../../lib/inventoryAPI";
import { getWarehouses } from "../../lib/WarehouseAPI";

const EMPTY_FORM = { productId: "", variantId: "", fromWarehouse: "", toWarehouse: "", quantity: "", notes: "" };

const formatVariant = (variant) => {
  if (!variant) return "-";
  const attrs = Object.entries(variant.attributes || {});
  return attrs.length ? attrs.map(([k, v]) => `${k}: ${v}`).join(", ") : "Default";
};

const fmtDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const Toast = ({ toast, onClose }) => (
  <div
    style={{
      position: "fixed",
      top: 24,
      right: 24,
      zIndex: 9999,
      background: toast.type === "error" ? "#ea5455" : "#28c76f",
      color: "#fff",
      borderRadius: 12,
      padding: "14px 16px",
      minWidth: 320,
      boxShadow: "0 10px 28px rgba(0,0,0,.18)",
    }}
  >
    <div className="d-flex align-items-start gap-2">
      <i className={`bx ${toast.type === "error" ? "bx-error-circle" : "bx-check-circle"}`} style={{ fontSize: 20 }} />
      <div style={{ flex: 1, fontSize: 13.5 }}>{toast.message}</div>
      <button type="button" onClick={onClose} style={{ border: "none", background: "transparent", color: "#fff", padding: 0 }}>
        x
      </button>
    </div>
  </div>
);

const Field = ({ label, required, error, hint, children }) => (
  <div>
    <label className="form-label mb-1" style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px" }}>
      {label}
      {required ? <span className="text-danger ms-1">*</span> : null}
    </label>
    {children}
    {error ? <div className="text-danger mt-1" style={{ fontSize: 11.5 }}>{error}</div> : null}
    {!error && hint ? <div className="text-muted mt-1" style={{ fontSize: 11.5 }}>{hint}</div> : null}
  </div>
);

export default function Transfers() {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const pushToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    window.clearTimeout(pushToast.timer);
    pushToast.timer = window.setTimeout(() => setToast(null), 4000);
  }, []);

  const loadData = useCallback(async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    setLoadError("");
    try {
      const [productRes, warehouseRes, inventoryRes, movementRes] = await Promise.all([
        getProducts(),
        getWarehouses(),
        getInventory(),
        getStockMovements({ movementType: "TRANSFER" }),
      ]);

      const productRows = productRes.data?.data || [];
      const movementRows = movementRes.data?.data || [];

      setProducts(productRows);
      setWarehouses(warehouseRes.data?.data || []);
      setInventory(inventoryRes.data?.data || []);
      setRecentTransfers(
        movementRows
          .filter((row) => row.movementType === "TRANSFER" && row.quantity > 0)
          .slice(0, 8)
          .map((row) => {
            const variant = productRows.find((p) => p._id === row.productId?._id)?.variants?.find((v) => v._id === row.variantId);
            return {
              id: row.transferGroupId || row._id,
              productName: row.productId?.name || "-",
              sku: row.productId?.sku || "-",
              variantLabel: formatVariant(variant),
              fromWarehouse: row.counterpartyWarehouseId?.name || "Source warehouse",
              toWarehouse: row.warehouseId?.name || "Destination warehouse",
              quantity: Math.abs(row.quantity),
              date: row.date,
              notes: row.notes || "",
            };
          })
      );
      setLastUpdated(new Date());
    } catch (err) {
      setLoadError(err?.response?.data?.error || err?.response?.data?.message || "Failed to load transfer workspace");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    return () => window.clearTimeout(pushToast.timer);
  }, [loadData, pushToast]);

  const selectedProduct = useMemo(() => products.find((p) => p._id === form.productId), [products, form.productId]);
  const variants = selectedProduct?.variants || [];
  const selectedVariant = useMemo(() => variants.find((v) => v._id === form.variantId), [variants, form.variantId]);
  const activeWarehouses = useMemo(() => warehouses.filter((w) => w.isActive), [warehouses]);

  const sourceOptions = useMemo(() => {
    if (!form.productId || !form.variantId) return [];
    return inventory
      .filter((row) => row.productId?._id === form.productId && String(row.variantId) === form.variantId && (row.availableQuantity || 0) > 0)
      .map((row) => {
        const warehouse = activeWarehouses.find((item) => item._id === row.warehouseId?._id);
        if (!warehouse) return null;
        return {
          warehouseId: warehouse._id,
          warehouseName: warehouse.name,
          code: warehouse.code,
          availableQuantity: row.availableQuantity || 0,
          quantityOnHand: row.quantityOnHand || 0,
          quantityReserved: row.quantityReserved || 0,
          isLowStock: Boolean(row.isLowStock),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.availableQuantity - a.availableQuantity || a.warehouseName.localeCompare(b.warehouseName));
  }, [activeWarehouses, form.productId, form.variantId, inventory]);

  const selectedSource = useMemo(() => sourceOptions.find((item) => item.warehouseId === form.fromWarehouse) || null, [sourceOptions, form.fromWarehouse]);
  const availableQty = selectedSource?.availableQuantity || 0;
  const destinationOptions = useMemo(() => activeWarehouses.filter((w) => w._id !== form.fromWarehouse), [activeWarehouses, form.fromWarehouse]);
  const selectedDestination = useMemo(() => warehouses.find((w) => w._id === form.toWarehouse) || null, [warehouses, form.toWarehouse]);

  const validationErrors = useMemo(() => {
    const next = {};
    if (!form.productId) next.productId = "Select a product";
    if (!form.variantId) next.variantId = "Select a variant";
    if (!form.fromWarehouse) next.fromWarehouse = "Select a source warehouse";
    if (!form.toWarehouse) next.toWarehouse = "Select a destination warehouse";
    if (form.fromWarehouse && form.toWarehouse && form.fromWarehouse === form.toWarehouse) next.toWarehouse = "Warehouses must be different";
    const qty = Number(form.quantity);
    if (!form.quantity) next.quantity = "Enter a quantity";
    else if (!Number.isFinite(qty) || qty <= 0) next.quantity = "Enter a valid quantity";
    else if (qty > availableQty) next.quantity = `Only ${availableQty} units are available`;
    if (form.notes.trim().length > 500) next.notes = "Notes must be under 500 characters";
    return next;
  }, [availableQty, form]);

  const handleField = (key, value) => {
    setForm((prev) => {
      if (key === "productId") return { ...prev, productId: value, variantId: "", fromWarehouse: "", toWarehouse: "", quantity: "" };
      if (key === "variantId") return { ...prev, variantId: value, fromWarehouse: "", toWarehouse: "", quantity: "" };
      if (key === "fromWarehouse") return { ...prev, fromWarehouse: value, toWarehouse: prev.toWarehouse === value ? "" : prev.toWarehouse, quantity: "" };
      return { ...prev, [key]: value };
    });
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleReset = () => {
    setForm({ ...EMPTY_FORM });
    setErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);
    try {
      const response = await transferStock({
        productId: form.productId,
        variantId: form.variantId,
        fromWarehouse: form.fromWarehouse,
        toWarehouse: form.toWarehouse,
        quantity: Number(form.quantity),
        notes: form.notes.trim(),
      });
      const result = response.data?.data;
      pushToast(`Transferred ${result?.quantity || form.quantity} units of ${selectedProduct?.name || "product"}.`);
      handleReset();
      await loadData(true);
    } catch (err) {
      pushToast(err?.response?.data?.error || err?.response?.data?.message || "Transfer failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const summary = [
    ["Product", selectedProduct?.name || "-"],
    ["SKU", selectedProduct?.sku || "-"],
    ["Variant", formatVariant(selectedVariant)],
    ["From", selectedSource?.warehouseName || "-"],
    ["To", selectedDestination?.name || "-"],
    ["Available", availableQty ? `${availableQty} units` : "-"],
    ["Transfer Qty", form.quantity ? `${form.quantity} units` : "-"],
    ["Projected Balance", form.quantity && availableQty >= Number(form.quantity) ? `${availableQty - Number(form.quantity)} units` : "-"],
  ];

  const submitDisabled = loading || submitting || Object.keys(validationErrors).length > 0;

  return (
    <>
      <style>{`
        .tf-card { background: #fff; border: 1px solid #eef0f6; border-radius: 16px; padding: 24px; box-shadow: 0 8px 24px rgba(34,41,47,.04); }
        .tf-input:focus { border-color: #7367f0 !important; box-shadow: 0 0 0 .18rem rgba(115,103,240,.2) !important; }
        .tf-choice { border: 1px solid #e0e2e9; border-radius: 12px; padding: 14px; cursor: pointer; transition: all .16s; height: 100%; }
        .tf-choice:hover { border-color: #7367f0; background: rgba(115,103,240,.03); }
        .tf-choice.active { border-color: #7367f0; background: rgba(115,103,240,.06); box-shadow: 0 8px 18px rgba(115,103,240,.12); }
        .tf-recent { padding: 14px 0; border-bottom: 1px solid #f0f1f5; }
        .tf-recent:last-child { border-bottom: none; padding-bottom: 0; }
      `}</style>

      {toast ? <Toast toast={toast} onClose={() => setToast(null)} /> : null}

      <div className="container-xxl container-p-y">
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h4 className="fw-bold mb-1"><i className="bx bx-transfer me-2 text-primary" />Stock Transfer</h4>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              Real-time warehouse transfer with stock validation, notes, and audit history.
              {lastUpdated ? <span className="ms-2">Last sync {fmtDate(lastUpdated)}</span> : null}
            </p>
          </div>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => loadData(true)} disabled={loading || refreshing}>
            <i className={`bx bx-refresh me-1 ${refreshing ? "bx-spin" : ""}`} />Refresh
          </button>
        </div>

        {loadError && !loading ? (
          <div className="alert alert-danger mb-4 d-flex justify-content-between align-items-center">
            <span>{loadError}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => loadData(false)}>Retry</button>
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            <div className="col-12 col-xl-8">
              <div className="tf-card mb-4">
                <div className="mb-4">
                  <div className="fw-semibold">1. Product and variant</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>Transfers stay variant-level so movement history matches actual stock.</div>
                </div>
                <div className="row g-3">
                  <div className="col-12">
                    <Field label="Product" required error={errors.productId}>
                      <select className="form-select tf-input" value={form.productId} onChange={(e) => handleField("productId", e.target.value)} disabled={loading}>
                        <option value="">Select a product</option>
                        {products.filter((p) => p.isActive !== false).sort((a, b) => a.name.localeCompare(b.name)).map((product) => (
                          <option key={product._id} value={product._id}>{product.name} ({product.sku})</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  {form.productId && variants.length > 0 ? (
                    <div className="col-12">
                      <Field label="Variant" required error={errors.variantId}>
                        <div className="row g-2 mt-1">
                          {variants.map((variant) => (
                            <div key={variant._id} className="col-md-6 col-lg-4">
                              <div className={`tf-choice ${form.variantId === variant._id ? "active" : ""}`} onClick={() => handleField("variantId", variant._id)}>
                                <div className="fw-semibold" style={{ fontSize: 13 }}>{formatVariant(variant)}</div>
                                <div className="text-muted" style={{ fontSize: 11.5 }}>Price Rs. {variant.price} | Cost Rs. {variant.cost}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Field>
                    </div>
                  ) : null}
                  {form.productId && variants.length === 0 ? <div className="col-12 text-danger" style={{ fontSize: 13 }}>This product has no variants, so it cannot be transferred with the current inventory model.</div> : null}
                </div>
              </div>

              <div className="tf-card mb-4">
                <div className="mb-4">
                  <div className="fw-semibold">2. Route selection</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>Only active warehouses with available stock appear as source options.</div>
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <Field label="From Warehouse" required error={errors.fromWarehouse} hint={sourceOptions.length ? "Live available stock is shown per warehouse." : "Choose a stocked variant first."}>
                      <select className="form-select tf-input" value={form.fromWarehouse} onChange={(e) => handleField("fromWarehouse", e.target.value)} disabled={!sourceOptions.length}>
                        <option value="">Select source warehouse</option>
                        {sourceOptions.map((option) => (
                          <option key={option.warehouseId} value={option.warehouseId}>{option.warehouseName} ({option.availableQuantity} available)</option>
                        ))}
                      </select>
                    </Field>
                    {selectedSource ? (
                      <div className="rounded-3 p-3 mt-3" style={{ background: "#f8f9fc", border: "1px solid #eef0f6", fontSize: 12.5 }}>
                        <div className="fw-semibold">{selectedSource.warehouseName}</div>
                        <div className="text-muted mt-1">On hand {selectedSource.quantityOnHand} | Reserved {selectedSource.quantityReserved} | Available {selectedSource.availableQuantity}</div>
                        <div className={selectedSource.isLowStock ? "text-warning mt-1" : "text-success mt-1"}>{selectedSource.isLowStock ? "Low stock" : "Healthy stock"}</div>
                      </div>
                    ) : null}
                  </div>
                  <div className="col-md-6">
                    <Field label="To Warehouse" required error={errors.toWarehouse}>
                      <select className="form-select tf-input" value={form.toWarehouse} onChange={(e) => handleField("toWarehouse", e.target.value)} disabled={!form.fromWarehouse}>
                        <option value="">Select destination warehouse</option>
                        {destinationOptions.map((warehouse) => (
                          <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>
                        ))}
                      </select>
                    </Field>
                    {selectedDestination ? (
                      <div className="rounded-3 p-3 mt-3" style={{ background: "#f8f9fc", border: "1px solid #eef0f6", fontSize: 12.5 }}>
                        <div className="fw-semibold">{selectedDestination.name}</div>
                        <div className="text-muted mt-1">Warehouse code {selectedDestination.code || "-"}</div>
                        <div className="text-muted mt-1">Inventory will be incremented or created automatically.</div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="tf-card">
                <div className="mb-4">
                  <div className="fw-semibold">3. Execution</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>The backend posts a transactional transfer and logs both sides of the movement.</div>
                </div>
                <div className="row g-3">
                  <div className="col-md-4">
                    <Field label="Quantity" required error={errors.quantity} hint={availableQty ? `Maximum ${availableQty} units.` : "Select source inventory first."}>
                      <div className="input-group">
                        <button type="button" className="btn btn-outline-secondary" onClick={() => handleField("quantity", String(Math.max(0, Number(form.quantity || 0) - 1)))} disabled={!availableQty}>
                          <i className="bx bx-minus" />
                        </button>
                        <input type="number" className="form-control tf-input text-center" value={form.quantity} min="1" max={availableQty || undefined} onChange={(e) => handleField("quantity", e.target.value)} disabled={!availableQty} />
                        <button type="button" className="btn btn-outline-secondary" onClick={() => handleField("quantity", String(Number(form.quantity || 0) + 1))} disabled={!availableQty}>
                          <i className="bx bx-plus" />
                        </button>
                      </div>
                    </Field>
                  </div>
                  <div className="col-md-8">
                    <Field label="Notes" error={errors.notes} hint="Stored in stock movement history for audit and follow-up.">
                      <textarea className="form-control tf-input" rows="4" value={form.notes} onChange={(e) => handleField("notes", e.target.value)} placeholder="Reason for transfer, reference, or handling instruction" />
                    </Field>
                  </div>
                  {availableQty > 0 ? (
                    <div className="col-12 d-flex gap-2 flex-wrap">
                      {[25, 50, 75, 100].map((pct) => {
                        const qty = Math.floor((availableQty * pct) / 100);
                        return qty > 0 ? <button key={pct} type="button" className="btn btn-sm btn-outline-secondary" onClick={() => handleField("quantity", String(qty))}>{pct}% ({qty})</button> : null;
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-4">
              <div className="tf-card mb-4">
                <div className="fw-semibold mb-3"><i className="bx bx-receipt me-2 text-primary" />Transfer Summary</div>
                <div className="d-flex flex-column gap-2" style={{ fontSize: 13 }}>
                  {summary.map(([label, value]) => (
                    <div key={label} className="d-flex justify-content-between py-1" style={{ borderBottom: "1px dashed #f0f1f5" }}>
                      <span className="text-muted">{label}</span>
                      <span className="fw-semibold text-end ms-3" style={{ maxWidth: 170 }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-3 p-3 mt-3" style={{ background: "#f8f9fc", border: "1px solid #eef0f6", fontSize: 12.5 }}>
                  <div className={form.productId && form.variantId ? "text-success" : "text-muted"}>Variant selected</div>
                  <div className={form.fromWarehouse && form.toWarehouse ? "text-success" : "text-muted"}>Route selected</div>
                  <div className={form.quantity && !validationErrors.quantity ? "text-success" : "text-muted"}>Quantity validated</div>
                </div>
                <div className="mt-4 d-flex flex-column gap-2">
                  <button type="submit" className="btn btn-primary w-100" disabled={submitDisabled}>
                    {submitting ? "Posting transfer..." : "Execute Transfer"}
                  </button>
                  <button type="button" className="btn btn-outline-secondary w-100" onClick={handleReset}>Reset</button>
                </div>
              </div>

              <div className="tf-card mb-4">
                <div className="fw-semibold mb-3"><i className="bx bx-history me-2 text-muted" />Recent Transfers</div>
                {recentTransfers.length ? recentTransfers.map((item) => (
                  <div key={item.id} className="tf-recent">
                    <div className="d-flex justify-content-between gap-2">
                      <div>
                        <div className="fw-semibold" style={{ fontSize: 13 }}>{item.productName}</div>
                        <div className="text-muted" style={{ fontSize: 11.5 }}>{item.variantLabel} | {item.sku}</div>
                      </div>
                      <span className="badge bg-label-primary">{item.quantity} units</span>
                    </div>
                    <div className="text-muted mt-2" style={{ fontSize: 12 }}>{item.fromWarehouse} to {item.toWarehouse}</div>
                    <div className="text-muted" style={{ fontSize: 11.5 }}>{fmtDate(item.date)}</div>
                    {item.notes ? <div style={{ fontSize: 11.5, color: "#666" }}>{item.notes}</div> : null}
                  </div>
                )) : <div className="text-muted" style={{ fontSize: 12.5 }}>No transfers recorded yet.</div>}
              </div>

              <div className="rounded-3 p-4" style={{ background: "#f8f9fc", border: "1px solid #eef0f6", fontSize: 12.5, color: "#555" }}>
                <div className="fw-semibold mb-2" style={{ fontSize: 13, color: "#444" }}><i className="bx bx-shield-quarter me-1 text-warning" />ERP safeguards</div>
                <ul className="mb-0 ps-3" style={{ lineHeight: 1.8 }}>
                  <li>Reserved stock is not transferable.</li>
                  <li>Inactive warehouses are blocked.</li>
                  <li>Both sides of the transfer are logged.</li>
                  <li>Destination stock is upserted automatically.</li>
                  <li>Notes are saved into movement history.</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
