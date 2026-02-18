import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCategory, updateCategory, createCategory, getCategories, deleteCategory } from "../../../lib/categoryAPI";

export default function CategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: "",
    description: ""
  });

  const [loading, setLoading] = useState(false);

  // Load category if edit
  useEffect(() => {
    if (isEdit) loadCategory();
  }, [id]);

  const loadCategory = async () => {
    const res = await getCategory(id);
    if (res.data.success) {
      setForm({
        name: res.data.data.name || "",
        description: res.data.data.description || ""
      });
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">
          {isEdit ? "Edit Category" : "Add Category"}
        </h4>
      </div>

      {/* Card */}
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

              {/* Description */}
              <div className="col-md-12">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  rows="3"
                  className="form-control"
                  value={form.description}
                  onChange={handleChange}
                />
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