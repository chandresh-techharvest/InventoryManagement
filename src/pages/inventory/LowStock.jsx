import { useEffect, useState, useMemo } from "react";
import { getLowStock } from "../../lib/inventoryAPI";
import { getWarehouses } from "../../lib/WarehouseAPI";

/* ─── Helpers ──────────────────────────────── */
const fmtNum = (n = 0) => Number(n).toLocaleString("en-IN");

const getUrgency = (item) => {
  if (item.quantityOnHand === 0) return { level: "critical", label: "Out of Stock", color: "#ea5455", bg: "rgba(234,84,85,.1)", badge: "bg-label-danger" };
  const ratio = item.quantityOnHand / (item.reorderLevel || 1);
  if (ratio <= 0.25) return { level: "urgent",   label: "Critical",     color: "#ea5455", bg: "rgba(234,84,85,.07)",  badge: "bg-label-danger"  };
  if (ratio <= 0.5)  return { level: "high",     label: "Very Low",     color: "#ff9f43", bg: "rgba(255,159,67,.07)", badge: "bg-label-warning" };
  return               { level: "medium",    label: "Low Stock",    color: "#ff9f43", bg: "rgba(255,159,67,.05)", badge: "bg-label-warning" };
};

const StockBar = ({ value, max }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const color = pct === 0 ? "#ea5455" : pct < 25 ? "#ea5455" : pct < 50 ? "#ff9f43" : "#28c76f";
  return (
    <div style={{ height: 6, background: "#f0f1f5", borderRadius: 3, overflow: "hidden", width: "100%", minWidth: 80 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width .4s ease" }} />
    </div>
  );
};

/* ─── Skeleton ─────────────────────────────── */
const SkeletonRow = () => (
  <tr>
    {[200, 140, 80, 100, 120, 90].map((w, i) => (
      <td key={i} style={{ padding: "14px 16px" }}>
        <div style={{
          height: 13, borderRadius: 6, width: w,
          background: "linear-gradient(90deg,#f0f1f5 25%,#e4e6ed 50%,#f0f1f5 75%)",
          backgroundSize: "200% 100%", animation: "ls-shimmer 1.4s infinite",
        }} />
      </td>
    ))}
  </tr>
);

/* ─── Stat Card ────────────────────────────── */
const StatCard = ({ icon, label, value, accent, sub }) => (
  <div className="col-6 col-xl-3">
    <div className="card h-100 mb-0"
      style={{ borderTop: `3px solid ${accent}`, boxShadow: "0 1px 8px rgba(0,0,0,.06)", transition: "all .18s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 18px ${accent}28`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,.06)"; }}
    >
      <div className="card-body d-flex align-items-center gap-3 py-3 px-3">
        <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 44, height: 44, background: accent + "18", fontSize: 20 }}>{icon}</div>
        <div>
          <p className="text-muted mb-0" style={{ fontSize: 11.5 }}>{label}</p>
          <h4 className="mb-0 fw-bold" style={{ letterSpacing: "-0.5px" }}>{value}</h4>
          {sub && <p className="text-muted mb-0" style={{ fontSize: 11 }}>{sub}</p>}
        </div>
      </div>
    </div>
  </div>
);

