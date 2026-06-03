import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit2, Trash2, Search, X, Upload, RefreshCw, 
  Package, TrendingUp, Clock, Filter, Grid3x3, Table2,
  Star, Eye, Archive
} from "lucide-react";
import { productsApi } from "../../services/productsApi";
import { categoriesApi } from "../../services/categoriesApi";

export function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  const [form, setForm] = useState({
    name: "",
    description: "",
    short_description: "",
    category_id: "",
    subcategory_id: null,
    price: null,
    compare_price: null,
    cost_per_unit: null,
    stock_quantity: null,
    low_stock_threshold: 5,
    unit: "piece",
    unit_value: null,
    main_image: "",
    gallery_images: [],
    slug: "",
    meta_title: "",
    meta_description: "",
    status: "active",
    is_featured: false,
    is_trending: false,
    tags: [],
    weight_in_grams: null,
    brand: "",
    sku: null,
    barcode: null,
    has_variants: false,
    variant_attributes: [],
    variants: [],
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsData = await productsApi.getAll();
      const validProducts = productsData.filter(p => p && p._id);
      setProducts(validProducts);
    } catch (error) {
      alert("Failed to fetch products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesData = await categoriesApi.getAll("active");
      setCategories(categoriesData);
    } catch (error) {
      // Silent error handling
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      short_description: product.short_description || "",
      category_id: product.category_id || "",
      subcategory_id: product.subcategory_id || null,
      price: product.price || null,
      compare_price: product.compare_price || null,
      cost_per_unit: product.cost_per_unit || null,
      stock_quantity: product.stock_quantity || null,
      low_stock_threshold: product.low_stock_threshold || 5,
      unit: product.unit || "piece",
      unit_value: product.unit_value || null,
      main_image: product.main_image || "",
      gallery_images: product.gallery_images || [],
      slug: product.slug || "",
      meta_title: product.meta_title || "",
      meta_description: product.meta_description || "",
      status: product.status || "active",
      is_featured: product.is_featured || false,
      is_trending: product.is_trending || false,
      tags: product.tags || [],
      weight_in_grams: product.weight_in_grams || null,
      brand: product.brand || "",
      sku: product.sku || null,
      barcode: product.barcode || null,
      has_variants: product.has_variants || false,
      variant_attributes: product.variant_attributes || [],
      variants: product.variants || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (product) => {
    const currentProduct = products.find(p => p._id === product._id);
    if (!currentProduct) {
      alert("Product not found. Refreshing list...");
      await fetchProducts();
      return;
    }
    
    const orderCount = product.total_orders || 0;
    
    if (orderCount > 0) {
      if (confirm(`⚠️ "${product.name}" is used in ${orderCount} order(s). Mark as inactive instead?`)) {
        try {
          await productsApi.update(product._id, { ...product, status: "inactive" });
          await fetchProducts();
          alert("✅ Product marked as inactive!");
        } catch (error) {
          alert("Failed to mark product as inactive");
        }
      }
      return;
    }
    
    if (confirm(`Delete "${product.name}"? This action cannot be undone.`)) {
      try {
        await productsApi.delete(product._id);
        alert("✅ Product deleted successfully!");
        await fetchProducts();
      } catch (error) {
        alert("Failed to delete product. Please refresh and try again.");
        await fetchProducts();
      }
    }
  };

  const compressAndConvertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxWidth = 500;
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Max 5MB');
      return;
    }
    setUploading(true);
    try {
      const base64String = await compressAndConvertToBase64(file);
      setForm({ ...form, main_image: base64String });
      alert('✅ Image uploaded and compressed!');
    } catch (error) {
      alert('Failed to process image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      alert("Product name is required");
      return;
    }
    if (!form.category_id) {
      alert("Please select a category");
      return;
    }
    if (!form.description.trim()) {
      alert("Product description is required");
      return;
    }
    if (!form.price || form.price <= 0) {
      alert("Please enter a valid price");
      return;
    }

    const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    try {
      setSubmitting(true);
      
      const productData = {
        name: form.name.trim(),
        description: form.description.trim(),
        short_description: form.short_description?.trim() || "",
        category_id: form.category_id,
        subcategory_id: form.subcategory_id || null,
        price: Number(form.price),
        compare_price: form.compare_price ? Number(form.compare_price) : null,
        cost_per_unit: form.cost_per_unit ? Number(form.cost_per_unit) : null,
        stock_quantity: form.stock_quantity ? Number(form.stock_quantity) : 0,
        low_stock_threshold: Number(form.low_stock_threshold || 5),
        unit: form.unit,
        unit_value: form.unit_value ? Number(form.unit_value) : null,
        main_image: form.main_image || "",
        gallery_images: form.gallery_images || [],
        slug: slug,
        meta_title: form.meta_title || "",
        meta_description: form.meta_description || "",
        status: form.status,
        is_featured: form.is_featured,
        is_trending: form.is_trending,
        tags: form.tags || [],
        weight_in_grams: form.weight_in_grams ? Number(form.weight_in_grams) : null,
        brand: form.brand || "",
        sku: form.sku || null,
        barcode: form.barcode || null,
        has_variants: form.has_variants || false,
        variant_attributes: form.variant_attributes || [],
        variants: form.variants || [],
      };

      if (editingId) {
        await productsApi.update(editingId, productData);
        alert("Product updated successfully!");
        await fetchProducts();
        setShowModal(false);
        resetForm();
      } else {
        await productsApi.create(productData);
        alert("Product created successfully!");
        await fetchProducts();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      alert(error.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      short_description: "",
      category_id: "",
      subcategory_id: null,
      price: null,
      compare_price: null,
      cost_per_unit: null,
      stock_quantity: null,
      low_stock_threshold: 5,
      unit: "piece",
      unit_value: null,
      main_image: "",
      gallery_images: [],
      slug: "",
      meta_title: "",
      meta_description: "",
      status: "active",
      is_featured: false,
      is_trending: false,
      tags: [],
      weight_in_grams: null,
      brand: "",
      sku: null,
      barcode: null,
      has_variants: false,
      variant_attributes: [],
      variants: [],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#8B2C2C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your product inventory</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                viewMode === "grid" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
              }`}
            >
              <Grid3x3 className="w-4 h-4" /> Grid
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                viewMode === "table" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"
              }`}
            >
              <Table2 className="w-4 h-4" /> Table
            </button>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-[#8B2C2C] to-[#6B1E1E] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B2C2C]/20 focus:border-[#8B2C2C]"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all">
          <Filter className="w-4 h-4" /> Filter
        </button>
        <button onClick={fetchProducts} className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Products - Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product, idx) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group"
            >
              <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100">
                {product.main_image ? (
                  <img src={product.main_image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(product)} className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-blue-50 transition-colors">
                    <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                  </button>
                  <button onClick={() => handleDelete(product)} className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  </button>
                </div>
                {product.is_featured && (
                  <span className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                    <Star className="w-3 h-3" /> Featured
                  </span>
                )}
                {product.is_trending && (
                  <span className="absolute bottom-2 left-2 bg-[#8B2C2C] text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Trending
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{product.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{product.category_name || product.category_id}</p>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-lg font-bold text-[#8B2C2C]">₹{product.price}</span>
                    {product.compare_price && (
                      <span className="text-xs text-gray-400 line-through ml-2">₹{product.compare_price}</span>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    product.status === "active" ? "bg-emerald-100 text-emerald-700" : 
                    product.status === "inactive" ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-700"
                  }`}>
                    {product.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Package className="w-3 h-3" /> {product.stock_quantity || 0} units
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" /> {product.unit}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.map((product, idx) => (
                  <motion.tr
                    key={product._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {product.main_image ? (
                          <img src={product.main_image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-800">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">
                        {product.category_name || product.category_id}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <span className="text-sm font-semibold text-gray-800">₹{product.price}</span>
                        {product.compare_price && (
                          <span className="text-xs text-gray-400 line-through ml-2">₹{product.compare_price}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        (product.stock_quantity || 0) > 10 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}>
                        {product.stock_quantity || 0} units
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        product.status === "active" ? "bg-emerald-100 text-emerald-700" : 
                        product.status === "inactive" ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-700"
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(product)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No products found</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-8"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
                <h3 className="font-semibold text-gray-800">{editingId ? "Edit Product" : "Add New Product"}</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Product Image */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-600">Product Image</label>
                    <span className="text-xs text-gray-400">Supports JPG, PNG (Max 5MB)</span>
                  </div>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-[#8B2C2C] cursor-pointer transition-colors relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      disabled={uploading}
                    />
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B2C2C]"></div>
                        <p className="text-sm text-gray-500">Processing image...</p>
                      </div>
                    ) : form.main_image ? (
                      <div className="relative">
                        <img 
                          src={form.main_image} 
                          alt="Preview" 
                          className="w-32 h-32 object-cover rounded-lg"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/128x128?text=Invalid+Image'; }}
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, main_image: "" })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400" />
                        <p className="text-sm text-gray-500">Click to upload product image</p>
                        <p className="text-xs text-gray-400">Image will be compressed automatically</p>
                      </>
                    )}
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Or Paste Image URL</label>
                    <input
                      type="text"
                      value={form.main_image}
                      onChange={(e) => setForm({ ...form, main_image: e.target.value })}
                      placeholder="https://example.com/product-image.jpg"
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B2C2C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Product Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B2C2C]"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                    <select
                      value={form.category_id}
                      onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B2C2C]"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.price || ""}
                      onChange={(e) => setForm({ ...form, price: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B2C2C]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Compare Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.compare_price || ""}
                      onChange={(e) => setForm({ ...form, compare_price: e.target.value ? parseFloat(e.target.value) : null })}
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B2C2C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                    <select
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B2C2C]"
                    >
                      <option value="kg">Kilogram (kg)</option>
                      <option value="gram">Gram (g)</option>
                      <option value="liter">Liter (L)</option>
                      <option value="ml">Milliliter (ml)</option>
                      <option value="piece">Piece</option>
                      <option value="packet">Packet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      value={form.stock_quantity || ""}
                      onChange={(e) => setForm({ ...form, stock_quantity: e.target.value ? parseInt(e.target.value) : 0 })}
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B2C2C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B2C2C]"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B2C2C] resize-none"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Short Description</label>
                    <textarea
                      value={form.short_description}
                      onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B2C2C] resize-none"
                    />
                  </div>

                  <div className="col-span-2 flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_featured}
                        onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                        className="rounded border-gray-300 text-[#8B2C2C] focus:ring-[#8B2C2C]"
                      />
                      <span className="text-sm text-gray-700">Featured Product</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_trending}
                        onChange={(e) => setForm({ ...form, is_trending: e.target.checked })}
                        className="rounded border-gray-300 text-[#8B2C2C] focus:ring-[#8B2C2C]"
                      />
                      <span className="text-sm text-gray-700">Trending Product</span>
                    </label>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">SKU (Stock Keeping Unit)</label>
                    <input
                      type="text"
                      value={form.sku || ""}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      placeholder="Unique product identifier"
                      className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8B2C2C]"
                    />
                  </div>
                </div>

                <div className="flex gap-3 sticky bottom-0 bg-white pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-gradient-to-r from-[#8B2C2C] to-[#6B1E1E] text-white rounded-xl text-sm font-medium hover:shadow-md transition-all disabled:opacity-50">
                    {submitting ? "Saving..." : editingId ? "Update Product" : "Add Product"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}