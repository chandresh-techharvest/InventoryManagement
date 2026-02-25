import api from "./api";

const BASE = "/categories";

// Get all categories
export const getCategories = () => api.get(BASE);

// Get single category
export const getCategory = (id) => api.get(`${BASE}/${id}`);

// Get tree
export const getCategoryTree = () => api.get(`${BASE}/tree`);

// Create
export const createCategory = (data) => api.post(BASE, data);

// Update
export const updateCategory = (id, data) => api.put(`${BASE}/${id}`, data);

// Delete
export const deleteCategory = (id) => api.delete(`${BASE}/${id}`);
