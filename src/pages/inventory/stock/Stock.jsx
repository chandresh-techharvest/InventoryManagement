import { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getInventory,
  getLowStock,
  adjustStock,
  getTotalStock,
} from "../../../lib/inventoryAPI";
import { getWarehouses } from "../../../lib/WarehouseAPI";

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

const fmtNum = (n = 0) => Number(n).toLocaleString("en-IN");

const STATUS_META = {
  In:  { label: "In Stock",      cls: "bg-label-success", dot: "#28c76f" },
  Low: { label: "Low Stock",     cls: "bg-label-warning", dot: "#ff9f43" },
  Out: { label: "Out of Stock",  cls: "bg-label-danger",  dot: "#ea5455" },
};

const getStatus = (i) =>
  i.quantityOnHand === 0 ? "Out" : i.isLowStock ? "Low" : "In";

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */
const SkeletonRow = () => (
  <tr>
    {[...Array(9)].map((_, i) => (
      <td key={i} style={{ padding: "14px 16px" }}>
        <div style={{
          height: 13, borderRadius: 6,
          width: [44, "80%", "60%", 50, 50, 55, 60, 70, 44][i],
          background: "linear-gradient(90deg,#f0f1f5 25%,#e4e6ed 50%,#f0f1f5 75%)",
          backgroundSize: "200% 100%", animation: "sk-shimmer 1.4s infinite",
        }} />
      </td>
    ))}
  </tr>
);