/* ─── Main ─────────────────────────────────── */
export default function LowStock() {
  const [data,       setData]       = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  /* filters */
  const [search,          setSearch]          = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [urgencyFilter,   setUrgencyFilter]   = useState("");

  /* pagination */
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  const load = async () => {
    setLoading(true);
    try {
      const [lsRes, whRes] = await Promise.all([
        getLowStock(),
        getWarehouses(),
      ]);
      setData(lsRes.data.data || []);
      setWarehouses(whRes.data.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("LowStock fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search, warehouseFilter, urgencyFilter]);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(i =>
        i.productId?.name?.toLowerCase().includes(q) ||
        i.warehouseId?.name?.toLowerCase().includes(q)
      );
    }
    if (warehouseFilter) rows = rows.filter(i => i.warehouseId?._id === warehouseFilter);
    if (urgencyFilter) rows = rows.filter(i => getUrgency(i).level === urgencyFilter);
    // sort: most urgent first
    rows.sort((a, b) => {
      const order = { critical: 0, urgent: 1, high: 2, medium: 3 };
      return (order[getUrgency(a).level] || 3) - (order[getUrgency(b).level] || 3);
    });
    return rows;
  }, [data, search, warehouseFilter, urgencyFilter]);

  /* stats */
  const stats = useMemo(() => ({
    total:    data.length,
    critical: data.filter(i => getUrgency(i).level === "critical" || getUrgency(i).level === "urgent").length,
    high:     data.filter(i => getUrgency(i).level === "high").length,
    medium:   data.filter(i => getUrgency(i).level === "medium").length,
    totalDeficit: data.reduce((s, i) => s + Math.max(0, (i.reorderLevel || 0) - i.quantityOnHand), 0),
  }), [data]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const hasFilters = search || warehouseFilter || urgencyFilter;

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
        @keyframes ls-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes ls-row     { from{opacity:0;transform:translateY(3px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ls-pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
        .ls-row { transition:background .12s; }
        .ls-row:hover td { background:rgba(115,103,240,.03)!important; }
        .ls-inp:focus  { border-color:#7367f0!important;box-shadow:0 0 0 .18rem rgba(115,103,240,.2)!important; }
        .ls-pg { width:34px;height:34px;padding:0;border-radius:8px;display:inline-flex;align-items:center;
          justify-content:center;font-size:13px;font-weight:500;transition:all .15s; }
        .ls-pg.active { background:#7367f0;border-color:#7367f0;color:#fff; }
        .ls-pg:not(.active):not(:disabled):hover { border-color:#7367f0;color:#7367f0; }
        .ls-pulse { animation: ls-pulse 1.8s ease-in-out infinite; }
        .ls-urgency-tab { cursor:pointer;padding:5px 14px;border-radius:20px;font-size:12.5px;transition:all .15s;border:1px solid transparent; }
        .ls-urgency-tab.active { background:#ea5455;color:#fff;border-color:#ea5455; }
        .ls-urgency-tab:not(.active):hover { border-color:#ea5455;color:#ea5455; }
      `}</style>

      <div className="container-xxl container-p-y">

        {/* ── Header ── */}
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-4">
          <div>
            <h4 className="fw-bold mb-1">
              <i className="bx bx-error me-2 text-danger" />Low Stock Alerts
            </h4>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              Items that have fallen below their reorder threshold
              {lastUpdated && <span className="ms-2">· Updated {lastUpdated.toLocaleTimeString("en-IN")}</span>}
            </p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={load} disabled={loading}>
              <i className={`bx bx-refresh me-1 ${loading ? "bx-spin" : ""}`} />Refresh
            </button>
            <a href="/inventory/stock/add" className="btn btn-primary btn-sm">
              <i className="bx bx-plus me-1" />Restock
            </a>
          </div>
        </div>

        {/* ── Critical alert banner ── */}
        {!loading && stats.critical > 0 && (
          <div className="d-flex align-items-center justify-content-between p-3 mb-4 rounded-3 ls-pulse"
            style={{ background: "rgba(234,84,85,.08)", border: "2px solid rgba(234,84,85,.3)" }}>
            <div className="d-flex align-items-center gap-3">
              <span style={{ fontSize: 22 }}>🚨</span>
              <div>
                <div className="fw-bold text-danger" style={{ fontSize: 14 }}>
                  {stats.critical} item{stats.critical > 1 ? "s" : ""} critically low or out of stock
                </div>
                <div className="text-muted" style={{ fontSize: 12.5 }}>
                  Immediate reorder required to avoid stockouts
                </div>
              </div>
            </div>
            <button className="btn btn-sm btn-danger" onClick={() => setUrgencyFilter(urgencyFilter === "critical" ? "" : "critical")}>
              View Critical
            </button>
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div className="row g-3 mb-4">
          <StatCard icon="⚠️"  label="Total Alerts"    value={fmtNum(stats.total)}    accent="#ff9f43" sub={`${stats.totalDeficit} units deficit`} />
          <StatCard icon="🚨"  label="Critical / Urgent" value={fmtNum(stats.critical)} accent="#ea5455" />
          <StatCard icon="🔴"  label="Very Low"         value={fmtNum(stats.high)}     accent="#ff9f43" />
          <StatCard icon="🟡"  label="Low"              value={fmtNum(stats.medium)}   accent="#ffc107" />
        </div>

        {/* ── Filters ── */}
        <div className="card mb-3" style={{ boxShadow: "0 1px 10px rgba(0,0,0,.05)", borderRadius: 12 }}>
          <div className="card-body py-3 px-4">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-4">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-transparent border-end-0">
                    <i className="bx bx-search text-muted" />
                  </span>
                  <input type="text" className="form-control border-start-0 ls-inp"
                    placeholder="Search product or warehouse…"
                    value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize: 13 }} />
                  {search && <button className="btn btn-outline-secondary border-start-0" onClick={() => setSearch("")}><i className="bx bx-x" /></button>}
                </div>
              </div>

              <div className="col-6 col-md-3">
                <select className="form-select form-select-sm ls-inp" value={warehouseFilter}
                  onChange={e => setWarehouseFilter(e.target.value)} style={{ fontSize: 13 }}>
                  <option value="">All Warehouses</option>
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>

              <div className="col-6 col-md-4">
                <div className="d-flex gap-1 flex-wrap">
                  {[
                    { key: "", label: "All" },
                    { key: "critical", label: "Out / Critical" },
                    { key: "urgent",   label: "Urgent" },
                    { key: "high",     label: "Very Low" },
                    { key: "medium",   label: "Low" },
                  ].map(t => (
                    <span key={t.key}
                      className={`ls-urgency-tab ${urgencyFilter === t.key ? "active" : "text-muted"}`}
                      onClick={() => setUrgencyFilter(t.key)}>
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>

              {hasFilters && (
                <div className="col-auto ms-auto">
                  <button className="btn btn-sm" onClick={() => { setSearch(""); setWarehouseFilter(""); setUrgencyFilter(""); }}
                    style={{ border: "1px solid #ea545530", color: "#ea5455", background: "#ea545508", fontSize: 12.5 }}>
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
              <span className="fw-semibold" style={{ fontSize: 14 }}>Low Stock Items</span>
              <span className="badge bg-label-danger" style={{ fontSize: 11 }}>
                {filtered.length} item{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
            <span className="text-muted" style={{ fontSize: 12 }}>Sorted by urgency</span>
          </div>

          <div className="table-responsive">
            <table className="table mb-0 align-middle" style={{ fontSize: 13.5 }}>
              <thead style={{ background: "#f8f9fc" }}>
                <tr>
                  {[["Product","auto"],["Warehouse","auto"],["On Hand",90],["Reorder Level",120],["Stock Level",140],["Urgency",110],["Action",90]].map(([h, w]) => (
                    <th key={h} style={{ padding: "12px 16px", fontWeight: 600, color: "#444", width: w }}>{h}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading && [...Array(5)].map((_, i) => <SkeletonRow key={i} />)}

                {!loading && paged.length === 0 && (
                  <tr><td colSpan="7" className="text-center py-5">
                    <div style={{ opacity: 0.5 }}>
                      <i className="bx bx-check-circle d-block mb-2" style={{ fontSize: 46, color: "#28c76f" }} />
                      <p className="fw-semibold mb-1 text-success">All stock levels healthy!</p>
                      <p className="text-muted mb-0" style={{ fontSize: 12.5 }}>
                        {hasFilters ? "No items match your filters" : "No items are below reorder level"}
                      </p>
                      {hasFilters && <button className="btn btn-link btn-sm mt-1 p-0" onClick={() => { setSearch(""); setWarehouseFilter(""); setUrgencyFilter(""); }}>Clear filters</button>}
                    </div>
                  </td></tr>
                )}

                {!loading && paged.map((item, idx) => {
                  const urgency = getUrgency(item);
                  const deficit = Math.max(0, (item.reorderLevel || 0) - item.quantityOnHand);
                  return (
                    <tr key={item._id} className="ls-row"
                      style={{ borderBottom: "1px solid #f0f1f5", animation: `ls-row .2s ease ${idx * 0.03}s both`, borderLeft: `3px solid ${urgency.color}` }}>

                      <td style={{ padding: "13px 16px" }}>
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-2 d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                            style={{ width: 36, height: 36, background: urgency.bg, color: urgency.color, fontSize: 13 }}>
                            {(item.productId?.name || "?").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-semibold text-dark">{item.productId?.name || "—"}</div>
                            {item.productId?.sku && (
                              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#7367f0", background: "rgba(115,103,240,.08)", padding: "1px 6px", borderRadius: 4, display: "inline-block" }}>
                                {item.productId.sku}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <div className="d-flex align-items-center gap-2">
                          <i className="bx bx-buildings text-muted" style={{ fontSize: 13 }} />
                          <span>{item.warehouseId?.name || "—"}</span>
                        </div>
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <span className="fw-bold" style={{ fontSize: 15, color: urgency.color }}>
                          {fmtNum(item.quantityOnHand)}
                        </span>
                        {deficit > 0 && (
                          <div className="text-muted" style={{ fontSize: 11 }}>deficit: {deficit}</div>
                        )}
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <span className="fw-semibold text-dark">{fmtNum(item.reorderLevel)}</span>
                        {item.safetyStock > 0 && (
                          <div className="text-muted" style={{ fontSize: 11 }}>safety: {item.safetyStock}</div>
                        )}
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ minWidth: 100 }}>
                          <StockBar value={item.quantityOnHand} max={item.reorderLevel * 2 || 10} />
                          <div className="text-muted mt-1" style={{ fontSize: 11 }}>
                            {item.reorderLevel > 0 ? `${Math.round((item.quantityOnHand / item.reorderLevel) * 100)}% of reorder` : "No reorder set"}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <div className="d-flex align-items-center gap-2">
                          <span className="rounded-circle" style={{ width: 7, height: 7, display: "inline-block", background: urgency.color }} />
                          <span className={`badge ${urgency.badge}`} style={{ fontSize: 11 }}>
                            {urgency.label}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <a href={`/inventory/stock/add?product=${item.productId?._id}&warehouse=${item.warehouseId?._id}`}
                          className="btn btn-sm btn-outline-primary"
                          style={{ fontSize: 12, borderRadius: 8 }}>
                          <i className="bx bx-plus me-1" />Restock
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length > 0 && (
            <div className="card-footer d-flex align-items-center justify-content-between py-3 px-4" style={{ borderTop: "1px solid #f0f1f5" }}>
              <span className="text-muted" style={{ fontSize: 12.5 }}>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong> · {filtered.length} items
              </span>
              <nav>
                <ul className="pagination pagination-sm mb-0 gap-1">
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button className="ls-pg btn btn-outline-secondary" onClick={() => setPage(1)}>
                      <i className="bx bx-chevrons-left" style={{ fontSize: 16 }} />
                    </button>
                  </li>
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button className="ls-pg btn btn-outline-secondary" onClick={() => setPage(p => p - 1)}>
                      <i className="bx bx-chevron-left" style={{ fontSize: 16 }} />
                    </button>
                  </li>
                  {buildPages().map((pg, i) =>
                    pg === "…" ? (
                      <li key={`e${i}`} className="page-item disabled">
                        <span className="ls-pg btn btn-outline-secondary" style={{ pointerEvents: "none" }}>…</span>
                      </li>
                    ) : (
                      <li key={pg}>
                        <button className={`ls-pg btn btn-outline-secondary ${page === pg ? "active" : ""}`} onClick={() => setPage(pg)}>{pg}</button>
                      </li>
                    )
                  )}
                  <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                    <button className="ls-pg btn btn-outline-secondary" onClick={() => setPage(p => p + 1)}>
                      <i className="bx bx-chevron-right" style={{ fontSize: 16 }} />
                    </button>
                  </li>
                  <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                    <button className="ls-pg btn btn-outline-secondary" onClick={() => setPage(totalPages)}>
                      <i className="bx bx-chevrons-right" style={{ fontSize: 16 }} />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </>
  );
}