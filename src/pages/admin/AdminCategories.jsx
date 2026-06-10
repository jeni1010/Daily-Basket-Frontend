import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit2, Trash2, X, ChevronRight, ChevronDown, Filter, 
  FolderTree, Package, RefreshCw, Eye, Tag, Upload, Image as ImageIcon
} from "lucide-react";
import { categoriesApi } from "../../services/categoriesApi";

// Updated color palette
const COLORS = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',
  primaryBg: 'rgba(59, 130, 246, 0.1)',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  bgMain: '#F8FAFC',
  cardBg: '#FFFFFF',
};

export function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    parent_category_id: null,
    image_url: "",
    status: "active",
  });

  useEffect(() => {
    fetchCategories();
  }, [statusFilter]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const filterValue = statusFilter === "active" || statusFilter === "inactive" ? statusFilter : undefined;
      const data = await categoriesApi.getAll(filterValue, true);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(err.message || "Failed to fetch categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get all descendant IDs to prevent circular references
  const getAllDescendantIds = (categoryId, categoriesList) => {
    const descendants = [];
    const findDescendants = (id) => {
      const children = categoriesList.filter(c => c.parent_category_id === id);
      children.forEach(child => {
        descendants.push(child._id);
        findDescendants(child._id);
      });
    };
    findDescendants(categoryId);
    return descendants;
  };

  // Get available parent categories (exclude self and descendants)
  const getAvailableParentCategories = () => {
    if (!editingId) return categories;
    
    const excludedIds = [editingId, ...getAllDescendantIds(editingId, categories)];
    return categories.filter(cat => !excludedIds.includes(cat._id));
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
          const maxWidth = 300;
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
      setForm({ ...form, image_url: base64String });
      alert('✅ Image uploaded and compressed successfully!');
    } catch (error) {
      alert('Failed to process image');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat._id);
    setForm({
      name: cat.name,
      description: cat.description || "",
      parent_category_id: cat.parent_category_id || null,
      image_url: cat.image_url || "",
      status: cat.status === "inactive" ? "inactive" : "active",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category? This may also affect subcategories.")) return;
    try {
      await categoriesApi.delete(id);
      await fetchCategories();
      alert("✅ Category deleted successfully!");
    } catch (err) {
      alert(err.message || "Failed to delete category");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("Category name is required");
      return;
    }
    try {
      const submitForm = { ...form, status: form.status };
      if (editingId) {
        await categoriesApi.update(editingId, submitForm);
        alert("✅ Category updated successfully!");
      } else {
        await categoriesApi.create(submitForm);
        alert("✅ Category created successfully!");
      }
      setShowModal(false);
      setEditingId(null);
      setForm({ name: "", description: "", parent_category_id: null, image_url: "", status: "active" });
      await fetchCategories();
    } catch (err) {
      alert(err.message || "Failed to save category");
    }
  };

  const toggleExpand = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getTotalCount = (categoriesList) => {
    let count = categoriesList.length;
    categoriesList.forEach((cat) => {
      if (cat.subcategories && cat.subcategories.length > 0) {
        count += getTotalCount(cat.subcategories);
      }
    });
    return count;
  };

  const totalCategories = getTotalCount(categories);
  const rootCategories = categories;
  const availableParentCategories = getAvailableParentCategories();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748B]">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 mb-3">{error}</p>
        <button onClick={fetchCategories} className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg text-sm hover:bg-[#2563EB] transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Categories</h1>
          <p className="text-sm text-[#64748B] mt-1">
            {totalCategories} total categories • {rootCategories.length} root {rootCategories.length === 1 ? "category" : "categories"}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              showFilters || statusFilter ? "bg-[#3B82F6] text-white shadow-sm" : "bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
            }`}
          >
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button
            onClick={fetchCategories}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#64748B] hover:bg-[#F8FAFC] transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setForm({ name: "", description: "", parent_category_id: null, image_url: "", status: "active" });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-[#3B82F6] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#2563EB] hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm"
          >
            <div className="flex items-center gap-4 flex-wrap">
              <label className="text-sm font-medium text-[#1E293B]">Status Filter:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-[#F8FAFC] rounded-lg text-sm border border-[#E2E8F0] outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              {statusFilter && (
                <button onClick={() => setStatusFilter("")} className="text-sm text-[#EF4444] hover:text-red-700">
                  Clear Filter
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Tree */}
      <div className="space-y-3">
        {rootCategories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#E2E8F0]">
            <FolderTree className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
            <p className="text-[#64748B]">No categories yet. Click "Add Category" to get started.</p>
          </div>
        ) : (
          rootCategories.map((cat, idx) => {
            const hasChildren = cat.subcategories && cat.subcategories.length > 0;
            const isExpanded = expandedCategories.has(cat._id);
            
            return (
              <React.Fragment key={cat._id}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden hover:shadow-md transition-all group"
                >
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {hasChildren && (
                        <button
                          onClick={() => toggleExpand(cat._id)}
                          className="p-1 hover:bg-[#F8FAFC] rounded-lg transition-colors"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-[#94A3B8]" /> : <ChevronRight className="w-4 h-4 text-[#94A3B8]" />}
                        </button>
                      )}
                      {cat.image_url ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#F8FAFC] flex-shrink-0">
                          <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-[rgba(59,130,246,0.1)] rounded-xl flex items-center justify-center flex-shrink-0">
                          <FolderTree className="w-5 h-5 text-[#3B82F6]" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#1E293B]">{cat.name}</h3>
                        {cat.description && (
                          <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1">{cat.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        cat.status === "active" ? "bg-[rgba(59,130,246,0.1)] text-[#3B82F6]" : "bg-gray-100 text-gray-600"
                      }`}>
                        {cat.status}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="p-1.5 text-[#94A3B8] hover:text-[#3B82F6] hover:bg-[rgba(59,130,246,0.1)] rounded-lg transition-colors"
                          title="Edit category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat._id)}
                          className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Subcategories */}
                {hasChildren && isExpanded && (
                  <div className="ml-8 pl-4 border-l-2 border-[#E2E8F0] space-y-2">
                    {cat.subcategories.map((subcat, subIdx) => (
                      <motion.div
                        key={subcat._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: subIdx * 0.05 }}
                        className="bg-white rounded-xl border border-[#E2E8F0] hover:shadow-md transition-all group"
                      >
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {subcat.image_url ? (
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#F8FAFC] flex-shrink-0">
                                <img src={subcat.image_url} alt={subcat.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-[#F8FAFC] rounded-lg flex items-center justify-center flex-shrink-0">
                                <Tag className="w-4 h-4 text-[#94A3B8]" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium text-[#1E293B] text-sm">{subcat.name}</h4>
                              {subcat.description && (
                                <p className="text-xs text-[#64748B] line-clamp-1">{subcat.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              subcat.status === "active" ? "bg-[rgba(59,130,246,0.1)] text-[#3B82F6]" : "bg-gray-100 text-gray-600"
                            }`}>
                              {subcat.status}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEdit(subcat)}
                                className="p-1 text-[#94A3B8] hover:text-[#3B82F6] rounded-lg transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(subcat._id)}
                                className="p-1 text-[#94A3B8] hover:text-[#EF4444] rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
                <h3 className="font-semibold text-[#1E293B]">{editingId ? "Edit Category" : "Add Category"}</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 text-[#94A3B8] hover:bg-[#F8FAFC] rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Category Image Upload */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-[#64748B]">Category Image</label>
                    <span className="text-xs text-[#94A3B8]">Supports JPG, PNG (Max 5MB)</span>
                  </div>
                  <div className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-6 flex flex-col items-center gap-2 hover:border-[#3B82F6] cursor-pointer transition-colors relative">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      disabled={uploading}
                    />
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]"></div>
                        <p className="text-sm text-[#64748B]">Processing image...</p>
                      </div>
                    ) : form.image_url ? (
                      <div className="relative">
                        <img 
                          src={form.image_url} 
                          alt="Preview" 
                          className="w-24 h-24 object-cover rounded-lg"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/96x96?text=Invalid+Image'; }}
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, image_url: "" })}
                          className="absolute -top-2 -right-2 bg-[#EF4444] text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-[#94A3B8]" />
                        <p className="text-sm text-[#64748B]">Click to upload category image</p>
                        <p className="text-xs text-[#94A3B8]">Image will be compressed automatically</p>
                      </>
                    )}
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-[#64748B] mb-1">Or Paste Image URL</label>
                    <input
                      type="text"
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      placeholder="https://example.com/category-image.jpg"
                      className="w-full px-3 py-2 bg-[#F8FAFC] rounded-xl text-sm border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Category Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Fruits & Vegetables"
                    className="w-full px-3 py-2 bg-[#F8FAFC] rounded-xl text-sm border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional category description"
                    rows={3}
                    className="w-full px-3 py-2 bg-[#F8FAFC] rounded-xl text-sm border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Parent Category</label>
                  <select
                    value={form.parent_category_id || ""}
                    onChange={(e) => setForm({ ...form, parent_category_id: e.target.value || null })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] rounded-xl text-sm border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  >
                    <option value="">None (Root Category)</option>
                    {availableParentCategories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {editingId && (
                    <p className="text-xs text-amber-600 mt-1">
                      ℹ️ Cannot select self or descendant as parent
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] rounded-xl text-sm border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-[#E2E8F0] text-[#64748B] rounded-xl text-sm font-medium hover:bg-[#F8FAFC] transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-2.5 bg-[#3B82F6] text-white rounded-xl text-sm font-medium hover:bg-[#2563EB] hover:shadow-md transition-all">
                    {editingId ? "Save Changes" : "Add Category"}
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