/* ─── Stat card ────────────────────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, sub, accent, onClick, active }) => (
  <div className="col-6 col-xl-3">
    <div className="card h-100 mb-0" onClick={onClick}
      style={{
        borderTop: `3px solid ${accent}`,
        boxShadow: active ? `0 4px 16px ${accent}30` : "0 1px 8px rgba(0,0,0,.06)",
        transition: "all .18s", cursor: onClick ? "pointer" : "default",
        transform: active ? "translateY(-2px)" : "none",
        background: active ? `${accent}06` : "#fff",
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 18px ${accent}28`; }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,.06)"; }}}
    >
      <div className="card-body d-flex align-items-center gap-3 p-3">
        <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 48, height: 48, background: accent + "18", fontSize: 22 }}>{icon}</div>
        <div className="overflow-hidden">
          <p className="text-muted small mb-0 text-truncate">{label}</p>
          <h4 className="mb-0 fw-bold" style={{ letterSpacing: "-0.5px" }}>{value}</h4>
          {sub && <p className="text-muted mb-0" style={{ fontSize: 11 }}>{sub}</p>}
        </div>
      </div>
    </div>
  </div>
);

/* ─── Batch drawer ─────────────────────────────────────────────────────────── */
const BatchDrawer = ({ item }) => {
  if (!item.batches?.length)
    return (
      <div className="text-center py-3 text-muted small">
        <i className="bx bx-package me-1" />No batch records
      </div>
    );
  return (
    <div style={{ background: "#f8f9fc", borderRadius: 8, padding: "16px 20px" }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <span className="fw-semibold" style={{ fontSize: 13 }}>
          <i className="bx bx-list-ul me-2 text-primary" />Batch Breakdown — {item.productId?.name}
        </span>
        <span className="badge bg-label-primary">{item.batches.length} batch{item.batches.length !== 1 ? "es" : ""}</span>
      </div>
      <div className="table-responsive">
        <table className="table table-sm table-bordered mb-0" style={{ fontSize: 12.5 }}>
          <thead style={{ background: "#eef0f6" }}>
            <tr>
              <th>Batch #</th><th>Expiry Date</th>
              <th className="text-end">Qty</th><th>Expiry Status</th>
            </tr>
          </thead>
          <tbody>
            {item.batches.map((b, idx) => {
              const diff = Math.ceil((new Date(b.expiryDate) - new Date()) / 86400000);
              const expStatus = diff < 0
                ? { label: "Expired",        cls: "bg-label-danger"  }
                : diff <= 30
                ? { label: `Exp in ${diff}d`, cls: "bg-label-warning" }
                : { label: "Valid",           cls: "bg-label-success" };
              return (
                <tr key={idx}>
                  <td className="fw-medium">{b.batchNumber || "—"}</td>
                  <td>{fmtDate(b.expiryDate)}</td>
                  <td className="text-end fw-semibold">{fmtNum(b.quantity)}</td>
                  <td><span className={`badge ${expStatus.cls}`} style={{ fontSize: 11 }}>{expStatus.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ─── Adjust Stock Modal ──────────────────────────────────────────────────── */
const AdjustModal = ({ item, onClose, onSuccess }) => {
  const [adjType, setAdjType] = useState("IN");
  const [qty,     setQty]     = useState("");
  const [reason,  setReason]  = useState("");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const available = item?.availableQuantity ?? 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!qty || Number(qty) <= 0) { setError("Enter a valid quantity"); return; }
    if (adjType === "OUT" && Number(qty) > available) {
      setError(`Cannot remove more than ${available} available units`);
      return;
    }
    setSaving(true);
    try {
      await adjustStock({
        inventoryId:    item._id,
        adjustmentType: adjType,
        quantity:       Number(qty),
        reason:         reason || `Manual ${adjType} adjustment`,
      });
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Adjustment failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(22,29,49,.46)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(2px)", animation: "sk-fadein .15s ease",
    }}>
      <div className="card" style={{ width: 460, borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,.22)", border: "none", animation: "sk-popup .2s cubic-bezier(.34,1.56,.64,1)" }}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h5 className="fw-bold mb-0">Adjust Stock</h5>
              <p className="text-muted mb-0" style={{ fontSize: 12.5 }}>{item.productId?.name} · {item.warehouseId?.name}</p>
            </div>
            <button className="btn btn-sm btn-outline-secondary" style={{ width: 32, height: 32, padding: 0, borderRadius: 8 }} onClick={onClose}>
              <i className="bx bx-x" style={{ fontSize: 16 }} />
            </button>
          </div>

          {/* current stock info */}
          <div className="row g-2 mb-4">
            {[
              { label: "On Hand",   value: fmtNum(item.quantityOnHand),   color: "#333"    },
              { label: "Reserved",  value: fmtNum(item.quantityReserved), color: "#ff9f43" },
              { label: "Available", value: fmtNum(available),             color: "#7367f0" },
            ].map(({ label, value, color }) => (
              <div key={label} className="col-4">
                <div className="text-center p-2 rounded-3" style={{ background: "#f8f9fc", border: "1px solid #eef0f6" }}>
                  <div className="fw-bold" style={{ fontSize: 18, color }}>{value}</div>
                  <div className="text-muted" style={{ fontSize: 11 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* IN / OUT toggle */}
            <div className="d-flex gap-2 mb-3">
              {["IN", "OUT"].map(t => (
                <button key={t} type="button"
                  className={`btn flex-fill ${adjType === t ? (t === "IN" ? "btn-success" : "btn-danger") : "btn-outline-secondary"}`}
                  style={{ borderRadius: 10, fontWeight: 600 }}
                  onClick={() => setAdjType(t)}>
                  <i className={`bx ${t === "IN" ? "bx-trending-up" : "bx-trending-down"} me-1`} />
                  Stock {t}
                </button>
              ))}
            </div>

            <div className="mb-3">
              <label className="form-label mb-1" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".4px" }}>
                Quantity <span className="text-danger">*</span>
              </label>
              <input type="number" className="form-control sk-inp" min={1}
                value={qty} onChange={e => setQty(e.target.value)}
                placeholder={adjType === "OUT" ? `Max: ${available}` : "Enter quantity"}
                style={{ fontSize: 14, borderColor: "#e0e2e9" }} />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".4px" }}>
                Reason
              </label>
              <input type="text" className="form-control sk-inp"
                value={reason} onChange={e => setReason(e.target.value)}
                placeholder="e.g. Damaged goods, found stock, correction…"
                style={{ fontSize: 13.5, borderColor: "#e0e2e9" }} />
            </div>

            {error && (
              <div className="rounded-3 p-2 mb-3 d-flex align-items-center gap-2"
                style={{ background: "rgba(234,84,85,.07)", border: "1px solid rgba(234,84,85,.25)", fontSize: 13, color: "#c0392b" }}>
                <i className="bx bx-error-circle" />{error}
              </div>
            )}

            <div className="d-flex gap-2">
              <button type="button" className="btn btn-outline-secondary flex-fill" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="submit" className={`btn flex-fill ${adjType === "IN" ? "btn-success" : "btn-danger"}`} disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2" style={{ width: 14, height: 14 }} />Saving…</> : `Apply ${adjType}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ─── Total Stock Modal ───────────────────────────────────────────────────── */
const TotalStockModal = ({ productId, productName, onClose }) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTotalStock(productId)
      .then(r => setData(r.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [productId]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(22,29,49,.46)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(2px)", animation: "sk-fadein .15s ease",
    }}>
      <div className="card" style={{ width: 500, maxHeight: "80vh", overflowY: "auto", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,.22)", border: "none", animation: "sk-popup .2s cubic-bezier(.34,1.56,.64,1)" }}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h5 className="fw-bold mb-0">Total Stock — All Warehouses</h5>
              <p className="text-muted mb-0" style={{ fontSize: 12.5 }}>{productName}</p>
            </div>
            <button className="btn btn-sm btn-outline-secondary" style={{ width: 32, height: 32, padding: 0, borderRadius: 8 }} onClick={onClose}>
              <i className="bx bx-x" style={{ fontSize: 16 }} />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-4"><div className="spinner-border text-primary" role="status" /></div>
          ) : !data ? (
            <p className="text-muted text-center">Failed to load data</p>
          ) : (
            <>
              <div className="row g-3 mb-4">
                {[
                  { label: "Total On Hand",  value: fmtNum(data.totalQuantity),  color: "#333"    },
                  { label: "Total Available",value: fmtNum(data.totalAvailable), color: "#7367f0" },
                  { label: "Total Reserved", value: fmtNum(data.totalReserved),  color: "#ff9f43" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="col-4">
                    <div className="text-center p-3 rounded-3" style={{ background: "#f8f9fc", border: "1px solid #eef0f6" }}>
                      <div className="fw-bold" style={{ fontSize: 20, color }}>{value}</div>
                      <div className="text-muted" style={{ fontSize: 11.5 }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 13 }}>
                <div className="fw-semibold mb-2" style={{ fontSize: 13.5 }}>Warehouse Breakdown</div>
                {data.breakdown?.map((b, i) => (
                  <div key={i} className="d-flex align-items-center justify-content-between py-2"
                    style={{ borderBottom: "1px solid #f0f1f5" }}>
                    <div>
                      <div className="fw-semibold">{b.warehouse?.name || "—"}</div>
                      <div className="text-muted" style={{ fontSize: 11.5 }}>
                        Reserved: {fmtNum(b.quantityReserved)} · Safety: {fmtNum(b.safetyStock)}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold" style={{ color: "#7367f0" }}>{fmtNum(b.availableQuantity)}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>of {fmtNum(b.quantityOnHand)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Toast ────────────────────────────────────────────────────────────────── */
const Toast = ({ message, type }) => {
  const c = { success: "#28c76f", error: "#ea5455", warn: "#ff9f43" };
  return (
    <div style={{
      position: "fixed", top: 24, right: 24, zIndex: 10000,
      background: "#fff", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,.14)",
      padding: "14px 20px", display: "flex", alignItems: "center", gap: 12,
      minWidth: 300, borderLeft: `4px solid ${c[type] || c.success}`,
      animation: "sk-slidein .25s cubic-bezier(.34,1.56,.64,1)",
    }}>
      <span style={{ fontSize: 18 }}>{type === "success" ? "✅" : "❌"}</span>
      <span style={{ fontSize: 13.5, color: "#333", fontWeight: 500 }}>{message}</span>
    </div>
  );
};

/* ─── Main Component ───────────────────────────────────────────────────────── */
export default function Stock() {
  const navigate = useNavigate();
  const { subdomain } = useParams();
  const to = (path) => `/dashboard/${subdomain}/${path}`;


  const [data,       setData]       = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [expanded,   setExpanded]   = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  /* filters */
  const [search,          setSearch]          = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [statusFilter,    setStatusFilter]    = useState("all");

  /* sort */
  const [sortKey, setSortKey] = useState("product");
  const [sortDir, setSortDir] = useState("asc");

  /* pagination */
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  /* modals */
  const [adjustTarget,     setAdjustTarget]     = useState(null);
  const [totalStockTarget, setTotalStockTarget] = useState(null);
  const [toast,            setToast]            = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* fetch */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, whRes] = await Promise.all([
        getInventory(),
        getWarehouses(),
      ]);
      setData(invRes.data.data || invRes.data || []);
      setWarehouses(whRes.data.data || whRes.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Stock fetch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, warehouseFilter, statusFilter]);

  /* stats */
  const stats = useMemo(() => {
    const total   = data.length;
    const inStock = data.filter(i => getStatus(i) === "In").length;
    const low     = data.filter(i => getStatus(i) === "Low").length;
    const out     = data.filter(i => getStatus(i) === "Out").length;
    return { total, inStock, low, out };
  }, [data]);

  /* filtered + sorted */
  const processed = useMemo(() => {
    let rows = [...data];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(i =>
        i.productId?.name?.toLowerCase().includes(q) ||
        i.warehouseId?.name?.toLowerCase().includes(q) ||
        i.productId?.sku?.toLowerCase().includes(q)
      );
    }
    if (warehouseFilter !== "all") rows = rows.filter(i => i.warehouseId?._id === warehouseFilter);
    if (statusFilter    !== "all") rows = rows.filter(i => getStatus(i) === statusFilter);

    rows.sort((a, b) => {
      let av, bv;
      if (sortKey === "product")   { av = a.productId?.name || ""; bv = b.productId?.name || ""; }
      else if (sortKey === "warehouse") { av = a.warehouseId?.name || ""; bv = b.warehouseId?.name || ""; }
      else if (sortKey === "onHand")    { av = a.quantityOnHand || 0;  bv = b.quantityOnHand || 0; }
      else if (sortKey === "available") { av = a.availableQuantity || 0; bv = b.availableQuantity || 0; }
      else { av = a[sortKey] || 0; bv = b[sortKey] || 0; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
    return rows;
  }, [data, search, warehouseFilter, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processed.length / PER_PAGE));
  const paged = processed.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const SortIcon = ({ col }) => (
    sortKey !== col
      ? <i className="bx bx-sort ms-1 text-muted" style={{ fontSize: 12 }} />
      : <i className={`bx bx-sort-${sortDir === "asc" ? "up" : "down"} ms-1 text-primary`} style={{ fontSize: 12 }} />
  );

  const exportCSV = () => {
    const headers = ["Product", "SKU", "Warehouse", "On Hand", "Reserved", "Available", "Reorder Level", "Status"];
    const rows = processed.map(i => [
      i.productId?.name || "", i.productId?.sku || "",
      i.warehouseId?.name || "",
      i.quantityOnHand, i.quantityReserved, i.availableQuantity,
      i.reorderLevel, STATUS_META[getStatus(i)].label,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `stock_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = search || warehouseFilter !== "all" || statusFilter !== "all";
  const resetFilters = () => { setSearch(""); setWarehouseFilter("all"); setStatusFilter("all"); setPage(1); };

  const buildPages = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
      else if (Math.abs(i - page) === 2) pages.push("…");
    }
    return pages.filter((v, i, a) => a[i - 1] !== v);
  };

  return (
    <>
      <style>{`
        @keyframes sk-shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes sk-fadein   { from{opacity:0} to{opacity:1} }
        @keyframes sk-popup    { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
        @keyframes sk-slidein  { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes sk-row      { from{opacity:0;transform:translateY(3px)} to{opacity:1;transform:translateY(0)} }
        .sort-th { cursor:pointer;user-select:none;white-space:nowrap; }
        .sort-th:hover { background:rgba(115,103,240,.05)!important; }
        .expand-btn { transition:transform .18s; }
        .expand-btn.open { transform:rotate(90deg); }
        .batch-row td { padding:0!important;border-top:none!important; }
        .batch-cell { padding:0 16px 16px!important; }
        .row-hover:hover td { background:rgba(115,103,240,.03)!important;cursor:pointer; }
        .filter-tab { cursor:pointer;padding:5px 14px;border-radius:20px;font-size:13px;transition:all .15s;border:1px solid transparent; }
        .filter-tab.active { background:#7367f0;color:#fff;border-color:#7367f0; }
        .filter-tab:not(.active):hover { border-color:#7367f0;color:#7367f0; }
        .sk-inp:focus { border-color:#7367f0!important;box-shadow:0 0 0 .18rem rgba(115,103,240,.2)!important; }
        .sk-act { width:30px;height:30px;padding:0;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;font-size:14px;transition:all .15s; }
        .sk-act:hover { transform:translateY(-1px);box-shadow:0 3px 8px rgba(0,0,0,.12); }
        .sk-pg { width:34px;height:34px;padding:0;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:500;transition:all .15s; }
        .sk-pg.active { background:#7367f0;border-color:#7367f0;color:#fff; }
        .sk-pg:not(.active):not(:disabled):hover { border-color:#7367f0;color:#7367f0; }
      `}</style>

      {toast            && <Toast message={toast.message} type={toast.type} />}
      {adjustTarget     && (
        <AdjustModal
          item={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onSuccess={() => {
            setAdjustTarget(null);
            showToast("Stock adjusted successfully!");
            fetchData();
          }}
        />
      )}
      {totalStockTarget && (
        <TotalStockModal
          productId={totalStockTarget.id}
          productName={totalStockTarget.name}
          onClose={() => setTotalStockTarget(null)}
        />
      )}

      <div className="container-xxl container-p-y">

        {/* ── Header ── */}
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-4">
          <div>
            <h4 className="fw-bold mb-1">
              <i className="bx bx-package me-2 text-primary" />Stock Inventory
            </h4>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              Real-time levels across all warehouses
              {lastUpdated && <span className="ms-2">· {lastUpdated.toLocaleTimeString("en-IN")}</span>}
            </p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={fetchData} disabled={loading}>
              <i className={`bx bx-refresh me-1 ${loading ? "bx-spin" : ""}`} />Refresh
            </button>
            <button className="btn btn-outline-primary btn-sm" onClick={exportCSV} disabled={!processed.length}>
              <i className="bx bx-download me-1" />Export CSV
            </button>
            <Link className="btn btn-primary btn-sm" to="add">
              <i className="bx bx-plus me-1" />Add Stock
            </Link>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="row g-3 mb-4">
          <StatCard icon="📦" label="Total SKUs"     value={fmtNum(stats.total)}
            sub="Tracked records" accent="#7367f0" />
          <StatCard icon="✅" label="In Stock"        value={fmtNum(stats.inStock)}
            sub={`${stats.total ? Math.round((stats.inStock / stats.total) * 100) : 0}% healthy`}
            accent="#28c76f" active={statusFilter === "In"}
            onClick={() => setStatusFilter(statusFilter === "In" ? "all" : "In")} />
          <StatCard icon="⚠️" label="Low Stock"       value={fmtNum(stats.low)}
            sub="Needs reorder" accent="#ff9f43" active={statusFilter === "Low"}
            onClick={() => setStatusFilter(statusFilter === "Low" ? "all" : "Low")} />
          <StatCard icon="🚫" label="Out of Stock"    value={fmtNum(stats.out)}
            sub="Immediate action" accent="#ea5455" active={statusFilter === "Out"}
            onClick={() => setStatusFilter(statusFilter === "Out" ? "all" : "Out")} />
        </div>

        {/* ── Filter bar ── */}
        <div className="card mb-3" style={{ boxShadow: "0 1px 10px rgba(0,0,0,.05)", borderRadius: 12 }}>
          <div className="card-body py-3 px-4">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-4">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-transparent border-end-0">
                    <i className="bx bx-search text-muted" />
                  </span>
                  <input type="text" className="form-control border-start-0 sk-inp"
                    placeholder="Search product, SKU or warehouse…"
                    value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                    style={{ fontSize: 13 }} />
                  {search && <button className="btn btn-outline-secondary border-start-0" onClick={() => setSearch("")}><i className="bx bx-x" /></button>}
                </div>
              </div>

              <div className="col-6 col-md-3">
                <select className="form-select form-select-sm sk-inp" value={warehouseFilter}
                  onChange={e => { setWarehouseFilter(e.target.value); setPage(1); }} style={{ fontSize: 13 }}>
                  <option value="all">All Warehouses</option>
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>

              <div className="col-6 col-md-4">
                <div className="d-flex gap-1 flex-wrap">
                  {[{ key: "all", label: "All" }, { key: "In", label: "In Stock" }, { key: "Low", label: "Low" }, { key: "Out", label: "Out" }].map(t => (
                    <span key={t.key}
                      className={`filter-tab ${statusFilter === t.key ? "active" : "text-muted"}`}
                      onClick={() => { setStatusFilter(t.key); setPage(1); }}>
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>

              {hasFilters && (
                <div className="col-auto ms-auto">
                  <button className="btn btn-sm btn-link text-danger p-0" onClick={resetFilters}>
                    <i className="bx bx-filter-alt me-1" />Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="card" style={{ boxShadow: "0 1px 10px rgba(0,0,0,.06)", borderRadius: 12 }}>
          <div className="card-header d-flex align-items-center justify-content-between py-3"
            style={{ borderBottom: "1px solid #f0f1f5" }}>
            <div className="d-flex align-items-center gap-2">
              <span className="fw-semibold" style={{ fontSize: 14 }}>Stock Levels</span>
              <span className="badge bg-label-primary" style={{ fontSize: 11 }}>
                {processed.length} item{processed.length !== 1 ? "s" : ""}
              </span>
            </div>
            <span className="text-muted" style={{ fontSize: 12 }}>
              {Math.min((page - 1) * PER_PAGE + 1, processed.length)}–{Math.min(page * PER_PAGE, processed.length)} of {processed.length}
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle" style={{ fontSize: 13.5 }}>
              <thead style={{ background: "#f8f9fc" }}>
                <tr>
                  <th style={{ width: 44, padding: "12px 16px" }} />
                  <th className="sort-th" style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }} onClick={() => handleSort("product")}>Product <SortIcon col="product" /></th>
                  <th className="sort-th" style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }} onClick={() => handleSort("warehouse")}>Warehouse <SortIcon col="warehouse" /></th>
                  <th className="sort-th text-end" style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }} onClick={() => handleSort("onHand")}>On Hand <SortIcon col="onHand" /></th>
                  <th className="text-end" style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }}>Reserved</th>
                  <th className="sort-th text-end" style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }} onClick={() => handleSort("available")}>Available <SortIcon col="available" /></th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }}>Batches</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }}>Status</th>
                  <th style={{ padding: "12px 16px", width: 110 }} />
                </tr>
              </thead>

              <tbody>
                {loading && [...Array(6)].map((_, i) => <SkeletonRow key={i} />)}

                {!loading && paged.length === 0 && (
                  <tr><td colSpan="9" className="text-center py-5">
                    <div style={{ opacity: 0.5 }}>
                      <i className="bx bx-box d-block mb-2" style={{ fontSize: 46, color: "#7367f0" }} />
                      <p className="fw-semibold mb-1">No inventory records found</p>
                      <p className="text-muted mb-0" style={{ fontSize: 12.5 }}>
                        {hasFilters ? "Try adjusting your filters" : "Add stock to get started"}
                      </p>
                      {hasFilters && <button className="btn btn-link btn-sm mt-1 p-0" onClick={resetFilters}>Clear filters</button>}
                    </div>
                  </td></tr>
                )}

                {!loading && paged.map((item, idx) => {
                  const status = getStatus(item);
                  const meta   = STATUS_META[status];
                  const isOpen = expanded === item._id;
                  return (
                    <>
                      <tr key={item._id} className="row-hover"
                        style={{ borderBottom: "1px solid #f0f1f5", animation: `sk-row .2s ease ${idx * 0.025}s both` }}
                        onClick={() => setExpanded(isOpen ? null : item._id)}>

                        <td style={{ padding: "13px 16px" }} className="text-center">
                          <button className={`btn btn-sm btn-icon expand-btn ${isOpen ? "open" : ""}`}
                            style={{ width: 26, height: 26, padding: 0, background: isOpen ? "rgba(115,103,240,.12)" : "#f1f1f4", border: "none", borderRadius: 6, color: isOpen ? "#7367f0" : "#6e6b7b", fontSize: 14 }}
                            onClick={e => { e.stopPropagation(); setExpanded(isOpen ? null : item._id); }}>
                            <i className="bx bx-chevron-right" />
                          </button>
                        </td>

                        <td style={{ padding: "13px 16px" }}>
                          <div className="fw-semibold text-dark"
                            style={{ cursor: "pointer", color: "#7367f0" }}
                            onClick={e => { e.stopPropagation(); setTotalStockTarget({ id: item.productId?._id, name: item.productId?.name }); }}>
                            {item.productId?.name || <span className="text-muted">—</span>}
                          </div>
                          {item.productId?.sku && (
                            <span style={{ fontFamily: "monospace", fontSize: 11, background: "rgba(115,103,240,.08)", color: "#7367f0", padding: "1px 6px", borderRadius: 4 }}>
                              {item.productId.sku}
                            </span>
                          )}
                        </td>

                        <td style={{ padding: "13px 16px" }}>
                          <div className="d-flex align-items-center gap-2">
                            <span className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                              style={{ width: 28, height: 28, background: "rgba(115,103,240,.1)", fontSize: 14 }}>🏭</span>
                            <span>{item.warehouseId?.name || "—"}</span>
                          </div>
                        </td>

                        <td className="text-end fw-semibold" style={{ padding: "13px 16px", color: "#444" }}>
                          {fmtNum(item.quantityOnHand)}
                          {item.reorderLevel > 0 && (
                            <div className="text-muted" style={{ fontSize: 11 }}>RL: {item.reorderLevel}</div>
                          )}
                        </td>

                        <td className="text-end text-muted" style={{ padding: "13px 16px" }}>
                          {fmtNum(item.quantityReserved)}
                        </td>

                        <td className="text-end fw-bold" style={{ padding: "13px 16px", color: "#7367f0" }}>
                          {fmtNum(item.availableQuantity)}
                        </td>

                        <td style={{ padding: "13px 16px" }}>
                          <span className="text-muted" style={{ fontSize: 12 }}>
                            <i className="bx bx-layer me-1" />
                            {item.batches?.length || 0} batch{item.batches?.length !== 1 ? "es" : ""}
                          </span>
                        </td>

                        <td style={{ padding: "13px 16px" }}>
                          <div className="d-flex align-items-center gap-2">
                            <span className="rounded-circle" style={{ width: 7, height: 7, display: "inline-block", background: meta.dot }} />
                            <span className={`badge ${meta.cls}`} style={{ fontSize: 11 }}>{meta.label}</span>
                          </div>
                        </td>

                        <td style={{ padding: "13px 16px" }}>
                          <div className="d-flex gap-1" onClick={e => e.stopPropagation()}>
                            {/* Adjust Stock */}
                            <button className="sk-act btn btn-outline-success" title="Adjust Stock"
                              onClick={() => setAdjustTarget(item)}>
                              <i className="bx bx-edit" />
                            </button>
                            {/* Edit Record */}
                            <Link className="sk-act btn btn-outline-secondary" title="Edit record"
                              to={`edit/${item._id}`}>
                              <i className="bx bx-cog" />
                            </Link>
                            {/* View Movements */}
                            <button className="sk-act btn btn-outline-primary" title="View movements"
                              onClick={()=>navigate(to(`inventory/movements?inventory=${item._id}`))}>
                              <i className="bx bx-transfer-alt" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="batch-row" key={`${item._id}-batch`}>
                          <td colSpan="9" className="batch-cell">
                            <BatchDrawer item={item} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="card-footer d-flex align-items-center justify-content-between py-3 px-4"
              style={{ borderTop: "1px solid #f0f1f5" }}>
              <span className="text-muted" style={{ fontSize: 12.5 }}>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </span>
              <nav>
                <ul className="pagination pagination-sm mb-0 gap-1">
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button className="sk-pg btn btn-outline-secondary" onClick={() => setPage(1)}>
                      <i className="bx bx-chevrons-left" style={{ fontSize: 16 }} />
                    </button>
                  </li>
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button className="sk-pg btn btn-outline-secondary" onClick={() => setPage(p => p - 1)}>
                      <i className="bx bx-chevron-left" style={{ fontSize: 16 }} />
                    </button>
                  </li>
                  {buildPages().map((pg, i) =>
                    pg === "…" ? (
                      <li key={`e${i}`} className="page-item disabled">
                        <span className="sk-pg btn btn-outline-secondary" style={{ pointerEvents: "none" }}>…</span>
                      </li>
                    ) : (
                      <li key={pg}>
                        <button className={`sk-pg btn btn-outline-secondary ${page === pg ? "active" : ""}`} onClick={() => setPage(pg)}>{pg}</button>
                      </li>
                    )
                  )}
                  <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                    <button className="sk-pg btn btn-outline-secondary" onClick={() => setPage(p => p + 1)}>
                      <i className="bx bx-chevron-right" style={{ fontSize: 16 }} />
                    </button>
                  </li>
                  <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                    <button className="sk-pg btn btn-outline-secondary" onClick={() => setPage(totalPages)}>
                      <i className="bx bx-chevrons-right" style={{ fontSize: 16 }} />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>

        {/* ── Alert banners ── */}
        {!loading && stats.low > 0 && (
          <div className="alert d-flex align-items-center justify-content-between mt-3 mb-0"
            style={{ background: "rgba(255,159,67,.1)", border: "1px solid rgba(255,159,67,.3)", borderRadius: 10, color: "#a0650a" }}>
            <div><i className="bx bx-error me-2" />
              <strong>{stats.low} product{stats.low > 1 ? "s" : ""}</strong> running low on stock.
            </div>
            <button className="btn btn-sm" style={{ background: "rgba(255,159,67,.2)", color: "#a0650a", fontWeight: 600, fontSize: 12 }}
              onClick={() => setStatusFilter("Low")}>View Low Stock</button>
          </div>
        )}
        {!loading && stats.out > 0 && (
          <div className="alert d-flex align-items-center justify-content-between mt-2 mb-0"
            style={{ background: "rgba(234,84,85,.08)", border: "1px solid rgba(234,84,85,.25)", borderRadius: 10, color: "#a0282a" }}>
            <div><i className="bx bx-x-circle me-2" />
              <strong>{stats.out} product{stats.out > 1 ? "s" : ""}</strong> completely out of stock.
            </div>
            <button className="btn btn-sm" style={{ background: "rgba(234,84,85,.12)", color: "#a0282a", fontWeight: 600, fontSize: 12 }}
              onClick={() => setStatusFilter("Out")}>View Out of Stock</button>
          </div>
        )}
      </div>
    </>
  );
}