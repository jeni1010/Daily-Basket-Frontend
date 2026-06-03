import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, ChevronDown, Package, Eye, RefreshCw, Filter, 
  Calendar, User, DollarSign, Truck, Clock, CheckCircle, XCircle, X
} from "lucide-react";
import { ordersApi } from "../../services/ordersApi";
import { customersApi } from "../../services/customersApi";

const statusColors = {
  placed: { bg: "bg-amber-100", text: "text-amber-700", icon: <Clock className="w-3 h-3" /> },
  pending: { bg: "bg-amber-100", text: "text-amber-700", icon: <Clock className="w-3 h-3" /> },
  confirmed: { bg: "bg-blue-100", text: "text-blue-700", icon: <CheckCircle className="w-3 h-3" /> },
  packed: { bg: "bg-purple-100", text: "text-purple-700", icon: <Package className="w-3 h-3" /> },
  shipped: { bg: "bg-indigo-100", text: "text-indigo-700", icon: <Truck className="w-3 h-3" /> },
  delivered: { bg: "bg-emerald-100", text: "text-emerald-700", icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { bg: "bg-red-100", text: "text-red-700", icon: <XCircle className="w-3 h-3" /> },
};

// Helper function to calculate order total from items
const calculateOrderTotal = (order) => {
  if (order.grand_total && order.grand_total > 0) {
    return order.grand_total;
  }
  
  if (order.items && order.items.length > 0) {
    const subtotal = order.items.reduce((sum, item) => {
      const price = item.price || item.unit_price || 0;
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);
    
    const shipping = order.shipping_charge || order.delivery_fee || 0;
    const tax = order.tax_amount || order.tax || 0;
    
    return subtotal + shipping + tax;
  }
  
  return 0;
};

// Helper function to map order status for display
const getDisplayStatus = (status) => {
  if (status === 'pending') return 'placed';
  return status;
};

export function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0
  });
  // Cache for customer data to avoid repeated API calls
  const [customerCache, setCustomerCache] = useState({});
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  let searchTimeout;
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchOrders(value);
    }, 500);
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus, pagination.page]);

  // Function to fetch customer details by ID
  const fetchCustomerDetails = async (customerId) => {
    if (!customerId) return null;
    
    // Check cache first
    if (customerCache[customerId]) {
      return customerCache[customerId];
    }
    
    try {
      const response = await customersApi.getById(customerId);
      
      // Extract customer data from response
      let customerData = null;
      if (response && response.data) {
        customerData = response.data;
      } else if (response && response.customer) {
        customerData = response.customer;
      } else {
        customerData = response;
      }
      
      // Update cache
      setCustomerCache(prev => ({
        ...prev,
        [customerId]: customerData
      }));
      
      return customerData;
    } catch (error) {
      return null;
    }
  };

  // Function to enrich orders with customer details
  const enrichOrdersWithCustomerDetails = async (ordersList) => {
    if (!ordersList || ordersList.length === 0) return ordersList;
    
    setLoadingCustomers(true);
    
    // Collect unique customer IDs that need fetching
    const customerIdsToFetch = [];
    ordersList.forEach(order => {
      if (order.customer_id && !customerCache[order.customer_id]) {
        customerIdsToFetch.push(order.customer_id);
      }
    });
    
    // Remove duplicates
    const uniqueCustomerIds = [...new Set(customerIdsToFetch)];
    
    // Fetch all missing customers in parallel
    if (uniqueCustomerIds.length > 0) {
      const fetchPromises = uniqueCustomerIds.map(id => fetchCustomerDetails(id));
      await Promise.all(fetchPromises);
    }
    
    // Enrich orders with cached customer data
    const enrichedOrders = ordersList.map(order => {
      if (order.customer_id && customerCache[order.customer_id]) {
        const customerData = customerCache[order.customer_id];
        return {
          ...order,
          customer_name: (customerData && (customerData.name || customerData.full_name)) || "",
          customer_email: (customerData && customerData.email) || "",
          customer_phone: (customerData && (customerData.phone || customerData.mobile)) || "",
        };
      }
      return order;
    });
    
    setLoadingCustomers(false);
    return enrichedOrders;
  };

  const fetchOrders = async (search = searchTerm) => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {};
      
      if (filterStatus !== "all") {
        filters.order_status = filterStatus;
      }
      
      if (search && search.trim()) {
        filters.search = search.trim();
      }
      
      filters.page = pagination.page;
      filters.limit = pagination.limit;
      
      const data = await ordersApi.getAll(filters);
      
      let ordersList = [];
      let totalCount = 0;
      
      if (data && Array.isArray(data)) {
        ordersList = data;
        totalCount = data.length;
      } else if (data && data.orders && Array.isArray(data.orders)) {
        ordersList = data.orders;
        totalCount = data.total || data.orders.length;
      } else if (data && data.data && Array.isArray(data.data)) {
        ordersList = data.data;
        totalCount = data.total || data.data.length;
      }
      
      // Enrich orders with customer details from customer API
      const enrichedOrders = await enrichOrdersWithCustomerDetails(ordersList);
      
      setOrders(enrichedOrders);
      setPagination(prev => ({
        ...prev,
        total: totalCount,
        totalPages: Math.ceil(totalCount / prev.limit)
      }));
      
    } catch (error) {
      setError(error.message || "Failed to fetch orders. Please try again.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStats = () => {
    const stats = {
      total: orders.length,
      placed: orders.filter(o => o.order_status === "placed" || o.order_status === "pending").length,
      confirmed: orders.filter(o => o.order_status === "confirmed").length,
      packed: orders.filter(o => o.order_status === "packed").length,
      shipped: orders.filter(o => o.order_status === "shipped").length,
      delivered: orders.filter(o => o.order_status === "delivered").length,
      cancelled: orders.filter(o => o.order_status === "cancelled").length,
    };
    return stats;
  };

  const statusStats = getStatusStats();

  const handleFilterClick = (status) => {
    setFilterStatus(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3E7C47] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage customer orders</p>
        </div>
        <button 
          onClick={() => fetchOrders()}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loadingCustomers && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-blue-600">Loading customer details...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-800">Error Loading Orders</h4>
              <p className="text-xs text-red-600 mt-1">{error}</p>
              <button 
                onClick={() => fetchOrders()}
                className="mt-2 text-xs text-red-700 underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div 
          onClick={() => handleFilterClick("all")}
          className="bg-white rounded-xl p-3 border text-center hover:shadow-sm transition-all cursor-pointer border-gray-100"
        >
          <p className="text-2xl font-bold text-gray-900">{statusStats.total}</p>
          <p className="text-xs text-gray-500">Total Orders</p>
        </div>
        <div 
          onClick={() => handleFilterClick("placed")}
          className="bg-amber-50 rounded-xl p-3 border text-center cursor-pointer transition-all border-amber-100"
        >
          <p className="text-2xl font-bold text-amber-700">{statusStats.placed}</p>
          <p className="text-xs text-amber-600">Placed</p>
        </div>
        <div 
          onClick={() => handleFilterClick("confirmed")}
          className="bg-blue-50 rounded-xl p-3 border text-center cursor-pointer transition-all border-blue-100"
        >
          <p className="text-2xl font-bold text-blue-700">{statusStats.confirmed}</p>
          <p className="text-xs text-blue-600">Confirmed</p>
        </div>
        <div 
          onClick={() => handleFilterClick("packed")}
          className="bg-purple-50 rounded-xl p-3 border text-center cursor-pointer transition-all border-purple-100"
        >
          <p className="text-2xl font-bold text-purple-700">{statusStats.packed}</p>
          <p className="text-xs text-purple-600">Packed</p>
        </div>
        <div 
          onClick={() => handleFilterClick("shipped")}
          className="bg-indigo-50 rounded-xl p-3 border text-center cursor-pointer transition-all border-indigo-100"
        >
          <p className="text-2xl font-bold text-indigo-700">{statusStats.shipped}</p>
          <p className="text-xs text-indigo-600">Shipped</p>
        </div>
        <div 
          onClick={() => handleFilterClick("delivered")}
          className="bg-emerald-50 rounded-xl p-3 border text-center cursor-pointer transition-all border-emerald-100"
        >
          <p className="text-2xl font-bold text-emerald-700">{statusStats.delivered}</p>
          <p className="text-xs text-emerald-600">Delivered</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by order ID or customer..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#3E7C47]/20 focus:border-[#3E7C47]"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order, idx) => {
                const orderTotal = calculateOrderTotal(order);
                const displayStatus = getDisplayStatus(order.order_status);
                
                return (
                  <motion.tr
                    key={order._id || order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-800">
                          {order.order_number || order.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#3E7C47]/10 to-[#2E5C37]/10 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-[#3E7C47]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {order.customer_name || "Loading..."}
                          </p>
                          <p className="text-xs text-gray-400">
                            {order.customer_email || ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-[#3E7C47]">
                          {"₹" + orderTotal.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={"inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full " + (statusColors[displayStatus]?.bg || "") + " " + (statusColors[displayStatus]?.text || "")}>
                        {statusColors[displayStatus]?.icon}
                        {displayStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetailsModal(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              
              {orders.length === 0 && !loading && !error && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No orders found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter</p>
                    <button
                      onClick={() => fetchOrders()}
                      className="mt-2 text-sm text-[#3E7C47] hover:underline"
                    >
                      Refresh Orders
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Only show pagination if there are more than 100 orders */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDetailsModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">Order Details</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{selectedOrder.order_number || selectedOrder.id}</p>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Order Date</p>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(selectedOrder.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Payment Method</p>
                    <p className="text-sm font-medium text-gray-800 capitalize">
                      {selectedOrder.payment_method || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Payment Status</p>
                    <p className="text-sm font-medium text-gray-800 capitalize">
                      {selectedOrder.payment_status || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">Order Status</p>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full mt-1">
                      {getDisplayStatus(selectedOrder.order_status)}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Customer Information</h4>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      Name: {selectedOrder.customer_name || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Email: {selectedOrder.customer_email || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Phone: {selectedOrder.customer_phone || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Order Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{item.product_name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity} × {"₹" + item.price}</p>
                        </div>
                        <p className="text-sm font-semibold text-[#3E7C47]">{"₹" + item.subtotal}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#3E7C47]/5 to-transparent rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">Grand Total</p>
                    <p className="text-xl font-bold text-[#3E7C47]">{"₹" + calculateOrderTotal(selectedOrder).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}