import { useEffect, useState, useMemo, useCallback } from "react";
import { getStockMovements } from "../../lib/inventoryAPI";
import { getWarehouses } from "../../lib/warehouseAPI";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const TYPE_META = {
  IN:         { label: "Stock In",   bg: "bg-label-success",  dot: "#28c76f", icon: "bx-trending-up"   },
  OUT:        { label: "Stock Out",  bg: "bg-label-danger",   dot: "#ea5455", icon: "bx-trending-down" },
  TRANSFER:   { label: "Transfer",   bg: "bg-label-primary",  dot: "#7367f0", icon: "bx-transfer"      },
  ADJUSTMENT: { label: "Adjustment", bg: "bg-label-warning",  dot: "#ff9f43", icon: "bx-edit"          },
};

const REF_META = {
  PO:       { label: "Purchase Order", bg: "bg-label-info"      },
  GRN:      { label: "GRN",            bg: "bg-label-success"   },
  SO:       { label: "Sales Order",    bg: "bg-label-danger"    },
  POS:      { label: "POS Sale",       bg: "bg-label-warning"   },
  TRANSFER: { label: "Transfer",       bg: "bg-label-primary"   },
  MANUAL:   { label: "Manual",         bg: "bg-label-secondary" },
};

const SkeletonRow = () => (
  <tr>
    {[120, 180, 140, 90, 80, 60, 110, 150].map((w, i) => (
      <td key={i} style={{ padding: "14px 16px" }}>
        <div style={{
          height: 13, borderRadius: 6, width: w,
          background: "linear-gradient(90deg,#f0f1f5 25%,#e4e6ed 50%,#f0f1f5 75%)",
          backgroundSize: "200% 100%", animation: "mv-shimmer 1.4s infinite",
        }} />
      </td>
    ))}
  </tr>
);

const StatCard = ({ icon, label, value, accent, active, onClick }) => (
  <div className="col-6 col-md-3">
    <div className="card h-100 mb-0" onClick={onClick}
      style={{
        borderTop: `3px solid ${accent}`,
        boxShadow: active ? `0 4px 16px ${accent}30` : "0 1px 8px rgba(0,0,0,.06)",
        transition: "all .18s", cursor: onClick ? "pointer" : "default",
        transform: active ? "translateY(-2px)" : "none",
        background: active ? `${accent}06` : "#fff",
      }}>
      <div className="card-body d-flex align-items-center gap-3 py-3 px-3">
        <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 42, height: 42, background: accent + "18", fontSize: 19 }}>{icon}</div>
        <div>
          <p className="text-muted mb-0" style={{ fontSize: 11.5 }}>{label}</p>
          <h4 className="mb-0 fw-bold" style={{ letterSpacing: "-0.5px" }}>{value}</h4>
        </div>
      </div>
    </div>
  </div>
);

