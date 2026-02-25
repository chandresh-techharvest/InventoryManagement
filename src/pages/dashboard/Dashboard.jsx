import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";

export default function Dashboard() {
  const { tenant } = useAuth();

  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories"),
      ]);

      const products = productsRes.data.data || [];
      const categories = categoriesRes.data.data || [];

      const lowStock = products.filter(p => p.stock <= 10 && p.stock > 0).length;
      const outOfStock = products.filter(p => p.stock === 0).length;

      setStats({
        products: products.length,
        categories: categories.length,
        lowStock,
        outOfStock,
      });
    } catch (err) {
      console.error("Dashboard stats error", err);
    }
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">

      <div className="row">

        <div className="col-lg-3 col-md-6 col-12 mb-4">
          <div className="card">
            <div className="card-body">
              <span className="fw-semibold d-block mb-1">Total Products</span>
              <h3 className="card-title mb-2">{stats.products}</h3>
              <small className="text-success fw-semibold">
                <i className="bx bx-up-arrow-alt"></i> Live data
              </small>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 col-12 mb-4">
          <div className="card">
            <div className="card-body">
              <span className="fw-semibold d-block mb-1">Low Stock</span>
              <h3 className="card-title text-warning mb-2">{stats.lowStock}</h3>
              <small className="text-muted">Needs reorder</small>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 col-12 mb-4">
          <div className="card">
            <div className="card-body">
              <span className="fw-semibold d-block mb-1">Out of Stock</span>
              <h3 className="card-title text-danger mb-2">{stats.outOfStock}</h3>
              <small className="text-muted">Immediate action</small>
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-6 col-12 mb-4">
          <div className="card">
            <div className="card-body">
              <span className="fw-semibold d-block mb-1">Categories</span>
              <h3 className="card-title mb-2">{stats.categories}</h3>
              <small className="text-muted">{tenant?.businessName}</small>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}







// import { useEffect, useState } from "react";
// import { getProducts } from "../lib/productAPI";

// export default function Dashboard() {
//   const [products, setProducts] = useState([]);

//   useEffect(() => {
//     getProducts().then(res => {
//       setProducts(res.data.data);
//     });
//   }, []);

//   return (
//     <div className="card">
//       <div className="card-body">
//         <h4>Products</h4>

//         <table className="table">
//           <thead>
//             <tr>
//               <th>SKU</th>
//               <th>Name</th>
//               <th>Brand</th>
//               <th>UOM</th>
//             </tr>
//           </thead>

//           <tbody>
//             {products.map(p => (
//               <tr key={p._id}>
//                 <td>{p.sku}</td>
//                 <td>{p.name}</td>
//                 <td>{p.brand}</td>
//                 <td>{p.uom}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }
