import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit2, Trash2, Search, X, Upload, RefreshCw, 
  Package, TrendingUp, Clock, Filter, Grid3x3, Table2,
  Star, Eye, Archive, ChevronDown, PlusCircle, MinusCircle,
  Box, Layers, DollarSign, RefreshCcw, Tag
} from "lucide-react";
import { productsApi } from "../../services/productsApi";
import { categoriesApi } from "../../services/categoriesApi";

const unitOptions = [
  { value: "kg", label: "Kilogram (kg)" },
  { value: "gram", label: "Gram (g)" },
  { value: "liter", label: "Liter (L)" },
  { value: "ml", label: "Milliliter (ml)" },
  { value: "piece", label: "Piece" },
  { value: "packet", label: "Packet" },
  { value: "dozen", label: "Dozen" },
  { value: "bottle", label: "Bottle" },
  { value: "box", label: "Box" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
  { value: "out_of_stock", label: "Out of Stock" },
];

// Auto-generate SKU from product name
const generateSKU = (productName) => {
  if (!productName) return "";
  const prefix = productName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
  const randomNum = Math.floor(Math.random() * 9999);
  return `${prefix}${randomNum}`;
};

// Auto-generate slug from product name
const generateSlug = (productName) => {
  if (!productName) return "";
  return productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
};

export function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [tagInput, setTagInput] = useState("");
  
  // Form state - matches API schema exactly
  const [form, setForm] = useState({
    name: "",
    description: "",
    short_description: "",
    category_id: "",
    subcategory_id: null,
    price: null,
    compare_price: null,
    cost_per_unit: null,
    stock_quantity: 0,
    low_stock_threshold: 5,
    unit: "piece",
    unit_value: null,
    main_image: "",
    gallery_images: [],
    slug: "",
    meta_title: "",
    meta_description: "",
    status: "draft",
    is_featured: false,
    is_trending: false,
    tags: [],
    weight_in_grams: null,
    brand: "",
    sku: "",
    barcode: "",
    has_variants: false,
    variant_attributes: [],
    variants: [],
    variant_combinations: [],
  });

  // Variant builder
  const [variantAttributes, setVariantAttributes] = useState([]);
  const [newAttributeName, setNewAttributeName] = useState("");
  const [newAttributeValues, setNewAttributeValues] = useState("");
  const [generatedVariants, setGeneratedVariants] = useState([]);

  // Auto-generate fields when product name changes
  useEffect(() => {
    if (!editingId && form.name) {
      if (!form.sku) {
        setForm(prev => ({ ...prev, sku: generateSKU(form.name) }));
      }
      if (!form.slug) {
        setForm(prev => ({ ...prev, slug: generateSlug(form.name) }));
      }
    }
  }, [form.name, editingId]);

  const refreshSKU = () => {
    if (form.name) {
      setForm(prev => ({ ...prev, sku: generateSKU(form.name) }));
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const generateCombinations = (attributes) => {
    if (attributes.length === 0) return [];
    const cartesian = (arrays) => {
      if (arrays.length === 0) return [[]];
      const result = [];
      const rest = cartesian(arrays.slice(1));
      for (const item of arrays[0]) {
        for (const combination of rest) {
          result.push([item, ...combination]);
        }
      }
      return result;
    };
    const attributeArrays = attributes.map(attr => 
      attr.values.map(value => ({ name: attr.name, value }))
    );
    const combinations = cartesian(attributeArrays);
    return combinations.map(combo => ({
      sku: `${form.sku || form.name?.substring(0, 3) || 'VAR'}-${combo.map(a => a.value.toUpperCase().substring(0, 3)).join('-')}`,
      attributes: combo,
      price: form.price || null,
      compare_price: null,
      cost_per_unit: null,
      stock_quantity: 0,
      low_stock_threshold: 5,
      images: [],
      weight_in_grams: null,
      barcode: "",
      status: "active",
    }));
  };

  const addAttribute = () => {
    if (newAttributeName.trim() && newAttributeValues.trim()) {
      const values = newAttributeValues.split(",").map(v => v.trim());
      const newAttributes = [...variantAttributes, { name: newAttributeName.trim(), values }];
      setVariantAttributes(newAttributes);
      setGeneratedVariants(generateCombinations(newAttributes));
      setNewAttributeName("");
      setNewAttributeValues("");
      // Also update form variant_attributes and variant_combinations
      setForm(prev => ({
        ...prev,
        variant_attributes: newAttributes.map(a => a.name),
        variant_combinations: newAttributes,
      }));
    }
  };

  const removeAttribute = (index) => {
    const newAttributes = variantAttributes.filter((_, i) => i !== index);
    setVariantAttributes(newAttributes);
    setGeneratedVariants(generateCombinations(newAttributes));
    setForm(prev => ({
      ...prev,
      variant_attributes: newAttributes.map(a => a.name),
      variant_combinations: newAttributes,
    }));
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...generatedVariants];
    newVariants[index][field] = value;
    setGeneratedVariants(newVariants);
    setForm(prev => ({ ...prev, variants: newVariants }));
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const removeTag = (tag) => {
    setForm({ ...form, tags: form.tags.filter(t => t !== tag) });
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productsApi.getAll();
      setProducts(data.filter(p => p && p._id));
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoriesApi.getAll("active");
      setCategories(data);
    } catch (error) {}
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesCategory = !categoryFilter || p.category_id === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("");
  };

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
      stock_quantity: product.stock_quantity || 0,
      low_stock_threshold: product.low_stock_threshold || 5,
      unit: product.unit || "piece",
      unit_value: product.unit_value || null,
      main_image: product.main_image || "",
      gallery_images: product.gallery_images || [],
      slug: product.slug || "",
      meta_title: product.meta_title || "",
      meta_description: product.meta_description || "",
      status: product.status || "draft",
      is_featured: product.is_featured || false,
      is_trending: product.is_trending || false,
      tags: product.tags || [],
      weight_in_grams: product.weight_in_grams || null,
      brand: product.brand || "",
      sku: product.sku || "",
      barcode: product.barcode || "",
      has_variants: product.has_variants || false,
      variant_attributes: product.variant_attributes || [],
      variants: product.variants || [],
      variant_combinations: product.variant_combinations || [],
    });
    if (product.variants?.length > 0) {
      setGeneratedVariants(product.variants);
      if (product.variants[0]?.attributes) {
        const attrs = {};
        product.variants.forEach(v => {
          v.attributes?.forEach(attr => {
            if (!attrs[attr.name]) attrs[attr.name] = new Set();
            attrs[attr.name].add(attr.value);
          });
        });
        setVariantAttributes(Object.entries(attrs).map(([name, values]) => ({ name, values: Array.from(values) })));
      }
    }
    setShowModal(true);
  };

  const handleDelete = async (product) => {
    if (confirm(`Delete "${product.name}"?`)) {
      try {
        await productsApi.delete(product._id);
        await fetchProducts();
        alert("Product deleted successfully!");
      } catch (error) {
        alert("Failed to delete");
      }
    }
  };

  const compressImage = (file) => {
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
          let width = img.width, height = img.height;
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
    setUploading(true);
    try {
      const base64 = await compressImage(file);
      setForm({ ...form, main_image: base64 });
      alert("Image uploaded successfully!");
    } catch (error) {
      alert("Failed to upload");
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    try {
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const base64 = await compressImage(file);
          setForm(prev => ({ ...prev, gallery_images: [...prev.gallery_images, base64] }));
        }
      }
      alert("Gallery images uploaded!");
    } catch (error) {
      alert("Failed to upload some images");
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (index) => {
    setForm({ ...form, gallery_images: form.gallery_images.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.name.trim()) {
      alert("Product name is required");
      return;
    }
    if (!form.category_id) {
      alert("Please select a category");
      return;
    }
    if (!form.price) {
      alert("Please enter a price");
      return;
    }

    // Prepare data matching API schema
    const productData = {
      name: form.name.trim(),
      description: form.description?.trim() || "",
      short_description: form.short_description?.trim() || "",
      category_id: form.category_id,
      subcategory_id: form.subcategory_id || null,
      price: Number(form.price),
      compare_price: form.compare_price ? Number(form.compare_price) : null,
      cost_per_unit: form.cost_per_unit ? Number(form.cost_per_unit) : null,
      stock_quantity: Number(form.stock_quantity) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 5,
      unit: form.unit,
      unit_value: form.unit_value ? Number(form.unit_value) : null,
      main_image: form.main_image || "",
      gallery_images: form.gallery_images || [],
      slug: form.slug || generateSlug(form.name),
      meta_title: form.meta_title || "",
      meta_description: form.meta_description || "",
      status: form.status,
      is_featured: form.is_featured,
      is_trending: form.is_trending,
      tags: form.tags || [],
      weight_in_grams: form.weight_in_grams ? Number(form.weight_in_grams) : null,
      brand: form.brand || "",
      sku: form.sku || generateSKU(form.name),
      barcode: form.barcode || null,
      has_variants: form.has_variants,
      variant_attributes: form.has_variants ? variantAttributes.map(a => a.name) : [],
      variants: form.has_variants ? generatedVariants : [],
      variant_combinations: form.has_variants ? variantAttributes : [],
    };

    console.log("Sending product data:", JSON.stringify(productData, null, 2));

    try {
      setSubmitting(true);
      if (editingId) {
        await productsApi.update(editingId, productData);
        alert("Product updated successfully!");
      } else {
        await productsApi.create(productData);
        alert("Product created successfully!");
      }
      await fetchProducts();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Failed to save product. Check console for details.");
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
      stock_quantity: 0,
      low_stock_threshold: 5,
      unit: "piece",
      unit_value: null,
      main_image: "",
      gallery_images: [],
      slug: "",
      meta_title: "",
      meta_description: "",
      status: "draft",
      is_featured: false,
      is_trending: false,
      tags: [],
      weight_in_grams: null,
      brand: "",
      sku: "",
      barcode: "",
      has_variants: false,
      variant_attributes: [],
      variants: [],
      variant_combinations: [],
    });
    setVariantAttributes([]);
    setGeneratedVariants([]);
    setTagInput("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
            <button onClick={() => setViewMode("grid")} className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ${viewMode === "grid" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}>
              <Grid3x3 className="w-4 h-4" /> Grid
            </button>
            <button onClick={() => setViewMode("table")} className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ${viewMode === "table" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}>
              <Table2 className="w-4 h-4" /> Table
            </button>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 bg-[#3B82F6] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#2563EB] transition-all">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${showFilters ? "bg-[#3B82F6] text-white" : "bg-white border border-gray-200 text-gray-500"}`}>
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button onClick={fetchProducts} className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200">
                  <option value="all">All Status</option>
                  {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-200">
                  <option value="">All Categories</option>
                  {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
                <button onClick={clearFilters} className="px-4 py-2 text-sm text-[#3B82F6] hover:bg-blue-50 rounded-lg">Clear Filters</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Products Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <motion.div key={product._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group">
              <div className="relative h-32 bg-gray-50">
                {product.main_image ? <img src={product.main_image} alt={product.name} className="w-full h-full object-contain p-2" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-gray-400" /></div>}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(product)} className="p-1.5 bg-white rounded-lg shadow-sm"><Edit2 className="w-3.5 h-3.5 text-[#3B82F6]" /></button>
                  <button onClick={() => handleDelete(product)} className="p-1.5 bg-white rounded-lg shadow-sm"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                </div>
                {product.is_featured && <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full">Featured</span>}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{product.name}</h3>
                <p className="text-[10px] text-gray-500 mb-2">{product.category_name || product.category_id}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#3B82F6]">₹{product.price}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${product.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{product.status}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Stock</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><div className="flex items-center gap-2">{product.main_image ? <img src={product.main_image} alt={product.name} className="w-8 h-8 rounded-lg object-cover" /> : <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><Package className="w-4 h-4 text-gray-400" /></div>}<span className="text-sm font-medium text-gray-900">{product.name}</span></div></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{product.sku || "-"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{product.category_name || product.category_id}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#3B82F6]">₹{product.price}</td>
                    <td className="px-4 py-3 text-xs">{product.stock_quantity || 0} units</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${product.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{product.status}</span></td>
                    <td className="px-4 py-3 text-right"><button onClick={() => handleEdit(product)} className="p-1 text-gray-400 hover:text-[#3B82F6]"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDelete(product)} className="p-1 ml-2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredProducts.length === 0 && (<div className="text-center py-12 bg-white rounded-xl border border-gray-200"><Package className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No products found</p></div>)}

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl my-8">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">{editingId ? "Edit Product" : "Create New Product"}</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto">
                {/* Basic Information */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                      <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                      <div className="flex gap-2">
                        <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Auto-generated" className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200" />
                        <button type="button" onClick={refreshSKU} className="px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-[#3B82F6] hover:bg-white">
                          <RefreshCcw className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Auto-generated from product name</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                      <input type="text" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="Product barcode" className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                      <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Brand name" className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                      <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200" required>
                        <option value="">Select category</option>
                        {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                      <select value={form.subcategory_id || ""} onChange={(e) => setForm({ ...form, subcategory_id: e.target.value || null })} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200">
                        <option value="">None</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200">
                        {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-4 items-center pt-3">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="w-4 h-4 text-[#3B82F6]" />
                        <span className="text-sm text-gray-700">Featured Product</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={form.is_trending} onChange={(e) => setForm({ ...form, is_trending: e.target.checked })} className="w-4 h-4 text-[#3B82F6]" />
                        <span className="text-sm text-gray-700">Trending Product</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Pricing</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                      <input type="number" step="0.01" value={form.price || ""} onChange={(e) => setForm({ ...form, price: e.target.value ? parseFloat(e.target.value) : null })} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Compare Price (₹)</label>
                      <input type="number" step="0.01" value={form.compare_price || ""} onChange={(e) => setForm({ ...form, compare_price: e.target.value ? parseFloat(e.target.value) : null })} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200" placeholder="Original price" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit (₹)</label>
                      <input type="number" step="0.01" value={form.cost_per_unit || ""} onChange={(e) => setForm({ ...form, cost_per_unit: e.target.value ? parseFloat(e.target.value) : null })} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                      <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200">
                        {unitOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit Value</label>
                      <input type="number" step="0.01" value={form.unit_value || ""} onChange={(e) => setForm({ ...form, unit_value: e.target.value ? parseFloat(e.target.value) : null })} placeholder="e.g., 500 for 500ml" className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200" />
                    </div>
                  </div>
                </div>

                {/* Inventory */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Inventory</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                      <input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                      <input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: parseInt(e.target.value) || 5 })} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight (grams)</label>
                      <input type="number" value={form.weight_in_grams || ""} onChange={(e) => setForm({ ...form, weight_in_grams: e.target.value ? parseInt(e.target.value) : null })} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200" />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Description</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 resize-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                      <textarea value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 resize-none" placeholder="Brief summary for listings" />
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
                  <div className="flex gap-2 mb-2">
                    <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Add tag" className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200" />
                    <button type="button" onClick={addTag} className="px-4 py-2.5 bg-[#3B82F6] text-white rounded-xl text-sm">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.tags.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Images */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Images</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Main Image</label>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-[#3B82F6] cursor-pointer relative">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
                        {uploading ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]"></div>
                        ) : form.main_image ? (
                          <div className="relative">
                            <img src={form.main_image} alt="Preview" className="w-24 h-24 object-cover rounded-lg" />
                            <button type="button" onClick={() => setForm({ ...form, main_image: "" })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400" />
                            <p className="text-sm text-gray-500">Click to upload product image</p>
                            <p className="text-xs text-gray-400">JPG, PNG up to 5MB</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-[#3B82F6] cursor-pointer relative">
                        <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
                        <Upload className="w-8 h-8 text-gray-400" />
                        <p className="text-sm text-gray-500">Click to upload multiple images</p>
                      </div>
                      {form.gallery_images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {form.gallery_images.map((img, idx) => (
                            <div key={idx} className="relative w-16 h-16">
                              <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover rounded-lg" />
                              <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SEO */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">SEO & Meta</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                      <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Auto-generated" className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200" />
                      <p className="text-xs text-gray-400 mt-1">URL-friendly version of the product name</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                      <input type="text" value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} placeholder="SEO title (60-70 characters)" className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                      <textarea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-200 resize-none" placeholder="SEO description (150-160 characters)" />
                    </div>
                  </div>
                </div>

                {/* Variants Section */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">Variants</h4>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.has_variants} onChange={(e) => setForm({ ...form, has_variants: e.target.checked })} className="w-4 h-4 text-[#3B82F6]" />
                      <span className="text-sm text-gray-700">Enable Variants</span>
                    </label>
                  </div>
                  
                  {form.has_variants && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-medium text-sm text-gray-800 mb-3">Add Variant Attributes</h5>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <input type="text" value={newAttributeName} onChange={(e) => setNewAttributeName(e.target.value)} placeholder="Attribute name (e.g., Size, Color)" className="px-3 py-2 bg-white rounded-lg text-sm border border-gray-200" />
                          <input type="text" value={newAttributeValues} onChange={(e) => setNewAttributeValues(e.target.value)} placeholder="Values (comma separated: e.g., S,M,L)" className="px-3 py-2 bg-white rounded-lg text-sm border border-gray-200" />
                        </div>
                        <button type="button" onClick={addAttribute} className="flex items-center gap-1 px-3 py-1.5 bg-[#3B82F6] text-white rounded-lg text-sm">
                          <PlusCircle className="w-3.5 h-3.5" /> Add Attribute
                        </button>
                        {variantAttributes.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {variantAttributes.map((attr, idx) => (
                              <div key={idx} className="inline-flex items-center gap-2 px-2 py-1 bg-white rounded-lg text-sm">
                                <span className="font-medium text-gray-800">{attr.name}:</span>
                                <span className="text-gray-600">{attr.values.join(", ")}</span>
                                <button type="button" onClick={() => removeAttribute(idx)} className="text-red-500">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {generatedVariants.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Variant</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">SKU</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Price</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Stock</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                               </tr>
                            </thead>
                            <tbody>
                              {generatedVariants.map((variant, idx) => (
                                <tr key={idx} className="border-b border-gray-100">
                                  <td className="px-3 py-2">
                                    <div className="flex gap-1">
                                      {variant.attributes.map((attr, i) => (
                                        <span key={i} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{attr.value}</span>
                                      ))}
                                    </div>
                                   </td>
                                  <td className="px-3 py-2">
                                    <input type="text" value={variant.sku} onChange={(e) => updateVariant(idx, "sku", e.target.value)} className="w-28 px-2 py-1 bg-gray-50 rounded text-xs" />
                                   </td>
                                  <td className="px-3 py-2">
                                    <input type="number" step="0.01" value={variant.price || ""} onChange={(e) => updateVariant(idx, "price", e.target.value ? parseFloat(e.target.value) : null)} className="w-24 px-2 py-1 bg-gray-50 rounded text-xs" placeholder="Price" />
                                   </td>
                                  <td className="px-3 py-2">
                                    <input type="number" value={variant.stock_quantity} onChange={(e) => updateVariant(idx, "stock_quantity", parseInt(e.target.value) || 0)} className="w-20 px-2 py-1 bg-gray-50 rounded text-xs" />
                                   </td>
                                  <td className="px-3 py-2">
                                    <select value={variant.status} onChange={(e) => updateVariant(idx, "status", e.target.value)} className="px-2 py-1 bg-gray-50 rounded text-xs">
                                      <option value="active">Active</option>
                                      <option value="inactive">Inactive</option>
                                    </select>
                                   </td>
                                 </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-[#3B82F6] text-white rounded-xl text-sm font-medium hover:bg-[#2563EB] disabled:opacity-50">
                    {submitting ? "Saving..." : editingId ? "Update Product" : "Create Product"}
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