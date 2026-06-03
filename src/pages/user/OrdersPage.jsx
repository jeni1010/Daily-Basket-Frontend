import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ChevronRight, Search, Loader2, Eye, Truck, Clock, CheckCircle, XCircle, Package as PackageIcon, AlertCircle } from "lucide-react";
import { customerApi } from "../../services/customerApi";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const statusColors = {
  placed: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  packed: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const statusIcons = {
  placed: <Clock className="w-3 h-3" />,
  confirmed: <CheckCircle className="w-3 h-3" />,
  packed: <PackageIcon className="w-3 h-3" />,
  shipped: <Truck className="w-3 h-3" />,
  delivered: <CheckCircle className="w-3 h-3" />,
  cancelled: <XCircle className="w-3 h-3" />,
};

const getProgressWidth = (status) => {
  switch(status) {
    case "placed": return "25%";
    case "confirmed": return "40%";
    case "packed": return "55%";
    case "shipped": return "75%";
    case "delivered": return "100%";
    default: return "25%";
  }
};

// Helper function to calculate order total from items
const calculateOrderTotal = (order) => {
  // If grand_total exists and is valid, use it
  if (order.grand_total && order.grand_total > 0) {
    return order.grand_total;
  }
  
  // Calculate from items
  if (order.items && order.items.length > 0) {
    const subtotal = order.items.reduce((sum, item) => {
      const price = item.price || item.unit_price || 0;
      const quantity = item.quantity || 1;
      return sum + (price * quantity);
    }, 0);
    
    // Add shipping and tax if available
    const shipping = order.shipping_charge || order.delivery_fee || 0;
    const tax = order.tax_amount || order.tax || 0;
    
    return subtotal + shipping + tax;
  }
  
  return 0;
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);

  const filters = ["all", "placed", "confirmed", "packed", "shipped", "delivered", "cancelled"];

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusFilter = filter === "all" ? null : filter;
      const data = await customerApi.orders.getMyOrders(1, 50, statusFilter);
      console.log("Orders data:", data);
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to cancel this order?")) {
      setCancellingOrder(orderId);
      try {
        await customerApi.orders.cancel(orderId);
        alert("Order cancelled successfully!");
        await fetchOrders();
      } catch (error) {
        console.error("Error cancelling order:", error);
        alert(error.message || "Failed to cancel order. Please try again.");
      } finally {
        setCancellingOrder(null);
      }
    }
  };

  const filteredOrders = orders.filter((order) =>
    search === "" || order.order_number?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#F6F1E9] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#3A7D44] animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#F6F1E9] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">📋 My Orders</h1>
            <p className="text-gray-500 text-sm mt-1">Track and manage all your grocery orders</p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3A7D44] focus:border-transparent shadow-sm"
            />
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all capitalize whitespace-nowrap ${
                  filter === f 
                    ? "bg-[#3A7D44] text-white shadow-md" 
                    : "bg-white border border-gray-200 text-gray-600 hover:border-[#3A7D44] hover:text-[#3A7D44]"
                }`}
              >
                {f === "all" ? "All Orders" : f}
              </button>
            ))}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 text-sm">{error}</p>
              <button onClick={fetchOrders} className="mt-2 text-sm text-red-700 underline font-medium">
                Try Again
              </button>
            </div>
          )}

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">No orders found</h3>
              <p className="text-gray-400 text-sm mb-4">You haven't placed any orders yet</p>
              <button
                onClick={() => navigate("/products")}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#3A7D44] text-white rounded-xl text-sm font-medium hover:bg-[#2E5C37] transition-all shadow-sm"
              >
                Start Shopping <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const orderTotal = calculateOrderTotal(order);
                return (
                  <div
                    key={order._id}
                    className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/orders/${order._id}`)}
                  >
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                      <div>
                        <p className="font-semibold text-gray-800 text-lg">Order #{order.order_number?.slice(-8) || order._id?.slice(-8)}</p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${statusColors[order.order_status]}`}>
                          {statusIcons[order.order_status]} {order.order_status?.toUpperCase()}
                        </span>
                        {order.order_status !== "delivered" && order.order_status !== "cancelled" && (
                          <button
                            onClick={(e) => handleCancelOrder(order._id, e)}
                            disabled={cancellingOrder === order._id}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            {cancellingOrder === order._id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="flex items-center justify-between text-sm mb-3">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-gray-500 text-xs">Total Items</p>
                          <p className="font-semibold text-gray-800">{order.items?.length || 0} items</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Total Amount</p>
                          <p className="font-bold text-[#3A7D44] text-lg">₹{orderTotal.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Payment Method</p>
                          <p className="font-medium text-gray-700 text-sm capitalize">{order.payment_method || 'COD'}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#3A7D44] transition-colors" />
                    </div>

                    {/* Progress Bar for Active Orders */}
                    {order.order_status !== "delivered" && order.order_status !== "cancelled" && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Placed
                          </span>
                          <span className="flex items-center gap-1">
                            <PackageIcon className="w-3 h-3" /> Processing
                          </span>
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3" /> Shipped
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Delivered
                          </span>
                        </div>
                        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-[#3A7D44] rounded-full transition-all duration-500"
                            style={{ width: getProgressWidth(order.order_status) }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-right">
                          {order.order_status === "placed" && "Order confirmed, preparing your items"}
                          {order.order_status === "confirmed" && "Your order is being packed"}
                          {order.order_status === "packed" && "Order is ready for shipping"}
                          {order.order_status === "shipped" && "Your order is on the way!"}
                        </p>
                      </div>
                    )}

                    {/* Delivered Badge */}
                    {order.order_status === "delivered" && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Delivered on {new Date(order.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {/* Cancelled Badge */}
                    {order.order_status === "cancelled" && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Order cancelled
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}