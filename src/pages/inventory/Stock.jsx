import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function Stock() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = async () => {
    const { data } = await api.get("/products");
    const stock = [];

    data.data.forEach((p) => {
      p.variants.forEach((v) => {
        stock.push({
          name: p.name,
          sku: p.sku,
          color: v.attributes?.color,
          size: v.attributes?.size,
          price: v.price,
        });
      });
    });

    setItems(stock);
  };

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <h4 className="mb-4">Stock</h4>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Color</th>
              <th>Size</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, idx) => (
              <tr key={idx}>
                <td>{i.name}</td>
                <td>{i.sku}</td>
                <td>{i.color}</td>
                <td>{i.size}</td>
                <td>₹{i.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
