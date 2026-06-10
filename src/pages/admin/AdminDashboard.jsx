import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Users,
  DollarSign,
  AlertCircle,
  Package,
  Calendar,
  Clock,
  ChevronRight,
  UserPlus,
  ShoppingCart,
  Truck,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  RefreshCw,
  Wallet,
  BarChart3,
  PieChart as PieChartIcon,
  Loader2,
  Eye,
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
  BarChart,
  Bar,
} from "recharts";
import { dashboardApi } from "../../services/dashboardApi";
import { customersApi } from "../../services/customersApi";
import { productsApi } from "../../services/productsApi";

const COLORS = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#8B5CF6',
  infoLight: '#EDE9FE',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  bgMain: '#F9FAFB',
  cardBg: '#FFFFFF',
  chartBlue: '#3B82F6',
  chartGreen: '#10B981',
  chartOrange: '#F59E0B',
  chartPurple: '#8B5CF6',
};

const CHART_COLORS = [COLORS.chartBlue, COLORS.chartGreen, COLORS.chartOrange, COLORS.chartPurple];

const calculateOrderTotal = (order) => {
  if (!order) return 0;
  if (order.grand_total && order.grand_total > 0) return order.grand_total;
  if (order.total_amount && order.total_amount > 0) return order.total_amount;
  if (order.total && order.total > 0) return order.total;
  if (order.amount && order.amount > 0) return order.amount;
  
  if (order.items && Array.isArray(order.items) && order.items.length > 0) {
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

export function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_orders: 0,
    total_customers: 0,
    avg_order_value: 0,
    pending_orders: 0,
    delivered_orders: 0,
    cancelled_orders: 0,
    revenue_today: 0,
    orders_today: 0,
    out_of_stock_products: 0,
    low_stock_products: 0,
    total_products: 0,
    avg_delivery_time: 0,
    repeat_customers: 0,
    conversion_rate: 0,
  });
  
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [orderStatusDistribution, setOrderStatusDistribution] = useState([]);
  const [customerCache, setCustomerCache] = useState({});
  const [weeklyOrdersData, setWeeklyOrdersData] = useState([]);
  const [monthlyComparison, setMonthlyComparison] = useState({ revenueGrowth: 0, ordersGrowth: 0 });
  const [lowStockProductsList, setLowStockProductsList] = useState([]);
  const [outOfStockProductsList, setOutOfStockProductsList] = useState([]);
  const [topCategories, setTopCategories] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    setLastUpdated(new Date());
  };

  const fetchCustomerDetails = async (customerId) => {
    if (!customerId) return null;
    if (customerCache[customerId]) return customerCache[customerId];
    try {
      const response = await customersApi.getById(customerId);
      const customerData = response?.data || response?.customer || response;
      setCustomerCache(prev => ({ ...prev, [customerId]: customerData }));
      return customerData;
    } catch {
      return null;
    }
  };

  const enrichOrdersWithCustomerDetails = async (ordersList) => {
    if (!ordersList?.length) return ordersList;
    const enrichedOrders = [];
    for (const order of ordersList) {
      let enrichedOrder = { ...order, display_total: calculateOrderTotal(order) };
      if (order.customer_id && (!order.customer_name || order.customer_name === 'Guest')) {
        const details = await fetchCustomerDetails(order.customer_id);
        if (details) {
          enrichedOrder.customer_name = details.name || details.full_name;
          enrichedOrder.customer_email = details.email;
        }
      }
      enrichedOrders.push(enrichedOrder);
    }
    return enrichedOrders;
  };

  const calculateWeeklyOrders = (orders) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData = days.map(day => ({ day, orders: 0 }));
    orders.forEach(order => {
      if (order.created_at) {
        const date = new Date(order.created_at);
        const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
        if (weeklyData[dayIndex]) weeklyData[dayIndex].orders++;
      }
    });
    return weeklyData;
  };

  const calculateMonthlyComparison = (orders) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    let currentRevenue = 0, prevRevenue = 0;
    let currentOrders = 0, prevOrders = 0;
    
    orders.forEach(order => {
      if (order.created_at) {
        const date = new Date(order.created_at);
        const revenue = calculateOrderTotal(order);
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          currentRevenue += revenue;
          currentOrders++;
        }
        if (date.getMonth() === prevMonth && date.getFullYear() === prevYear) {
          prevRevenue += revenue;
          prevOrders++;
        }
      }
    });
    
    return {
      revenueGrowth: prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0,
      ordersGrowth: prevOrders > 0 ? ((currentOrders - prevOrders) / prevOrders) * 100 : 0,
    };
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [allOrders, customersData, categorySalesData, revenueChartData, topProductsData, allProducts] = await Promise.all([
        dashboardApi.getAllOrders(),
        customersApi.getAll({ limit: 100 }),
        dashboardApi.getCategorySales(),
        dashboardApi.getRevenueData(),
        dashboardApi.getTopProducts(),
        productsApi.getAll()
      ]);

      let ordersList = [];
      if (Array.isArray(allOrders)) ordersList = allOrders;
      else if (allOrders?.orders && Array.isArray(allOrders.orders)) ordersList = allOrders.orders;
      else if (allOrders?.data && Array.isArray(allOrders.data)) ordersList = allOrders.data;
      else ordersList = [];

      let customersList = [];
      if (Array.isArray(customersData)) customersList = customersData;
      else if (customersData?.customers && Array.isArray(customersData.customers)) customersList = customersData.customers;
      else if (customersData?.data && Array.isArray(customersData.data)) customersList = customersData.data;
      else customersList = [];

      let productsList = [];
      if (Array.isArray(allProducts)) productsList = allProducts;
      else if (allProducts?.products && Array.isArray(allProducts.products)) productsList = allProducts.products;
      else if (allProducts?.data && Array.isArray(allProducts.data)) productsList = allProducts.data;
      else productsList = [];

      const enrichedOrders = await enrichOrdersWithCustomerDetails(ordersList);
      
      let totalRevenue = 0;
      const totalOrders = enrichedOrders.length;
      let pendingOrders = 0;
      let deliveredOrders = 0;
      let cancelledOrders = 0;
      let revenueToday = 0;
      let ordersToday = 0;
      
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      enrichedOrders.forEach(order => {
        const revenue = order.display_total || 0;
        totalRevenue += revenue;
        
        const status = (order.order_status || order.status || '').toLowerCase();
        
        if (status === 'delivered' || status === 'completed') {
          deliveredOrders++;
        } else if (status === 'cancelled' || status === 'refunded') {
          cancelledOrders++;
        } else {
          pendingOrders++;
        }
        
        if (order.created_at) {
          const orderDateStr = new Date(order.created_at).toISOString().split('T')[0];
          if (orderDateStr === todayStr) {
            ordersToday++;
            revenueToday += revenue;
          }
        }
      });

      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      const customerOrderMap = new Map();
      enrichedOrders.forEach(order => {
        if (order.customer_id) {
          customerOrderMap.set(order.customer_id, (customerOrderMap.get(order.customer_id) || 0) + 1);
        }
      });
      const repeatCount = Array.from(customerOrderMap.values()).filter(count => count > 1).length;
      const repeatRate = customersList.length > 0 ? (repeatCount / customersList.length) * 100 : 0;
      const conversionRate = customersList.length > 0 ? (totalOrders / customersList.length) * 100 : 0;
      
      const outOfStock = productsList.filter(p => (p.stock_quantity === 0 || p.stock_quantity === null) && p.status === 'active');
      const lowStock = productsList.filter(p => (p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 5)) && p.status === 'active');

      setStats({
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        total_customers: customersList.length,
        avg_order_value: avgOrderValue,
        pending_orders: pendingOrders,
        delivered_orders: deliveredOrders,
        cancelled_orders: cancelledOrders,
        revenue_today: revenueToday,
        orders_today: ordersToday,
        out_of_stock_products: outOfStock.length,
        low_stock_products: lowStock.length,
        total_products: productsList.length,
        avg_delivery_time: 0,
        repeat_customers: repeatRate,
        conversion_rate: conversionRate,
      });

      setOutOfStockProductsList(outOfStock.slice(0, 5));
      setLowStockProductsList(lowStock.slice(0, 5));
      
      const sortedOrders = [...enrichedOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecentOrders(sortedOrders.slice(0, 5));
      
      setRevenueData(revenueChartData || []);
      setTopProducts(topProductsData?.slice(0, 5) || []);
      
      if (categorySalesData?.length) {
        const filtered = categorySalesData.filter(c => c.name !== 'Uncategorized').slice(0, 5);
        setCategoryData(filtered.map((c, i) => ({ 
          ...c, 
          color: CHART_COLORS[i % CHART_COLORS.length], 
          value: c.value || c.sales || c.revenue || 0 
        })));
        setTopCategories(filtered.map(c => ({ name: c.name, value: c.value || c.sales || c.revenue || 0 })));
      }
      
      const sortedCustomers = [...customersList].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecentCustomers(sortedCustomers.slice(0, 5).map(c => ({
        ...c,
        initials: (c.name || c.email || 'U').charAt(0).toUpperCase(),
        total_spent_formatted: `₹${(c.total_spent || 0).toLocaleString('en-IN')}`,
        join_date_formatted: c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'
      })));
      
      setOrderStatusDistribution([
        { name: 'Pending', value: pendingOrders, color: COLORS.warning },
        { name: 'Delivered', value: deliveredOrders, color: COLORS.success },
        { name: 'Cancelled', value: cancelledOrders, color: COLORS.danger },
      ].filter(s => s.value > 0));
      
      setWeeklyOrdersData(calculateWeeklyOrders(enrichedOrders));
      
      const monthlyComp = calculateMonthlyComparison(enrichedOrders);
      setMonthlyComparison(monthlyComp);

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amt) => `₹${(amt || 0).toLocaleString('en-IN')}`;
  const formatShortCurrency = (amt) => {
    if (amt >= 1e7) return `₹${(amt / 1e7).toFixed(1)}Cr`;
    if (amt >= 1e5) return `₹${(amt / 1e5).toFixed(1)}L`;
    if (amt >= 1e3) return `₹${(amt / 1e3).toFixed(1)}K`;
    return `₹${amt}`;
  };
  const formatNumber = (num) => num?.toLocaleString() || '0';
  const formatPercent = (num) => `${num?.toFixed(1) || 0}%`;
  const formatDecimal = (num) => num?.toFixed(2) || '0';
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A';

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered' || s === 'completed') return { bg: COLORS.successLight, text: COLORS.success, icon: <CheckCircle className="w-3 h-3" /> };
    if (s === 'cancelled' || s === 'refunded') return { bg: COLORS.dangerLight, text: COLORS.danger, icon: <XCircle className="w-3 h-3" /> };
    return { bg: COLORS.warningLight, text: COLORS.warning, icon: <ClockIcon className="w-3 h-3" /> };
  };

  const handleViewProducts = (type) => {
    navigate('/admin/products', { state: { filter: type } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6B7280]">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-[#1F2937] mb-2">Failed to Load Dashboard</h3>
          <p className="text-sm text-[#6B7280] mb-4">{error}</p>
          <button onClick={refreshData} className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] flex items-center gap-2 mx-auto">
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Dashboard</h1>
          <p className="text-sm text-[#6B7280] mt-1">Welcome back! Here's what's happening with your store today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[#6B7280] bg-white px-3 py-2 rounded-lg shadow-sm border border-[#E5E7EB]">
            <Calendar className="w-3.5 h-3.5" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <button onClick={refreshData} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] text-white rounded-lg text-sm font-medium hover:bg-[#2563EB] transition-all disabled:opacity-50">
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>
      </div>

      {/* Professional Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <span className={`text-xs font-medium ${monthlyComparison.revenueGrowth >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} px-2 py-1 rounded-full flex items-center gap-1`}>
              {monthlyComparison.revenueGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(monthlyComparison.revenueGrowth).toFixed(1)}%
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatShortCurrency(stats.total_revenue)}</p>
          <p className="text-xs text-gray-500 mt-1">Total Revenue</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
            </div>
            {monthlyComparison.ordersGrowth !== 0 && (
              <span className={`text-xs font-medium ${monthlyComparison.ordersGrowth >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} px-2 py-1 rounded-full flex items-center gap-1`}>
                {monthlyComparison.ordersGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(monthlyComparison.ordersGrowth).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-xl font-bold text-gray-900">{formatNumber(stats.total_orders)}</p>
          <p className="text-xs text-gray-500 mt-1">Total Orders</p>
          {monthlyComparison.ordersGrowth !== 0 && (
            <p className="text-[10px] text-gray-400 mt-1">vs last month</p>
          )}
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatNumber(stats.total_customers)}</p>
          <p className="text-xs text-gray-500 mt-1">Total Customers</p>
          <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
            <span>⭐</span> {formatPercent(stats.repeat_customers)} repeat rate
          </p>
        </div>

        {/* Avg. Order Value */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(formatDecimal(stats.avg_order_value))}</p>
          <p className="text-xs text-gray-500 mt-1">Avg. Order Value</p>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.pending_orders}</p>
          <p className="text-xs text-gray-500 mt-1">Pending Orders</p>
          <p className="text-[10px] text-gray-400 mt-1">Awaiting processing</p>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.out_of_stock_products + stats.low_stock_products}</p>
          <p className="text-xs text-gray-500 mt-1">Low/Out of Stock</p>
          <p className="text-[10px] text-gray-400 mt-1">Need attention</p>
        </div>
      </div>

      {/* Charts Row - Smaller height */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue Trend Chart - Reduced height */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm text-[#1F2937]">Revenue Trend</h3>
              <p className="text-xs text-[#6B7280]">Monthly revenue performance</p>
            </div>
            <BarChart3 className="w-4 h-4 text-[#6B7280]" />
          </div>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatShortCurrency(v)} />
                <Tooltip formatter={(v) => [formatCurrency(v), "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-[#9CA3AF]">
              <Package className="w-10 h-10 opacity-50" />
            </div>
          )}
        </div>

        {/* Weekly Activity Chart - Reduced height */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm text-[#1F2937]">Weekly Activity</h3>
              <p className="text-xs text-[#6B7280]">Orders by day of week</p>
            </div>
            <BarChart3 className="w-4 h-4 text-[#6B7280]" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyOrdersData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="orders" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Charts Row - Reduced height */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sales by Category */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm text-[#1F2937]">Sales by Category</h3>
              <p className="text-xs text-[#6B7280]">Revenue distribution</p>
            </div>
            <PieChartIcon className="w-4 h-4 text-[#6B7280]" />
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="45%" innerRadius={35} outerRadius={55} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend verticalAlign="bottom" height={40} wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-[#9CA3AF]">
              <Package className="w-10 h-10 opacity-50" />
            </div>
          )}
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm text-[#1F2937]">Order Status</h3>
              <p className="text-xs text-[#6B7280]">Current order distribution</p>
            </div>
          </div>
          {orderStatusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={orderStatusDistribution} cx="50%" cy="45%" innerRadius={35} outerRadius={55} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {orderStatusDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={40} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-[#9CA3AF]">
              <Package className="w-10 h-10 opacity-50" />
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-sm text-[#1F2937]">Recent Orders</h3>
              <p className="text-xs text-[#6B7280]">Latest 5 customer orders</p>
            </div>
            <button className="text-xs text-[#3B82F6] hover:underline flex items-center gap-1">View All <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-[#6B7280]">Order ID</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-[#6B7280]">Customer</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-[#6B7280]">Date</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-[#6B7280]">Amount</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-[#6B7280]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order, idx) => {
                  const badge = getStatusBadge(order.order_status);
                  return (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 text-xs font-mono text-[#1F2937]">{order.order_number || order.id?.slice(-8) || `ORD-${idx + 1}`}</td>
                      <td className="px-4 py-2">
                        <p className="text-xs text-[#1F2937]">{order.customer_name || "Guest"}</p>
                        <p className="text-[10px] text-[#6B7280]">{order.customer_email || ""}</p>
                      </td>
                      <td className="px-4 py-2 text-xs text-[#6B7280]">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-2 text-xs font-semibold text-[#1F2937]">{formatCurrency(order.display_total)}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                          {badge.icon} {order.order_status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-sm text-[#1F2937]">Top Selling Products</h3>
              <p className="text-xs text-[#6B7280]">Best performing items</p>
            </div>
            <button className="text-xs text-[#3B82F6] hover:underline flex items-center gap-1">View All <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="divide-y divide-gray-100">
            {topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {product.image ? <img src={product.image} className="w-full h-full object-cover rounded-lg" /> : <Package className="w-4 h-4 text-gray-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-[#1F2937] truncate">{product.name}</p>
                  <p className="text-[10px] text-[#6B7280]">{formatNumber(product.sales)} units • {formatCurrency(product.price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-[#1F2937]">{formatCurrency((product.sales || 0) * (product.price || 0))}</p>
                  <div className="w-20 bg-gray-200 rounded-full h-1 mt-1">
                    <div className="bg-blue-500 rounded-full h-1" style={{ width: `${Math.min(((product.sales || 0) / (topProducts[0]?.sales || 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Customers & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Customers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-sm text-[#1F2937]">New Customers</h3>
              <p className="text-xs text-[#6B7280]">Recently joined customers</p>
            </div>
            <UserPlus className="w-4 h-4 text-[#6B7280]" />
          </div>
          <div className="divide-y divide-gray-100">
            {recentCustomers.map((customer, idx) => (
              <div key={idx} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-xs">
                  {customer.initials}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-[#1F2937]">{customer.name || customer.email?.split('@')[0] || 'Customer'}</p>
                  <p className="text-[10px] text-[#6B7280]">{customer.email || 'No email'} • Joined {customer.join_date_formatted}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-[#1F2937]">{customer.total_spent_formatted}</p>
                  <p className="text-[10px] text-[#6B7280]">{formatNumber(customer.total_orders)} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Alerts Only */}
        <div className="space-y-4">
          {stats.out_of_stock_products > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-rose-50/30">
                <div>
                  <h3 className="font-semibold text-sm text-[#1F2937]">Out of Stock</h3>
                  <p className="text-xs text-[#6B7280]">Products that need immediate restock</p>
                </div>
                <button onClick={() => handleViewProducts('out_of_stock')} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                  <Eye className="w-3 h-3" /> View
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {outOfStockProductsList.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-2">
                    <div>
                      <p className="text-xs font-medium text-[#1F2937]">{product.name}</p>
                      <p className="text-[10px] text-rose-500">Out of Stock</p>
                    </div>
                    <button className="text-[10px] text-rose-500 font-medium">Restock</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.low_stock_products > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-amber-50/30">
                <div>
                  <h3 className="font-semibold text-sm text-[#1F2937]">Low Stock Alert</h3>
                  <p className="text-xs text-[#6B7280]">Products below threshold level</p>
                </div>
                <button onClick={() => handleViewProducts('low_stock')} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                  <Eye className="w-3 h-3" /> View
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {lowStockProductsList.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-2">
                    <div>
                      <p className="text-xs font-medium text-[#1F2937]">{product.name}</p>
                      <p className="text-[10px] text-amber-500">Only {product.stock_quantity} left</p>
                    </div>
                    <button className="text-[10px] text-amber-500 font-medium">Reorder</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}