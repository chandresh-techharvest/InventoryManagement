import { useEffect, useState } from "react";
import { getCategories, deleteCategory } from "../../lib/categoryAPI";

export default function Categories() {
  const [categories, setCategories] = useState([]);

  const loadCategories = async () => {
    const res = await getCategories();
    if (res.data.success) {
      setCategories(res.data.data);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDelete = async (id) => {
    await deleteCategory(id);
    loadCategories();
  };

  return (
    <div className="container-xxl">
      <h4 className="my-4">Categories</h4>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th width="120">Action</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c._id}>
              <td>{c.name}</td>
              <td>{c.description}</td>
              <td>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(c._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
