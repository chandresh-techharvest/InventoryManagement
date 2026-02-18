import api from "./api";

const BASE = import.meta.env.VITE_API_URL + "/categories";

export const getCategories = () => api.get(BASE);
export const getCategoryTree = () => api.get(`${BASE}/tree`);
export const createCategory = (data) => api.post(BASE, data);
export const updateCategory = (id, data) => api.put(`${BASE}/${id}`, data);
export const deleteCategory = (id) => api.delete(`${BASE}/${id}`);
