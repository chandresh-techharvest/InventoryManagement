import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProducts, deleteProduct } from "../../../lib/productApi";
import { getCategories } from "../../../lib/categoryAPI";

export default function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    categoryId: "",
    stock: "",
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selected, setSelected] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // 🔹 LOAD PRODUCTS (server filters)
  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    setPage(1);

    try {
      const params = {};

      if (filters.search) params.search = filters.search;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.status !== "")
        params.isActive = filters.status === "active";

      const res = await getProducts(params);
      if (res.data.success) setProducts(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.categoryId, filters.status]);

  // 🔹 CLIENT STOCK FILTER
  useEffect(() => {
    let data = [...products];

    if (filters.stock === "in")
      data = data.filter((p) => (p.stock ?? 0) > 0);

    if (filters.stock === "out")
      data = data.filter((p) => (p.stock ?? 0) <= 0);

    setFiltered(data);
    setPage(1);
    setSelected(new Set());
  }, [products, filters.stock]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getCategories().then((res) => {
      console.log("Categories:", res.data.data);
      if (res.data.success) setCategories(res.data.data);
    });
  }, []);

  // 🔹 PAGINATION
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // 🔹 SELECTION
  const pageIds = paginated.map((p) => p._id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
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

  // 🔹 DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Delete product?")) return;
    await deleteProduct(id);
    load();
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} products?`)) return;

    setBulkDeleting(true);
    try {
      await Promise.all([...selected].map((id) => deleteProduct(id)));
      load();
    } finally {
      setBulkDeleting(false);
    }
  };

  // 🔹 FILTERS
  const handleFilterChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      status: "",
      categoryId: "",
      stock: "",
    });
  };

  return (
    <div className="container-xxl container-p-y">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Products</h4>

        <div className="d-flex gap-2">
          {selected.size > 0 && (
            <button
              className="btn btn-danger"
              disabled={bulkDeleting}
              onClick={handleBulkDelete}
            >
              {bulkDeleting
                ? "Deleting..."
                : `Delete (${selected.size})`}
            </button>
          )}

          <Link to="new" className="btn btn-primary">
            <i className="bx bx-plus me-1"></i> Add Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-center">

            {/* Search */}
            <div className="col-12 col-md-auto flex-md-grow-1">
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search name / SKU"
                className="form-control"
              />
            </div>

            {/* Category */}
            <div className="col-6 col-md-auto">
              <select
                name="categoryId"
                value={filters.categoryId}
                onChange={handleFilterChange}
                className="form-select"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="col-6 col-md-auto">
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="form-select"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Stock */}
            <div className="col-6 col-md-auto">
              <select
                name="stock"
                value={filters.stock}
                onChange={handleFilterChange}
                className="form-select"
              >
                <option value="">All Stock</option>
                <option value="in">In</option>
                <option value="out">Out</option>
              </select>
            </div>

            {/* Reset */}
            <div className="col-6 col-md-auto">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={resetFilters}
              >
                Reset
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="card">
        <div className="table-responsive">
          <table className="table align-middle table-hover">
            <thead className="table-light">
              <tr>
                <th width="40">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Product</th>
                <th>Category</th>
                <th>Variants</th>
                <th>Stock</th>
                <th>Status</th>
                <th width="140">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    No products found
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(p._id)}
                        onChange={() => toggleSelect(p._id)}
                      />
                    </td>

                    <td>
                      <div className="fw-semibold">{p.name}</div>
                      <small className="text-muted">
                        SKU: {p.sku} • {p.brand || "-"}
                      </small>
                    </td>

                    <td>
                      <span className="badge bg-label-primary">
                        {p.categoryId?.name || "-"}
                      </span>
                    </td>

                    <td>
                      {p.variants?.length > 0 ? (
                        <span className="badge bg-label-info">
                          {p.variants.length} variants
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    <td>
                      {(p.stock ?? 0) > 0 ? (
                        <span className="fw-semibold text-success">
                          {p.stock}
                        </span>
                      ) : (
                        <span className="fw-semibold text-danger">
                          Out
                        </span>
                      )}
                    </td>

                    <td>
                      {p.isActive ? (
                        <span className="badge bg-label-success">
                          Active
                        </span>
                      ) : (
                        <span className="badge bg-label-secondary">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate(`${p._id}`)}
                        >
                          Edit
                        </button>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(p._id)}
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

        {/* PAGINATION */}
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
      </div>
    </div>
  );
}
