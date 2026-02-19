import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCategories, deleteCategory } from "../../../lib/categoryAPI";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const loadCategories = async () => {
    const res = await getCategories();
    console.log("Categories loaded:", res.data);
    if (res.data.success) {
      setCategories(res.data.data);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Delete this category?")) {
      await deleteCategory(id);
      loadCategories();
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container-xxl flex-grow-1 container-p-y">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Categories</h4>
        <Link to="new" className="btn btn-primary">
          <i className="bx bx-plus me-1"></i> Add Category
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-3">
        <div className="card-body d-flex gap-3 align-items-center">
          <div className="input-group">
            <span className="input-group-text">
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
          <button
            className="btn btn-outline-secondary"
            onClick={() => setSearch("")}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Category</th>
                {/* <th>Parent</th> */}
                <th>Products</th>
                <th>Status</th>
                <th>Created</th>
                <th width="170">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No categories found
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c._id} className="table-row-hover">

                    {/* Category */}
                    <td>
                      <div className="fw-semibold">{c.name}</div>
                    </td>

                    {/* Parent — fixed: was c.parentName, now c.parentCategoryId?.name */}
                    {/* <td>
                      {c.parentCategoryId?.name ? (
                        <span className="badge bg-label-info">
                          {c.parentCategoryId.name}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td> */}

                    {/* Products — now populated by backend */}
                    <td>
                      <span className="badge bg-label-primary">
                        {c.productCount ?? 0}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      {c.isActive ? (
                        <span className="badge bg-label-success">Active</span>
                      ) : (
                        <span className="badge bg-label-secondary">Inactive</span>
                      )}
                    </td>

                    {/* Created */}
                    <td className="text-muted">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString()
                        : "-"}
                    </td>

                    {/* Actions */}
                    <td onClick={(e) => e.stopPropagation()}>
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
      </div>
    </div>
  );
}