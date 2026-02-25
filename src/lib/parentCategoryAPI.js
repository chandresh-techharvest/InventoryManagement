import api from "./api";

const BASE = "/parent-categories";

// Get all parent categories
export const getParentCategories = () => api.get(BASE);

// Get single parent category
export const getParentCategory = (id) => api.get(`${BASE}/${id}`);

// Create parent category
export const createParentCategory = (data) => api.post(BASE, data);

// Update parent category
export const updateParentCategory = (id, data) => api.put(`${BASE}/${id}`, data);

// Delete parent category
export const deleteParentCategory = (id) => api.delete(`${BASE}/${id}`);