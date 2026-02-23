import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getParentCategories,
  deleteParentCategory
} from "../../../lib/parentCategoryAPI";

export default function ParentCategory() {
  const [parentCategories, setParentCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadParentCategories();
  }, []);

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

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this parent category?")) return;
    try {
      await deleteParentCategory(id);
      loadParentCategories();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Parent Categories</h4>

        <Link to="new" className="btn btn-primary">
          Add Parent Category
        </Link>
      </div>

      <div className="card">
        <div className="table-responsive text-nowrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center">
                    Loading...
                  </td>
                </tr>
              ) : parentCategories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center">
                    No parent categories found
                  </td>
                </tr>
              ) : (
                parentCategories.map((cat, index) => (
                  <tr key={cat._id}>
                    <td>{index + 1}</td>
                    <td>{cat.name}</td>
                    <td>{cat.description || "-"}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Link
                          to={`${cat._id}/edit`}
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
      </div>
    </div>
  );
}