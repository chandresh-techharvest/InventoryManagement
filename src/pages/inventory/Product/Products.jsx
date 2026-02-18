import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts, deleteProduct } from "../../../lib/productApi";

export default function Products() {
  const [products, setProducts] = useState([]);

  const load = async () => {
    const res = await getProducts();
    if (res.data.success) {
      setProducts(res.data.data);
    }
  };

  useEffect(() => {
    load();
  }, []);


  const handleDelete = async (id) => {
    if (!window.confirm("Delete product?")) return;
    await deleteProduct(id);
    load();
  };

  return (
    <div className="container-xxl">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center my-4">
        <h4>Products</h4>
        <Link to="new" className="btn btn-primary">
          + Add Product
        </Link>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-responsive text-nowrap">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Brand</th>
                <th>Variants</th>
                <th>Tax</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.brand}</td>

                  {/* Variant preview */}
                  <td>
                    {p.variants?.map((v, i) => (
                      <span
                        key={i}
                        className="badge bg-label-info me-1"
                      >
                        {Object.values(v.attributes).join(" / ")}
                      </span>
                    ))}
                  </td>

                  <td>{p.taxRate}%</td>

                  {/* Actions */}
                  <td>
                    <Link to={p._id} className="btn btn-sm btn-warning me-2">
                      Edit
                    </Link>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(p._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {products.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
