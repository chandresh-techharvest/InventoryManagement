import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createParentCategory,
  updateParentCategory,
  getParentCategory
} from "../../../lib/parentCategoryAPI";

export default function ParentCategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (id) loadParentCategory();
  }, [id]);

  const loadParentCategory = async () => {
    try {
      const res = await getParentCategory(id);
      const cat = res.data.data;
      setName(cat?.name || "");
      setDescription(cat?.description || "");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (id) {
        await updateParentCategory(id, { name, description });
      } else {
        await createParentCategory({ name, description });
      }
      navigate("../");
    } catch (err) {
      console.error("Create parent category error:", err.response?.data);
      alert(err.response?.data?.error || "Failed");
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <h4 className="fw-bold py-3 mb-4">
        {id ? "Edit Parent Category" : "Add Parent Category"}
      </h4>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Name</label>
              <input
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Description</label>
              <input
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="col-12">
              <button className="btn btn-primary">
                {id ? "Update" : "Create"}
              </button>

              <button
                type="button"
                className="btn btn-secondary ms-2"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}