export default function Movements() {
  const [data,       setData]       = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [search,          setSearch]          = useState("");
  const [typeFilter,      setTypeFilter]      = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [dateFrom,        setDateFrom]        = useState("");
  const [dateTo,          setDateTo]          = useState("");

  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [mvRes, whRes] = await Promise.all([
        getStockMovements({ movementType: typeFilter || undefined }),
        getWarehouses(),
      ]);
      setData(mvRes.data.data || mvRes.data || []);
      setWarehouses(whRes.data.data || whRes.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Movements fetch error:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to fetch stock movements");
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, typeFilter, warehouseFilter, dateFrom, dateTo]);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(m =>
        m.productId?.name?.toLowerCase().includes(q) ||
        m.warehouseId?.name?.toLowerCase().includes(q) ||
        m.createdBy?.fullName?.toLowerCase().includes(q) ||
        (m.notes || "").toLowerCase().includes(q)
      );
    }
    if (warehouseFilter) rows = rows.filter(m => m.warehouseId?._id === warehouseFilter);
    if (dateFrom) rows = rows.filter(m => new Date(m.date) >= new Date(dateFrom));
    if (dateTo)   rows = rows.filter(m => new Date(m.date) <= new Date(dateTo + "T23:59:59"));
    return rows;
  }, [data, search, warehouseFilter, dateFrom, dateTo]);

  const stats = useMemo(() => ({
    in:         filtered.filter(m => m.movementType === "IN").length,
    out:        filtered.filter(m => m.movementType === "OUT").length,
    transfer:   filtered.filter(m => m.movementType === "TRANSFER").length,
    adjustment: filtered.filter(m => m.movementType === "ADJUSTMENT").length,
  }), [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const hasFilters = search || typeFilter || warehouseFilter || dateFrom || dateTo;

  const resetFilters = () => {
    setSearch(""); setTypeFilter(""); setWarehouseFilter(""); setDateFrom(""); setDateTo("");
  };

  const exportCSV = () => {
    const headers = ["Date", "Product", "Warehouse", "Type", "Ref Type", "Qty", "User", "Notes"];
    const rows = filtered.map(m => [
      fmtDate(m.date), m.productId?.name || "", m.warehouseId?.name || "",
      m.movementType, m.referenceType, m.quantity,
      m.createdBy?.fullName || "", m.notes || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `movements_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

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
        @keyframes mv-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes mv-row { from{opacity:0;transform:translateY(3px)} to{opacity:1;transform:translateY(0)} }
        .mv-row { transition:background .12s; }
        .mv-row:hover td { background:rgba(115,103,240,.03)!important; }
        .mv-inp:focus { border-color:#7367f0!important;box-shadow:0 0 0 .18rem rgba(115,103,240,.2)!important; }
        .mv-tab { cursor:pointer;padding:5px 14px;border-radius:20px;font-size:12.5px;transition:all .15s;border:1px solid transparent; }
        .mv-tab.active { background:#7367f0;color:#fff;border-color:#7367f0; }
        .mv-tab:not(.active):hover { border-color:#7367f0;color:#7367f0; }
        .mv-pg { width:34px;height:34px;padding:0;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:500;transition:all .15s; }
        .mv-pg.active { background:#7367f0;border-color:#7367f0;color:#fff; }
        .mv-pg:not(.active):not(:disabled):hover { border-color:#7367f0;color:#7367f0; }
      `}</style>

      <div className="container-xxl container-p-y">

        {/* Header */}
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-4">
          <div>
            <h4 className="fw-bold mb-1">
              <i className="bx bx-book-open me-2 text-primary" />Stock Movement Ledger
            </h4>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              Full audit trail of all inventory movements
              {lastUpdated && <span className="ms-2">· {lastUpdated.toLocaleTimeString("en-IN")}</span>}
            </p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={load} disabled={loading}>
              <i className={`bx bx-refresh me-1 ${loading ? "bx-spin" : ""}`} />Refresh
            </button>
            <button className="btn btn-outline-primary btn-sm" onClick={exportCSV} disabled={!filtered.length}>
              <i className="bx bx-download me-1" />Export CSV
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && !loading && (
          <div className="alert d-flex align-items-center gap-3 mb-4"
            style={{ background: "rgba(234,84,85,.08)", border: "1px solid rgba(234,84,85,.3)", borderRadius: 10, color: "#c0392b" }}>
            <i className="bx bx-error-circle" style={{ fontSize: 22 }} />
            <div className="flex-fill">
              <div className="fw-semibold">Failed to load movements</div>
              <div style={{ fontSize: 12.5 }}>{error}</div>
            </div>
            <button className="btn btn-sm btn-outline-danger" onClick={load}>Retry</button>
          </div>
        )}

        {/* Stat cards */}
        <div className="row g-3 mb-4">
          <StatCard icon="📈" label="Stock In"    value={stats.in}         accent="#28c76f"
            active={typeFilter === "IN"}
            onClick={() => setTypeFilter(typeFilter === "IN" ? "" : "IN")} />
          <StatCard icon="📉" label="Stock Out"   value={stats.out}        accent="#ea5455"
            active={typeFilter === "OUT"}
            onClick={() => setTypeFilter(typeFilter === "OUT" ? "" : "OUT")} />
          <StatCard icon="🔄" label="Transfers"   value={stats.transfer}   accent="#7367f0"
            active={typeFilter === "TRANSFER"}
            onClick={() => setTypeFilter(typeFilter === "TRANSFER" ? "" : "TRANSFER")} />
          <StatCard icon="✏️" label="Adjustments" value={stats.adjustment} accent="#ff9f43"
            active={typeFilter === "ADJUSTMENT"}
            onClick={() => setTypeFilter(typeFilter === "ADJUSTMENT" ? "" : "ADJUSTMENT")} />
        </div>

        {/* Filter bar — single line */}
        <div className="card mb-3" style={{ boxShadow: "0 1px 10px rgba(0,0,0,.05)", borderRadius: 12 }}>
          <div className="card-body py-2 px-3">
            <div className="d-flex align-items-center gap-2 flex-nowrap">

              {/* Search */}
              <div className="input-group input-group-sm flex-shrink-0" style={{ width: 180 }}>
                <span className="input-group-text bg-transparent border-end-0 px-2">
                  <i className="bx bx-search text-muted" style={{ fontSize: 13 }} />
                </span>
                <input type="text" className="form-control border-start-0 mv-inp px-1"
                  placeholder="Search…"
                  value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize: 12.5 }} />
                {search && (
                  <button className="btn btn-outline-secondary border-start-0 px-1" onClick={() => setSearch("")}>
                    <i className="bx bx-x" style={{ fontSize: 13 }} />
                  </button>
                )}
              </div>

              {/* Type tabs */}
              <div className="d-flex gap-1 flex-shrink-0">
                {["", "IN", "OUT", "TRANSFER", "ADJUSTMENT"].map(t => (
                  <span key={t || "all"}
                    className={`mv-tab ${typeFilter === t ? "active" : "text-muted"}`}
                    style={{ padding: "4px 10px", fontSize: 12 }}
                    onClick={() => setTypeFilter(t)}>
                    {t || "All"}
                  </span>
                ))}
              </div>

              {/* Warehouse */}
              <select className="form-select form-select-sm mv-inp flex-shrink-0" value={warehouseFilter}
                onChange={e => setWarehouseFilter(e.target.value)} style={{ fontSize: 12.5, width: 145 }}>
                <option value="">All Warehouses</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>

              {/* Date range */}
              <div className="d-flex align-items-center gap-1 flex-shrink-0">
                <input type="date" className="form-control form-control-sm mv-inp" style={{ fontSize: 12, width: 130 }}
                  value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                <span className="text-muted" style={{ fontSize: 11 }}>–</span>
                <input type="date" className="form-control form-control-sm mv-inp" style={{ fontSize: 12, width: 130 }}
                  value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>

              {/* Clear */}
              <div className="ms-auto flex-shrink-0" style={{ visibility: hasFilters ? "visible" : "hidden" }}>
                <button className="btn btn-sm px-2"
                  style={{ border: "1px solid #ea545530", color: "#ea5455", background: "#ea545508", fontSize: 12 }}
                  onClick={resetFilters}>
                  <i className="bx bx-x me-1" />Clear
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ boxShadow: "0 1px 10px rgba(0,0,0,.06)", borderRadius: 12 }}>
          <div className="card-header d-flex align-items-center justify-content-between py-3"
            style={{ borderBottom: "1px solid #f0f1f5" }}>
            <div className="d-flex align-items-center gap-2">
              <span className="fw-semibold" style={{ fontSize: 14 }}>Movement Log</span>
              <span className="badge bg-label-primary" style={{ fontSize: 11 }}>
                {filtered.length} record{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
            <span className="text-muted" style={{ fontSize: 12 }}>
              {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </span>
          </div>

          <div className="table-responsive">
            <table className="table mb-0 align-middle" style={{ fontSize: 13 }}>
              <thead style={{ background: "#f8f9fc" }}>
                <tr>
                  {["Date & Time", "Product", "Warehouse", "Type", "Ref", "Qty", "By", "Notes"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", fontWeight: 600, color: "#444" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && [...Array(6)].map((_, i) => <SkeletonRow key={i} />)}

                {!loading && !error && paged.length === 0 && (
                  <tr><td colSpan="8" className="text-center py-5">
                    <div style={{ opacity: 0.5 }}>
                      <i className="bx bx-book-open d-block mb-2" style={{ fontSize: 46, color: "#7367f0" }} />
                      <p className="fw-semibold mb-1">No movements found</p>
                      <p className="text-muted mb-0" style={{ fontSize: 12.5 }}>
                        {hasFilters ? "Try adjusting your filters" : "No stock movements recorded yet"}
                      </p>
                      {hasFilters && (
                        <button className="btn btn-link btn-sm mt-1 p-0" onClick={resetFilters}>Clear filters</button>
                      )}
                    </div>
                  </td></tr>
                )}

                {!loading && !error && paged.map((m, idx) => {
                  const tm = TYPE_META[m.movementType] || TYPE_META.ADJUSTMENT;
                  const rm = REF_META[m.referenceType] || REF_META.MANUAL;
                  const qtyColor = m.movementType === "IN" ? "#28c76f" : m.movementType === "OUT" ? "#ea5455" : m.movementType === "TRANSFER" ? "#7367f0" : "#ff9f43";
                  const qtyPrefix = m.movementType === "IN" ? "+" : m.movementType === "OUT" ? "−" : m.quantity < 0 ? "−" : "+";
                  return (
                    <tr key={m._id} className="mv-row"
                      style={{ borderBottom: "1px solid #f0f1f5", animation: `mv-row .2s ease ${idx * 0.02}s both` }}>

                      <td style={{ padding: "13px 16px", color: "#666", fontSize: 12.5, whiteSpace: "nowrap" }}>
                        {fmtDate(m.date)}
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <div className="fw-semibold text-dark" style={{ maxWidth: 180 }}>
                          {m.productId?.name || <span className="text-muted">—</span>}
                        </div>
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <div className="d-flex align-items-center gap-2">
                          <i className="bx bx-buildings text-muted" style={{ fontSize: 13 }} />
                          <span>{m.warehouseId?.name || "—"}</span>
                        </div>
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <div className="d-flex align-items-center gap-2">
                          <span className="rounded-circle" style={{ width: 7, height: 7, display: "inline-block", background: tm.dot }} />
                          <span className={`badge ${tm.bg}`} style={{ fontSize: 11 }}>
                            <i className={`bx ${tm.icon} me-1`} style={{ fontSize: 10 }} />{tm.label}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <span className={`badge ${rm.bg}`} style={{ fontSize: 11 }}>{rm.label}</span>
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <span className="fw-bold" style={{ color: qtyColor, fontSize: 14 }}>
                          {qtyPrefix}{Math.abs(m.quantity)}
                        </span>
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        {m.createdBy?.fullName ? (
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                              style={{ width: 26, height: 26, background: "rgba(115,103,240,.12)", color: "#7367f0", fontSize: 11 }}>
                              {m.createdBy.fullName.slice(0, 1).toUpperCase()}
                            </div>
                            <span style={{ fontSize: 12.5 }}>{m.createdBy.fullName.split(" ")[0]}</span>
                          </div>
                        ) : <span className="text-muted">—</span>}
                      </td>

                      <td style={{ padding: "13px 16px", color: "#888", fontSize: 12.5, maxWidth: 180 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                          {m.notes || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!loading && !error && filtered.length > 0 && totalPages > 1 && (
            <div className="card-footer d-flex align-items-center justify-content-between py-3 px-4"
              style={{ borderTop: "1px solid #f0f1f5" }}>
              <span className="text-muted" style={{ fontSize: 12.5 }}>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong> · {filtered.length} records
              </span>
              <nav>
                <ul className="pagination pagination-sm mb-0 gap-1">
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button className="mv-pg btn btn-outline-secondary" onClick={() => setPage(1)}>
                      <i className="bx bx-chevrons-left" style={{ fontSize: 16 }} />
                    </button>
                  </li>
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button className="mv-pg btn btn-outline-secondary" onClick={() => setPage(p => p - 1)}>
                      <i className="bx bx-chevron-left" style={{ fontSize: 16 }} />
                    </button>
                  </li>
                  {buildPages().map((pg, i) =>
                    pg === "…" ? (
                      <li key={`e${i}`} className="page-item disabled">
                        <span className="mv-pg btn btn-outline-secondary" style={{ pointerEvents: "none" }}>…</span>
                      </li>
                    ) : (
                      <li key={pg}>
                        <button className={`mv-pg btn btn-outline-secondary ${page === pg ? "active" : ""}`}
                          onClick={() => setPage(pg)}>{pg}</button>
                      </li>
                    )
                  )}
                  <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                    <button className="mv-pg btn btn-outline-secondary" onClick={() => setPage(p => p + 1)}>
                      <i className="bx bx-chevron-right" style={{ fontSize: 16 }} />
                    </button>
                  </li>
                  <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                    <button className="mv-pg btn btn-outline-secondary" onClick={() => setPage(totalPages)}>
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