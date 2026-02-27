import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories, deleteCategory } from "../../../lib/categoryAPI";
import { getParentCategories } from "../../../lib/parentCategoryAPI";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [parents, setParents] = useState([]);
  const [search, setSearch] = useState("");
  const [parentFilter, setParentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadCategories = async () => {
    const res = await getCategories();
    if (res.data.success) setCategories(res.data.data);
  };

  const loadParents = async () => {
    const res = await getParentCategories();
    setParents(res.data.data || []);
  };

  useEffect(() => {
    loadCategories();
    loadParents();
  }, []);

  // ✅ Filters
  const filtered = categories.filter((c) => {
    const matchSearch = c.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchParent = parentFilter
      ? c.parentCategoryId?._id === parentFilter
      : true;

    const matchStatus =
      statusFilter === ""
        ? true
        : statusFilter === "active"
        ? c.isActive
        : !c.isActive;

    return matchSearch && matchParent && matchStatus;
  });

  // ✅ Pagination (AFTER filtered)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const paginated = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [search, parentFilter, statusFilter]);

  const handleDelete = async (id) => {
    if (window.confirm("Delete this category?")) {
      await deleteCategory(id);
      loadCategories();
    }
  };

  const resetFilters = () => {
    setSearch("");
    setParentFilter("");
    setStatusFilter("");
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Sub-Categories</h4>

        <Link to="new" className="btn btn-primary">
          <i className="bx bx-plus me-1"></i> Add Category
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-3">
        <div className="card-body d-flex gap-2 flex-wrap align-items-center">

          <div className="input-group" style={{ maxWidth: 730 }}>
            <span className="input-group-text bg-white">
              <i className="bx bx-search"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 160 }}
            value={parentFilter}
            onChange={(e) => setParentFilter(e.target.value)}
          >
            <option value="">All Parents</option>
            {parents.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: 160 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            className="btn btn-outline-secondary"
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th>Category</th>
                <th>Products</th>
                <th>Status</th>
                <th>Created</th>
                <th width="170">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    No categories found
                  </td>
                </tr>
              ) : (
                paginated.map((c) => (
                  <tr key={c._id}>
                    <td className="fw-semibold">{c.name}</td>

                    <td>
                      <span className="badge bg-label-primary">
                        {c.productCount ?? 0}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          c.isActive
                            ? "bg-label-success"
                            : "bg-label-secondary"
                        }`}
                      >
                        {c.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>

                    <td className="text-muted">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString("en-GB")
                        : "-"}
                    </td>

                    <td>
                      <div className="d-flex gap-2">
                        <Link
                          to={`${c._id}/edit`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          Edit
                        </Link>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(c._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="card-footer d-flex justify-content-between align-items-center">
            <div className="text-muted small">
              Page {page} of {totalPages} • {filtered.length} records
            </div>

            <div className="btn-group">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </button>

              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}