// src/services/productsApi.js
import apiRequest from './api';

export const productsApi = {
  // Get all products with filters
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.status) params.append('status', filters.status);
      if (filters.is_featured !== undefined) params.append('is_featured', filters.is_featured);
      if (filters.search) params.append('search', filters.search);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.sort_order) params.append('sort_order', filters.sort_order);
      
      const response = await apiRequest(`/admin/products?${params.toString()}`);
      return response.products || [];
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  },
  
  // Get single product
  getById: async (id) => {
    try {
      const response = await apiRequest(`/admin/admin/products/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Get product by slug (for customer facing)
  getBySlug: async (slug) => {
    try {
      const response = await apiRequest(`/customer/products/${slug}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Create product - FIXED: Only include variant_combinations when has_variants is true
  create: async (data) => {
    try {
      console.log("Creating product with data:", JSON.stringify(data, null, 2));
      
      if (!data.name) throw new Error("Product name is required");
      if (!data.category_id) throw new Error("Category ID is required");
      if (!data.price) throw new Error("Price is required");
      
      const productData = {
        name: data.name,
        description: data.description || "",
        short_description: data.short_description || "",
        category_id: data.category_id,
        subcategory_id: data.subcategory_id || null,
        price: Number(data.price),
        compare_price: data.compare_price ? Number(data.compare_price) : null,
        cost_per_unit: data.cost_per_unit ? Number(data.cost_per_unit) : null,
        stock_quantity: Number(data.stock_quantity) || 0,
        low_stock_threshold: Number(data.low_stock_threshold) || 5,
        unit: data.unit || "piece",
        unit_value: data.unit_value ? Number(data.unit_value) : null,
        main_image: data.main_image || "",
        gallery_images: data.gallery_images || [],
        slug: data.slug || "",
        meta_title: data.meta_title || "",
        meta_description: data.meta_description || "",
        status: data.status || "draft",
        is_featured: data.is_featured || false,
        is_trending: data.is_trending || false,
        tags: data.tags || [],
        weight_in_grams: data.weight_in_grams ? Number(data.weight_in_grams) : null,
        brand: data.brand || "",
        sku: data.sku || `SKU-${Date.now()}`,
        barcode: data.barcode || null,
        has_variants: data.has_variants || false,
        variant_attributes: data.variant_attributes || [],
        variants: data.variants || [],
      };
      
      // ✅ Only include variant_combinations if has_variants is true
      if (data.has_variants && data.variant_combinations && data.variant_combinations.length > 0) {
        productData.variant_combinations = data.variant_combinations;
      }
      
      console.log("Final product data being sent:", JSON.stringify(productData, null, 2));
      
      const response = await apiRequest('/admin/products', {
        method: 'POST',
        body: productData,
      });
      return response.data || response;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  },
  
  // Update product
  update: async (id, data) => {
    try {
      console.log("Updating product with data:", JSON.stringify(data, null, 2));
      
      const productData = {
        name: data.name,
        description: data.description || "",
        short_description: data.short_description || "",
        category_id: data.category_id,
        subcategory_id: data.subcategory_id || null,
        price: Number(data.price),
        compare_price: data.compare_price ? Number(data.compare_price) : null,
        cost_per_unit: data.cost_per_unit ? Number(data.cost_per_unit) : null,
        stock_quantity: Number(data.stock_quantity) || 0,
        low_stock_threshold: Number(data.low_stock_threshold) || 5,
        unit: data.unit || "piece",
        unit_value: data.unit_value ? Number(data.unit_value) : null,
        main_image: data.main_image || "",
        gallery_images: data.gallery_images || [],
        slug: data.slug || "",
        meta_title: data.meta_title || "",
        meta_description: data.meta_description || "",
        status: data.status || "draft",
        is_featured: data.is_featured || false,
        is_trending: data.is_trending || false,
        tags: data.tags || [],
        weight_in_grams: data.weight_in_grams ? Number(data.weight_in_grams) : null,
        brand: data.brand || "",
        sku: data.sku || "",
        barcode: data.barcode || null,
        has_variants: data.has_variants || false,
        variant_attributes: data.variant_attributes || [],
        variants: data.variants || [],
      };
      
      console.log("Final update data being sent:", JSON.stringify(productData, null, 2));
      
      const response = await apiRequest(`/admin/admin/products/${id}`, {
        method: 'PUT',
        body: productData,
      });
      return response.data || response;
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },
  
  // Delete product
  delete: async (id) => {
    try {
      const response = await apiRequest(`/admin/admin/products/${id}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  },
  
  // Bulk update stock
  bulkUpdateStock: async (updates) => {
    try {
      const response = await apiRequest('/admin/admin/products/bulk/stock', {
        method: 'POST',
        body: { updates },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Bulk update status
  bulkUpdateStatus: async (updates) => {
    try {
      const response = await apiRequest('/admin/admin/products/bulk/status', {
        method: 'POST',
        body: { updates },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Update variant stock
  updateVariantStock: async (productId, variantSku, stockQuantity) => {
    try {
      const response = await apiRequest(`/admin/admin/products/${productId}/variants/${variantSku}/stock`, {
        method: 'PUT',
        body: { variant_sku: variantSku, stock_quantity: stockQuantity },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Update variant price
  updateVariantPrice: async (productId, variantSku, price, comparePrice = null) => {
    try {
      const response = await apiRequest(`/admin/admin/products/${productId}/variants/${variantSku}/price`, {
        method: 'PUT',
        body: { variant_sku: variantSku, price, compare_price: comparePrice },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Get low stock products (for admin alerts)
  getLowStockProducts: async (threshold = 10) => {
    try {
      const products = await productsApi.getAll();
      const lowStockProducts = products.filter(p => (p.stock_quantity || 0) <= threshold);
      return lowStockProducts;
    } catch (error) {
      return [];
    }
  },
  
  // Get out of stock products
  getOutOfStockProducts: async () => {
    try {
      const products = await productsApi.getAll();
      const outOfStockProducts = products.filter(p => (p.stock_quantity || 0) === 0);
      return outOfStockProducts;
    } catch (error) {
      return [];
    }
  },
  
  // Update stock only (simple method)
  updateStock: async (id, stockQuantity) => {
    try {
      const product = await productsApi.getById(id);
      const updatedData = {
        ...product,
        stock_quantity: stockQuantity,
      };
      return productsApi.update(id, updatedData);
    } catch (error) {
      throw error;
    }
  },
  
  // Decrease stock (convenience method)
  decreaseStock: async (id, quantity) => {
    try {
      const product = await productsApi.getById(id);
      const currentStock = product.stock_quantity || 0;
      const newStock = Math.max(0, currentStock - quantity);
      return productsApi.updateStock(id, newStock);
    } catch (error) {
      throw error;
    }
  },
  
  // Increase stock (for returns/restocks)
  increaseStock: async (id, quantity) => {
    try {
      const product = await productsApi.getById(id);
      const currentStock = product.stock_quantity || 0;
      const newStock = currentStock + quantity;
      return productsApi.updateStock(id, newStock);
    } catch (error) {
      throw error;
    }
  },
  
  // Check if product is in stock
  checkStock: async (id, requestedQuantity = 1) => {
    try {
      const product = await productsApi.getById(id);
      const currentStock = product.stock_quantity || 0;
      return {
        inStock: currentStock >= requestedQuantity,
        availableQuantity: currentStock,
        requestedQuantity: requestedQuantity,
        productName: product.name
      };
    } catch (error) {
      return { inStock: false, availableQuantity: 0, requestedQuantity, error: error.message };
    }
  }
};

export default productsApi;