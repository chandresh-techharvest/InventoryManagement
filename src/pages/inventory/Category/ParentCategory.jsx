import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getParentCategories,
  deleteParentCategory
} from "../../../lib/parentCategoryAPI";

export default function ParentCategory() {
  const [parentCategories, setParentCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;

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

  useEffect(() => {
    loadParentCategories();
  }, []);

  // ✅ filter
  const filtered = parentCategories.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const paginated = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this parent category?")) return;
    await deleteParentCategory(id);
    loadParentCategories();
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-semibold mb-0">Parent Categories</h4>

        <Link to="new" className="btn btn-primary">
          <i className="bx bx-plus me-1"></i>
          Add Category
        </Link>
      </div>

      {/* Search */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text bg-white">
              <i className="bx bx-search"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-responsive text-nowrap">
          <table className="table">
            <thead className="table-light">
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No categories found
                  </td>
                </tr>
              ) : (
                paginated.map((cat) => (
                  <tr key={cat._id}>
                    <td className="fw-semibold">{cat.name}</td>
                    <td className="text-muted">
                      {cat.description || "-"}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          cat.isActive
                            ? "bg-label-success"
                            : "bg-label-secondary"
                        }`}
                      >
                        {cat.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td>
                      {cat.createdAt
                        ? new Date(cat.createdAt)
                            .toLocaleDateString("en-GB")
                        : "-"}
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <Link
                          to={cat._id}
                          className="btn btn-sm btn-outline-primary"
                        >
                          Edit
                        </Link>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(cat._id)}
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

        {/* ✅ Pagination footer */}
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