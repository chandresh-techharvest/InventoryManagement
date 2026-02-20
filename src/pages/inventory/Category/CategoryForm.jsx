import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getCategory,
  updateCategory,
  createCategory,
  getCategories
} from "../../../lib/categoryAPI";

export default function CategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: "",
    description: "",
    parentCategoryId: "",
    isActive: true
  });

  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    if (isEdit) loadCategory();
  }, [id]);

  const loadCategories = async () => {
    const res = await getCategories();
    if (res.data.success) {
      setAllCategories(res.data.data);
    }
  };

  const loadCategory = async () => {
    const res = await getCategory(id);
    if (res.data.success) {
      const c = res.data.data;
      setForm({
        name: c.name || "",
        description: c.description || "",
        parentCategoryId: c.parentCategoryId || "",
        isActive: c.isActive ?? true
      });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await updateCategory(id, form);
      } else {
        await createCategory(form);
      }
      navigate(-1);
    } catch (err) {
      alert("Error saving category");
    }

    setLoading(false);
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      
      {/* Header */}
      <div className="mb-4">
        <h4 className="fw-bold mb-1">
          {isEdit ? "Edit Category" : "Add Category"}
        </h4>
        <div className="text-muted small">
          Inventory / Categories / {isEdit ? "Edit" : "New"}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-4">

              {/* Name */}
              <div className="col-md-6">
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Parent */}
              <div className="col-md-6">
                <label className="form-label">Parent Category</label>
                <select
                  name="parentCategoryId"
                  className="form-select"
                  value={form.parentCategoryId}
                  onChange={handleChange}
                >
                  <option value="">None</option>
                  {allCategories
                    .filter((c) => c._id !== id)
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Description */}
              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  rows="3"
                  className="form-control"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              {/* Active */}
              <div className="col-12">
                <div className="form-check form-switch">
                  <input
                    type="checkbox"
                    name="isActive"
                    className="form-check-input"
                    checked={form.isActive}
                    onChange={handleChange}
                  />
                  <label className="form-check-label">
                    Active Category
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="col-12 d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : isEdit
                    ? "Update Category"
                    : "Create Category"}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
