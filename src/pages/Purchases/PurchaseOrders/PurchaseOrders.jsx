import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPurchaseOrders } from "../../../lib/purchaseOrdersAPI";

/* ─────────────────────────────────────────────
   SKELETON ROW
───────────────────────────────────────────── */
const SkeletonRow = () => (
  <tr>
    {[40, 110, 180, 80, 100, 90, 100].map((w, i) => (
      <td key={i} style={{ padding: "14px 16px" }}>
        <div style={{
          height: 13, borderRadius: 6, width: w, maxWidth: "100%",
          background: "linear-gradient(90deg,#f0f1f5 25%,#e4e6ed 50%,#f0f1f5 75%)",
          backgroundSize: "200% 100%", animation: "po-shimmer 1.4s infinite",
        }} />
      </td>
    ))}
  </tr>
);

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
const StatCard = ({ icon, label, value, accent }) => (
  <div className="col-6 col-xl" style={{ minWidth: 130 }}>
    <div
      className="card h-100 mb-0"
      style={{ borderTop: `3px solid ${accent}`, boxShadow: "0 1px 8px rgba(0,0,0,.06)", transition: "all .18s" }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 18px ${accent}28`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)";   e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,.06)"; }}
    >
      <div className="card-body d-flex align-items-center gap-3 py-3 px-3">
        <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 42, height: 42, background: accent + "18", fontSize: 19 }}>
          {icon}
        </div>
        <div>
          <p className="text-muted mb-0" style={{ fontSize: 11.5, lineHeight: 1.3 }}>{label}</p>
          <h4 className="mb-0 fw-bold" style={{ letterSpacing: "-0.5px" }}>{value}</h4>
        </div>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────────── */
const STATUS = {
  draft:      { label: "Draft",              badge: "bg-label-secondary", icon: "✏️" },
  confirmed:  { label: "Confirmed",          badge: "bg-label-primary",   icon: "✅" },
  received:   { label: "Partially Received", badge: "bg-label-warning",   icon: "📦" },
  completed:  { label: "Completed",          badge: "bg-label-success",   icon: "🏁" },
  cancelled:  { label: "Cancelled",          badge: "bg-label-danger",    icon: "❌" },
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function PurchaseOrders() {
  const navigate = useNavigate();

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filtered, setFiltered]             = useState([]);
  const [loading, setLoading]               = useState(false);
  const [selected, setSelected]             = useState(new Set());

  const [filters, setFilters] = useState({ search: "", status: "" });

  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ── LOAD ─────────────────────────────────────────────── */
  const loadOrders = async () => {
    setLoading(true);
    setSelected(new Set());
    setPage(1);
    try {
      const res = await getPurchaseOrders();
      if (res.data.success) {
        setPurchaseOrders(res.data.data);
        setFiltered(res.data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  /* ── FRONTEND FILTERS ─────────────────────────────────── */
  useEffect(() => {
    let data = [...purchaseOrders];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter((po) => po.poNumber?.toLowerCase().includes(q));
    }
    if (filters.status) {
      data = data.filter((po) => po.status === filters.status);
    }
    setFiltered(data);
    setPage(1);
    setSelected(new Set());
  }, [filters, purchaseOrders]);

  /* ── PAGINATION ───────────────────────────────────────── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  /* ── SELECTION ────────────────────────────────────────── */
  const pageIds         = paginated.map((p) => p._id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else                  pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleFilterChange = (e) =>
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const resetFilters = () => setFilters({ search: "", status: "" });

  /* ── STATS ────────────────────────────────────────────── */
  const totalCount     = filtered.length;
  const draftCount     = filtered.filter((po) => po.status === "draft").length;
  const confirmedCount = filtered.filter((po) => po.status === "confirmed").length;
  const completedCount = filtered.filter((po) => po.status === "completed").length;
  const cancelledCount = filtered.filter((po) => po.status === "cancelled").length;

  const hasFilters = filters.search || filters.status;

  /* ── PAGE NUMBERS ─────────────────────────────────────── */
  const buildPages = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
      else if (Math.abs(i - page) === 2) pages.push("…");
    }
    return pages.filter((v, i, a) => a[i - 1] !== v);
  };

  /* ── FORMAT CURRENCY ──────────────────────────────────── */
  const fmt = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

  return (
    <>
      <style>{`
        @keyframes po-shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes po-fadein   { from{opacity:0} to{opacity:1} }
        @keyframes po-rowslide { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .po-row { transition: background .12s; }
        .po-row:hover td { background: rgba(115,103,240,.03) !important; }
        .po-row.selected td { background: rgba(115,103,240,.05) !important; }
        .po-action { width:30px;height:30px;padding:0;display:inline-flex;align-items:center;
          justify-content:center;border-radius:8px;font-size:13px;transition:all .15s; }
        .po-action:hover { transform:translateY(-1px); box-shadow:0 3px 8px rgba(0,0,0,.12); }
        .po-search:focus { border-color:#7367f0!important; box-shadow:0 0 0 .18rem rgba(115,103,240,.2)!important; }
        .po-select:focus { border-color:#7367f0!important; box-shadow:0 0 0 .18rem rgba(115,103,240,.2)!important; }
        .po-pg { width:34px;height:34px;padding:0;border-radius:8px;display:inline-flex;
          align-items:center;justify-content:center;font-size:13px;font-weight:500;transition:all .15s; }
        .po-pg.active  { background:#7367f0;border-color:#7367f0;color:#fff; }
        .po-pg:not(.active):not(:disabled):hover { border-color:#7367f0;color:#7367f0; }
        .po-cb { width:16px;height:16px;cursor:pointer;accent-color:#7367f0; }
        .po-badge { font-size:11px;padding:3px 8px;border-radius:20px; }
      `}</style>

      <div className="container-xxl container-p-y">

        {/* ── PAGE HEADER ── */}
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-4">
          <div>
            <h4 className="fw-bold mb-1">
              <i className="bx bx-receipt me-2 text-primary" />
              Purchase Orders
            </h4>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              Track and manage all incoming purchase orders
            </p>
          </div>
          <Link to="new" className="btn btn-primary btn-sm">
            <i className="bx bx-plus me-1" />
            Add Purchase Order
          </Link>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="row g-3 mb-4">
          <StatCard icon="📋" label="Total"     value={totalCount}     accent="#7367f0" />
          <StatCard icon="✏️" label="Draft"     value={draftCount}     accent="#82868b" />
          <StatCard icon="✅" label="Confirmed" value={confirmedCount} accent="#00cfe8" />
          <StatCard icon="🏁" label="Completed" value={completedCount} accent="#28c76f" />
          <StatCard icon="❌" label="Cancelled" value={cancelledCount} accent="#ea5455" />
        </div>

        {/* ── FILTER BAR ── */}
        <div className="card mb-3" style={{ boxShadow: "0 1px 10px rgba(0,0,0,.05)", borderRadius: 12 }}>
          <div className="card-body py-3 px-4">
            <div className="row g-2 align-items-center">

              {/* search */}
              <div className="col-12 col-md-4">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-transparent border-end-0">
                    <i className="bx bx-search text-muted" />
                  </span>
                  <input
                    type="text" name="search" value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search PO number…"
                    className="form-control border-start-0 po-search"
                    style={{ fontSize: 13 }}
                  />
                  {filters.search && (
                    <button className="btn btn-outline-secondary border-start-0"
                      onClick={() => setFilters((p) => ({ ...p, search: "" }))}>
                      <i className="bx bx-x" />
                    </button>
                  )}
                </div>
              </div>

              {/* status */}
              <div className="col-6 col-md-auto" style={{ minWidth: 170 }}>
                <select name="status" value={filters.status}
                  onChange={handleFilterChange}
                  className="form-select form-select-sm po-select" style={{ fontSize: 13 }}>
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="received">Partially Received</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* page size */}
              <div className="col-6 col-md-auto" style={{ minWidth: 110 }}>
                <select value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="form-select form-select-sm po-select" style={{ fontSize: 13 }}>
                  {[10, 25, 50].map((n) => <option key={n} value={n}>Show {n}</option>)}
                </select>
              </div>

              {/* clear */}
              <div className="col-6 col-md-auto ms-md-auto">
                <button className="btn btn-sm w-100" onClick={resetFilters}
                  style={{
                    border: `1px solid ${hasFilters ? "#ea545530" : "#d1d5db"}`,
                    color: hasFilters ? "#ea5455" : "#6e6b7b",
                    background: hasFilters ? "#ea545508" : "transparent",
                    fontSize: 13, transition: "all .15s",
                  }}>
                  <i className="bx bx-filter-alt me-1" />
                  {hasFilters ? "Clear" : "Reset"}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* ── TABLE CARD ── */}
        <div className="card" style={{ boxShadow: "0 1px 10px rgba(0,0,0,.06)", borderRadius: 12 }}>

          {/* card header */}
          <div className="card-header d-flex align-items-center justify-content-between py-3"
            style={{ borderBottom: "1px solid #f0f1f5" }}>
            <div className="d-flex align-items-center gap-2">
              <span className="fw-semibold" style={{ fontSize: 14 }}>Order List</span>
              <span className="badge bg-label-primary" style={{ fontSize: 11 }}>
                {filtered.length} item{filtered.length !== 1 ? "s" : ""}
              </span>
              {selected.size > 0 && (
                <span className="badge bg-label-warning" style={{ fontSize: 11 }}>
                  {selected.size} selected
                </span>
              )}
            </div>
            <span className="text-muted" style={{ fontSize: 12 }}>
              {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
          </div>

          <div className="table-responsive">
            <table className="table mb-0 align-middle" style={{ fontSize: 13.5 }}>
              <thead style={{ background: "#f8f9fc" }}>
                <tr>
                  <th style={{ padding: "12px 16px", width: 44 }}>
                    <input type="checkbox" className="po-cb" checked={allPageSelected} onChange={toggleSelectAll} />
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }}>PO Number</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }}>Supplier</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }}>Items</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }}>Total Amount</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }}>Expected Delivery</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }}>Status</th>
                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "#444", width: 100 }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && [...Array(6)].map((_, i) => <SkeletonRow key={i} />)}

                {!loading && paginated.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      <div style={{ opacity: 0.5 }}>
                        <i className="bx bx-receipt d-block mb-2" style={{ fontSize: 46, color: "#7367f0" }} />
                        <p className="fw-semibold mb-1">No purchase orders found</p>
                        <p className="text-muted mb-0" style={{ fontSize: 12.5 }}>
                          {hasFilters ? "Try adjusting your filters" : "Create your first purchase order to get started"}
                        </p>
                        {hasFilters && (
                          <button className="btn btn-sm btn-link mt-2 p-0" onClick={resetFilters}>
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && paginated.map((po, idx) => {
                  const s = STATUS[po.status] || { label: po.status, badge: "bg-label-secondary", icon: "❓" };
                  return (
                    <tr
                      key={po._id}
                      className={`po-row ${selected.has(po._id) ? "selected" : ""}`}
                      style={{ borderBottom: "1px solid #f0f1f5", animation: `po-rowslide .2s ease ${idx * 0.025}s both` }}
                    >
                      {/* checkbox */}
                      <td style={{ padding: "13px 16px" }}>
                        <input type="checkbox" className="po-cb" checked={selected.has(po._id)} onChange={() => toggleSelect(po._id)} />
                      </td>

                      {/* PO number */}
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{
                          fontFamily: "monospace", fontSize: 12,
                          background: "rgba(115,103,240,.1)", color: "#7367f0",
                          padding: "2px 8px", borderRadius: 4,
                        }}>
                          {po.poNumber}
                        </span>
                      </td>

                      {/* supplier */}
                      <td style={{ padding: "13px 16px" }}>
                        <div className="fw-semibold text-dark">{po.supplierId?.name || "—"}</div>
                        <div className="text-muted" style={{ fontSize: 11.5, fontFamily: "monospace" }}>
                          {po.supplierId?.code || ""}
                        </div>
                      </td>

                      {/* items count */}
                      <td style={{ padding: "13px 16px" }}>
                        <span className="badge bg-label-info po-badge">
                          <i className="bx bx-layer me-1" style={{ fontSize: 11 }} />
                          {po.items?.length || 0} item{po.items?.length !== 1 ? "s" : ""}
                        </span>
                      </td>

                      {/* total */}
                      <td style={{ padding: "13px 16px" }}>
                        <span className="fw-semibold" style={{ fontVariantNumeric: "tabular-nums", color: "#28c76f" }}>
                          {fmt(po.totalAmount)}
                        </span>
                      </td>

                      {/* expected delivery */}
                      <td style={{ padding: "13px 16px" }}>
                        {po.expectedDeliveryDate
                          ? new Date(po.expectedDeliveryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                          : <span className="text-muted">—</span>}
                      </td>

                      {/* status */}
                      <td style={{ padding: "13px 16px" }}>
                        <span className={`badge ${s.badge} po-badge`}>
                          {s.icon} {s.label}
                        </span>
                      </td>

                      {/* actions */}
                      <td style={{ padding: "13px 16px" }}>
                        <div className="d-flex gap-1">
                          <button
                            className="po-action btn btn-outline-primary"
                            title="View / Edit"
                            onClick={() => navigate(`${po._id}`)}
                          >
                            <i className="bx bx-show" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── PAGINATION ── */}
          <div className="card-footer d-flex align-items-center justify-content-between py-3 px-4"
            style={{ borderTop: "1px solid #f0f1f5" }}>
            <div className="text-muted" style={{ fontSize: 12.5 }}>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              <span className="mx-1">·</span>
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </div>
            <nav>
              <ul className="pagination pagination-sm mb-0 gap-1">
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button className="po-pg btn btn-outline-secondary" onClick={() => setPage(1)}>
                    <i className="bx bx-chevrons-left" style={{ fontSize: 16 }} />
                  </button>
                </li>
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button className="po-pg btn btn-outline-secondary" onClick={() => setPage((p) => p - 1)}>
                    <i className="bx bx-chevron-left" style={{ fontSize: 16 }} />
                  </button>
                </li>
                {buildPages().map((pg, i) =>
                  pg === "…" ? (
                    <li key={`e${i}`} className="page-item disabled">
                      <span className="po-pg btn btn-outline-secondary" style={{ pointerEvents: "none" }}>…</span>
                    </li>
                  ) : (
                    <li key={pg}>
                      <button className={`po-pg btn btn-outline-secondary ${page === pg ? "active" : ""}`} onClick={() => setPage(pg)}>
                        {pg}
                      </button>
                    </li>
                  )
                )}
                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                  <button className="po-pg btn btn-outline-secondary" onClick={() => setPage((p) => p + 1)}>
                    <i className="bx bx-chevron-right" style={{ fontSize: 16 }} />
                  </button>
                </li>
                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                  <button className="po-pg btn btn-outline-secondary" onClick={() => setPage(totalPages)}>
                    <i className="bx bx-chevrons-right" style={{ fontSize: 16 }} />
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}