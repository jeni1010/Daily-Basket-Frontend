import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  DollarSign,
  Activity,
  Star,
  AlertCircle,
  Package,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { dashboardApi } from "../../services/dashboardApi";
import { customersApi } from "../../services/customersApi";

// Color palette for pie chart
const PIE_COLORS = [
  '#8B2C2C',
  '#2E7D32',
  '#E53935',
  '#FF9800',
  '#2196F3',
  '#9C27B0',
  '#00BCD4',
  '#FF5722',
  '#4CAF50',
  '#FFC107',
];

// Helper function to calculate order total from items
const calculateOrderTotal = (order) => {
  // First check grand_total
  if (order.grand_total && order.grand_total > 0) {
    return order.grand_total;
  }
  
  // Calculate from items if available
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
  
  // Check total_amount or total
  if (order.total_amount) return order.total_amount;
  if (order.total) return order.total;
  
  return 0;
};

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_orders: 0,
    total_customers: 0,
    avg_order_value: 0,
  });
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [customerCache, setCustomerCache] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchCustomerDetails = async (customerId) => {
    if (!customerId) return null;
    
    if (customerCache[customerId]) {
      return customerCache[customerId];
    }
    
    try {
      const response = await customersApi.getById(customerId);
      let customerData = null;
      
      if (response && response.data) {
        customerData = response.data;
      } else if (response && response.customer) {
        customerData = response.customer;
      } else {
        customerData = response;
      }
      
      setCustomerCache(prev => ({
        ...prev,
        [customerId]: customerData
      }));
      
      return customerData;
    } catch (error) {
      return null;
    }
  };

  const enrichOrdersWithCustomerDetails = async (ordersList) => {
    if (!ordersList || ordersList.length === 0) return ordersList;
    
    const enrichedOrders = [];
    
    for (const order of ordersList) {
      let enrichedOrder = { ...order };
      
      // Calculate total if not present
      const orderTotal = calculateOrderTotal(order);
      enrichedOrder.display_total = orderTotal;
      
      // Fetch customer details if needed
      if (order.customer_id && (!order.customer_name || order.customer_name === 'Guest')) {
        const customerDetails = await fetchCustomerDetails(order.customer_id);
        if (customerDetails) {
          enrichedOrder.customer_name = customerDetails.name || customerDetails.full_name || order.customer_name;
          enrichedOrder.customer_email = customerDetails.email || order.customer_email;
          enrichedOrder.customer_phone = customerDetails.phone || customerDetails.mobile || order.customer_phone;
        }
      }
      
      enrichedOrders.push(enrichedOrder);
    }
    
    return enrichedOrders;
  };

  const getDisplayStatus = (status) => {
    // Map "pending" to "placed" for display
    if (status === 'pending') return 'placed';
    return status;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch ALL orders (not just 10) by using getAllOrders with limit 100
      const [allOrders, customersData, categorySalesData, revenueChartData, topProductsData] = await Promise.all([
        dashboardApi.getAllOrders(), // This fetches all orders with pagination
        customersApi.getAll({ limit: 100 }),
        dashboardApi.getCategorySales(),
        dashboardApi.getRevenueData(),
        dashboardApi.getTopProducts()
      ]);

      console.log("All orders fetched:", allOrders.length);
      
      // Get recent orders for display (last 10)
      const recentOrdersData = [...allOrders].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      ).slice(0, 10);
      
      // Enrich orders with customer details
      let enrichedAllOrders = [];
      if (allOrders && Array.isArray(allOrders)) {
        enrichedAllOrders = await enrichOrdersWithCustomerDetails(allOrders);
      }
      
      let enrichedRecentOrders = [];
      if (recentOrdersData && Array.isArray(recentOrdersData)) {
        enrichedRecentOrders = await enrichOrdersWithCustomerDetails(recentOrdersData);
      }

      // Calculate stats from ALL orders
      let totalRevenue = 0;
      let totalOrders = 0;
      
      if (enrichedAllOrders.length > 0) {
        totalOrders = enrichedAllOrders.length;
        totalRevenue = enrichedAllOrders.reduce((sum, order) => {
          const amount = order.display_total || order.grand_total || order.total_amount || 0;
          return sum + (typeof amount === 'number' ? amount : 0);
        }, 0);
      }

      // Get total customers count
      let totalCustomers = 0;
      if (customersData && Array.isArray(customersData)) {
        totalCustomers = customersData.length;
      } else if (customersData && customersData.customers) {
        totalCustomers = customersData.customers.length;
      } else if (customersData && customersData.data) {
        totalCustomers = customersData.data.length;
      }

      setStats({
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        total_customers: totalCustomers,
        avg_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      });

      setRecentOrders(enrichedRecentOrders);
      setRevenueData(revenueChartData || []);
      setTopProducts(topProductsData || []);

      if (categorySalesData && categorySalesData.length > 0) {
        let filteredCategories = categorySalesData.filter(cat => cat.name !== 'Uncategorized');
        if (filteredCategories.length === 0) {
          filteredCategories = categorySalesData;
        }
        const coloredCategoryData = filteredCategories.map((cat, index) => ({
          ...cat,
          color: PIE_COLORS[index % PIE_COLORS.length]
        }));
        setCategoryData(coloredCategoryData);
      } else {
        setCategoryData([]);
      }

    } catch (error) {
      setError(error.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'number' ? amount : 0;
    return "₹" + numAmount.toLocaleString('en-IN');
  };

  const getStatusColor = (status) => {
    const displayStatus = getDisplayStatus(status);
    const colors = {
      'placed': 'bg-amber-100 text-amber-700',
      'confirmed': 'bg-blue-100 text-blue-700',
      'packed': 'bg-purple-100 text-purple-700',
      'shipped': 'bg-indigo-100 text-indigo-700',
      'delivered': 'bg-emerald-100 text-emerald-700',
      'cancelled': 'bg-red-100 text-red-700',
    };
    return colors[displayStatus] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-4 text-xs">
        {payload.map((entry, index) => (
          <li key={"item-" + index} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600">{entry.value}</span>
            <span className="text-gray-400">({entry.payload.percent}%)</span>
          </li>
        ))}
      </ul>
    );
  };

  const renderCustomLabel = ({ percent }) => {
    return (percent * 100).toFixed(0) + "%";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#8B2C2C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to Load Dashboard</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-[#8B2C2C] text-white rounded-lg hover:bg-[#6B1E1E] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const actualTotalOrders = stats.total_orders;
  const actualTotalRevenue = stats.total_revenue;
  const actualAvgOrderValue = stats.avg_order_value;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#8B2C2C] to-[#6B1E1E] rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, Admin!</h1>
            <p className="text-white/80 mt-1">Here's what's happening with your store today.</p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2 backdrop-blur">
            <Activity className="w-4 h-4" />
            <span className="text-sm">Last updated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#8B2C2C]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(actualTotalRevenue)}</p>
          <p className="text-sm text-gray-500 mt-1">Total Revenue</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{actualTotalOrders}</p>
          <p className="text-sm text-gray-500 mt-1">Total Orders</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total_customers}</p>
          <p className="text-sm text-gray-500 mt-1">Total Customers</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(actualAvgOrderValue)}</p>
          <p className="text-sm text-gray-500 mt-1">Avg. Order Value</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-gray-800">Revenue Overview</h3>
              <p className="text-xs text-gray-500 mt-1">Monthly revenue trends</p>
            </div>
          </div>
          {revenueData.length > 0 && revenueData.some(d => d.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B2C2C" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8B2C2C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(v) => "₹" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip formatter={(v) => ["₹" + v.toLocaleString('en-IN'), "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#8B2C2C" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              <div className="text-center">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No revenue data available</p>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <h3 className="font-semibold text-gray-800 mb-4">Sales by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={categoryData} 
                  cx="50%" 
                  cy="45%" 
                  innerRadius={50} 
                  outerRadius={90} 
                  dataKey="value" 
                  label={renderCustomLabel}
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={"cell-" + index} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => {
                    const item = props.payload;
                    return ["₹" + item.value.toLocaleString('en-IN') + " (" + item.percentage + "%)", item.name];
                  }} 
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={60}
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value, entry, index) => {
                    const { payload } = entry;
                    return value + " (" + payload.percentage + "%)";
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              <div className="text-center">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No category data available</p>
                <p className="text-xs mt-2">Add categories to products to see sales distribution</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-800">Recent Orders</h3>
            <p className="text-xs text-gray-500 mt-0.5">Latest customer orders</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.length > 0 ? (
                recentOrders.map((order, idx) => {
                  const displayTotal = order.display_total || order.grand_total || order.total_amount || 0;
                  const displayStatus = getDisplayStatus(order.order_status);
                  return (
                    <tr key={order.id || order._id || idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-gray-800">
                        {order.order_number || order.id || (order._id ? order._id.slice(-8) : "N/A")}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">
                        {order.customer_name || order.customer?.name || "Guest"}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-800">
                        {formatCurrency(displayTotal)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={"text-xs font-semibold px-2.5 py-1 rounded-full " + getStatusColor(order.order_status)}>
                          {displayStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                    No recent orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-800">Top Selling Products</h3>
            <p className="text-xs text-gray-500 mt-0.5">Best performing items</p>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {topProducts.length > 0 ? (
            topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '';
                        }}
                      />
                    ) : (
                      <Package className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sales} units sold</p>
                    {product.price && (
                      <p className="text-xs text-[#8B2C2C] font-medium mt-1">{formatCurrency(product.price)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right min-w-[60px]">
                    <p className="text-sm font-bold text-gray-800">{product.sales}</p>
                    <p className="text-xs text-gray-400">units</p>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#8B2C2C] rounded-full h-2 transition-all duration-500"
                      style={{ width: ((product.sales / topProducts[0].sales) * 100) + "%" }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-12 text-center text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No product data available</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}