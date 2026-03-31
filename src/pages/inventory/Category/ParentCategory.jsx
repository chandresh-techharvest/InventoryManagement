import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getParentCategories, deleteParentCategory } from "../../../lib/parentCategoryAPI";
import { getCategories } from "../../../lib/categoryAPI";

const SkeletonRow = () => (
  <tr>
    {[180, 200, 80, 70, 90, 100].map((w, i) => (
      <td key={i} style={{ padding: "14px 16px" }}>
        <div style={{
          height: 13, borderRadius: 6, width: w,
          background: "linear-gradient(90deg,#f0f1f5 25%,#e4e6ed 50%,#f0f1f5 75%)",
          backgroundSize: "200% 100%", animation: "pc-shimmer 1.4s infinite",
        }} />
      </td>
    ))}
  </tr>
);

const StatCard = ({ icon, label, value, accent }) => (
  <div className="col-6 col-xl-3">
    <div className="card h-100 mb-0"
      style={{ borderTop: `3px solid ${accent}`, boxShadow: "0 1px 8px rgba(0,0,0,.06)", transition: "all .18s", cursor: "default" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 18px ${accent}28`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,.06)"; }}>
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

const ConfirmModal = ({ name, subCount, onConfirm, onCancel, loading }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(22,29,49,.46)", zIndex: 9999,
    display: "flex", alignItems: "center", justifyContent: "center",
    backdropFilter: "blur(2px)", animation: "pc-fadein .15s ease" }}>
    <div className="card" style={{ width: 420, borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,.22)", border: "none", animation: "pc-popup .2s cubic-bezier(.34,1.56,.64,1)" }}>
      <div className="card-body p-4 text-center">
        <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
          style={{ width: 54, height: 54, background: "rgba(234,84,85,.1)", fontSize: 24 }}>🗑️</div>
        <h5 className="fw-bold mb-1">Delete Parent Category?</h5>
        <p className="text-muted mb-2" style={{ fontSize: 13.5 }}><strong>{name}</strong> will be permanently removed.</p>
        {subCount > 0 && (
          <div className="rounded-3 p-2 mb-3"
            style={{ background: "rgba(255,159,67,.1)", border: "1px solid rgba(255,159,67,.3)", fontSize: 12.5, color: "#a0650a" }}>
            <i className="bx bx-error me-1" />This parent has <strong>{subCount}</strong> sub-categor{subCount !== 1 ? "ies" : "y"}.
          </div>
        )}
        <div className="d-flex gap-2 justify-content-center">
          <button className="btn btn-outline-secondary px-4" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-danger px-4" onClick={onConfirm} disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2" style={{ width: 13, height: 13 }} />Deleting…</> : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  </div>
);

const PCAvatar = ({ name }) => {
  const colors = ["#7367f0", "#28c76f", "#00cfe8", "#ff9f43", "#ea5455"];
  const c = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div className="rounded-2 d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
      style={{ width: 36, height: 36, background: c + "18", color: c, fontSize: 13 }}>
      {(name || "?").slice(0, 2).toUpperCase()}
    </div>
  );
};

export default function ParentCategory() {
  const [parentCategories, setParentCategories] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const pageSize = 10;
  const [subCountMap, setSubCountMap] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadParentCategories = async () => {
    setLoading(true);
    try {
      const res = await getParentCategories();
      setParentCategories(res.data.data || []);
    } catch (err) {
      console.error(err);
      setParentCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSubCounts = async () => {
    try {
      const res = await getCategories();
      if (res.data.success) {
        const map = {};
        (res.data.data || []).forEach((c) => {
          const pid = c.parentCategoryId?._id || c.parentCategoryId;
          if (pid) map[pid] = (map[pid] || 0) + 1;
        });
        setSubCountMap(map);
      }
    } catch (err) { console.error("Sub-count error:", err); }
  };

  useEffect(() => { loadParentCategories(); loadSubCounts(); }, []);

  const filtered = parentCategories.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteParentCategory(deleteTarget.id);
      setDeleteTarget(null);
      loadParentCategories();
      loadSubCounts();
    } finally { setDeleting(false); }
  };

  const activeCount   = parentCategories.filter((c) => c.isActive).length;
  const inactiveCount = parentCategories.length - activeCount;
  const totalSubCats  = Object.values(subCountMap).reduce((s, n) => s + n, 0);

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
        @keyframes pc-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes pc-fadein  { from{opacity:0} to{opacity:1} }
        @keyframes pc-popup   { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
        @keyframes pc-row     { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        .pc-row { transition:background .12s; }
        .pc-row:hover td { background:rgba(115,103,240,.03)!important; }
        .pc-act { width:30px;height:30px;padding:0;display:inline-flex;align-items:center;
          justify-content:center;border-radius:8px;font-size:14px;transition:all .15s; }
        .pc-act:hover { transform:translateY(-1px);box-shadow:0 3px 8px rgba(0,0,0,.12); }
        .pc-inp:focus { border-color:#7367f0!important;box-shadow:0 0 0 .18rem rgba(115,103,240,.2)!important; }
        .pc-pg { width:34px;height:34px;padding:0;border-radius:8px;display:inline-flex;
          align-items:center;justify-content:center;font-size:13px;font-weight:500;transition:all .15s; }
        .pc-pg.active { background:#7367f0;border-color:#7367f0;color:#fff; }
        .pc-pg:not(.active):not(:disabled):hover { border-color:#7367f0;color:#7367f0; }
      `}</style>

      {deleteTarget && (
        <ConfirmModal name={deleteTarget.name} subCount={subCountMap[deleteTarget.id] || 0}
          onConfirm={handleDelete} onCancel={() => !deleting && setDeleteTarget(null)} loading={deleting} />
      )}

      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-4">
          <div>
            <h4 className="fw-bold mb-1"><i className="bx bx-folder me-2 text-primary" />Parent Categories</h4>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>Top-level category groups that contain sub-categories</p>
          </div>
          <Link to="new" className="btn btn-primary btn-sm"><i className="bx bx-plus me-1" />Add Category</Link>
        </div>

        <div className="row g-3 mb-4">
          <StatCard icon="📁" label="Total"           value={parentCategories.length} accent="#7367f0" />
          <StatCard icon="✅" label="Active"           value={activeCount}             accent="#28c76f" />
          <StatCard icon="⏸️" label="Inactive"         value={inactiveCount}           accent="#ea5455" />
          <StatCard icon="🗂️" label="Sub-Categories"  value={totalSubCats}            accent="#00cfe8" />
        </div>

        <div className="card mb-3" style={{ boxShadow: "0 1px 10px rgba(0,0,0,.05)", borderRadius: 12 }}>
          <div className="card-body py-3 px-4">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-6">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-transparent border-end-0"><i className="bx bx-search text-muted" /></span>
                  <input type="text" className="form-control border-start-0 pc-inp" placeholder="Search parent category…"
                    value={search} onChange={(e) => setSearch(e.target.value)} style={{ fontSize: 13 }} />
                  {search && <button className="btn btn-outline-secondary border-start-0" onClick={() => setSearch("")}><i className="bx bx-x" /></button>}
                </div>
              </div>
              <div className="col-auto ms-auto">
                <span className="text-muted" style={{ fontSize: 12.5 }}>{filtered.length} of {parentCategories.length} categories</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ boxShadow: "0 1px 10px rgba(0,0,0,.06)", borderRadius: 12 }}>
          <div className="card-header d-flex align-items-center justify-content-between py-3" style={{ borderBottom: "1px solid #f0f1f5" }}>
            <div className="d-flex align-items-center gap-2">
              <span className="fw-semibold" style={{ fontSize: 14 }}>Parent Category List</span>
              <span className="badge bg-label-primary" style={{ fontSize: 11 }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
            </div>
            <span className="text-muted" style={{ fontSize: 12 }}>
              {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
          </div>

          <div className="table-responsive">
            <table className="table mb-0 align-middle" style={{ fontSize: 13.5 }}>
              <thead style={{ background: "#f8f9fc" }}>
                <tr>
                  {["Category", "Description", "Sub-Categories", "Status", "Created", "Actions"].map((h, i) => (
                    <th key={h} style={{ padding: "12px 16px", fontWeight: 600, color: "#444", width: i === 5 ? 100 : "auto" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && [...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
                {!loading && paginated.length === 0 && (
                  <tr><td colSpan="6" className="text-center py-5">
                    <div style={{ opacity: 0.5 }}>
                      <i className="bx bx-folder d-block mb-2" style={{ fontSize: 46, color: "#7367f0" }} />
                      <p className="fw-semibold mb-1">No parent categories found</p>
                      <p className="text-muted mb-0" style={{ fontSize: 12.5 }}>
                        {search ? "Try a different search term" : "Add your first parent category to get started"}
                      </p>
                      {search && <button className="btn btn-link btn-sm mt-1 p-0" onClick={() => setSearch("")}>Clear search</button>}
                    </div>
                  </td></tr>
                )}
                {!loading && paginated.map((cat, idx) => {
                  const subCount = subCountMap[cat._id] || 0;
                  return (
                    <tr key={cat._id} className="pc-row" style={{ borderBottom: "1px solid #f0f1f5", animation: `pc-row .2s ease ${idx * 0.03}s both` }}>
                      <td style={{ padding: "13px 16px" }}>
                        <div className="d-flex align-items-center gap-3">
                          <PCAvatar name={cat.name} />
                          <span className="fw-semibold text-dark">{cat.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        {cat.description
                          ? <span className="text-muted" style={{ fontSize: 13, maxWidth: 200, display: "inline-block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cat.description}</span>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        {subCount > 0
                          ? <span className="badge bg-label-info" style={{ fontSize: 11 }}><i className="bx bx-category me-1" style={{ fontSize: 11 }} />{subCount} sub-cat{subCount !== 1 ? "s" : ""}</span>
                          : <span className="badge bg-label-secondary" style={{ fontSize: 11, opacity: 0.6 }}>No sub-cats</span>}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div className="d-flex align-items-center gap-2">
                          <span className="rounded-circle" style={{ width: 7, height: 7, display: "inline-block", background: cat.isActive ? "#28c76f" : "#ea5455" }} />
                          <span className={`badge ${cat.isActive ? "bg-label-success" : "bg-label-secondary"}`} style={{ fontSize: 11 }}>
                            {cat.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px", color: "#888", fontSize: 12.5 }}>
                        {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString("en-GB") : "—"}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div className="d-flex gap-1">
                          <Link to={cat._id} className="pc-act btn btn-outline-primary" title="Edit"><i className="bx bx-edit-alt" /></Link>
                          <button className="pc-act btn btn-outline-danger" title="Delete"
                            onClick={() => setDeleteTarget({ id: cat._id, name: cat.name })}>
                            <i className="bx bx-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length > 0 && (
            <div className="card-footer d-flex align-items-center justify-content-between py-3 px-4" style={{ borderTop: "1px solid #f0f1f5" }}>
              <span className="text-muted" style={{ fontSize: 12.5 }}>Page <strong>{page}</strong> of <strong>{totalPages}</strong> · {filtered.length} records</span>
              <nav>
                <ul className="pagination pagination-sm mb-0 gap-1">
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button className="pc-pg btn btn-outline-secondary" onClick={() => setPage(1)}><i className="bx bx-chevrons-left" style={{ fontSize: 16 }} /></button>
                  </li>
                  <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                    <button className="pc-pg btn btn-outline-secondary" onClick={() => setPage(p => p - 1)}><i className="bx bx-chevron-left" style={{ fontSize: 16 }} /></button>
                  </li>
                  {buildPages().map((pg, i) =>
                    pg === "…"
                      ? <li key={`e${i}`} className="page-item disabled"><span className="pc-pg btn btn-outline-secondary" style={{ pointerEvents: "none" }}>…</span></li>
                      : <li key={pg}><button className={`pc-pg btn btn-outline-secondary ${page === pg ? "active" : ""}`} onClick={() => setPage(pg)}>{pg}</button></li>
                  )}
                  <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                    <button className="pc-pg btn btn-outline-secondary" onClick={() => setPage(p => p + 1)}><i className="bx bx-chevron-right" style={{ fontSize: 16 }} /></button>
                  </li>
                  <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                    <button className="pc-pg btn btn-outline-secondary" onClick={() => setPage(totalPages)}><i className="bx bx-chevrons-right" style={{ fontSize: 16 }} /></button>
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