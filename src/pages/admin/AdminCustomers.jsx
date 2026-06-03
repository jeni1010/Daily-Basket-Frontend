import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, Mail, Phone, Users, ShoppingBag, DollarSign, 
  TrendingUp, Download, RefreshCw, 
  Award, Star, Clock, FileText, FileSpreadsheet, XCircle, AlertCircle
} from "lucide-react";
import { customersApi } from "../../services/customersApi";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [ordersError, setOrdersError] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalOrders: 0,
    totalRevenue: 0
  });

  let searchTimeout;
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      fetchCustomers(value);
    }, 500);
  };

  useEffect(() => {
    fetchCustomers();
  }, [filterStatus]);

  const fetchCustomers = async (searchValue = search) => {
    try {
      setLoading(true);
      setError(null);
      setOrdersError(false);
      
      const params = {};
      if (searchValue && searchValue.trim()) {
        params.search = searchValue.trim();
      }
      if (filterStatus !== "all") {
        params.status = filterStatus;
      }
      
      const data = await customersApi.getAll(params);
      
      setCustomers(data);
      
      const hasOrders = data.some(c => (c.total_orders || 0) > 0);
      if (data.length > 0 && !hasOrders) {
        setOrdersError(true);
      }
      
      const active = data.filter(c => c.status === 'active').length;
      const inactive = data.filter(c => c.status === 'inactive').length;
      const totalOrders = data.reduce((sum, c) => sum + (c.total_orders || 0), 0);
      
      const totalRevenue = data.reduce((sum, c) => {
        const spent = c.total_spent || 0;
        return sum + (isNaN(spent) ? 0 : spent);
      }, 0);
      
      setStats({
        total: data.length,
        active: active,
        inactive: inactive,
        totalOrders: totalOrders,
        totalRevenue: totalRevenue
      });
    } catch (error) {
      setError(error.message || "Failed to fetch customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    setExporting(true);
    try {
      const exportData = customers.map(customer => ({
        'Customer ID': customer._id || customer.id,
        'Name': customer.name || 'N/A',
        'Email': customer.email || 'N/A',
        'Phone': customer.phone || 'N/A',
        'Join Date': customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-IN') : 'N/A',
        'Total Orders': customer.total_orders || 0,
        'Total Spent (₹)': (customer.total_spent || 0).toLocaleString('en-IN'),
        'Last Order Date': customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString('en-IN') : 'N/A',
        'Status': customer.status || 'active',
        'Verified': customer.is_verified ? 'Yes' : 'No',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Customers');
      
      XLSX.writeFile(wb, `customers_${new Date().toISOString().split('T')[0]}.xlsx`);
      alert("✅ Excel report exported successfully!");
    } catch (error) {
      alert("Failed to export to Excel");
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const primaryColor = [62, 124, 71];
      const lightGray = [245, 245, 245];
      
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('DAILY BASKET', 20, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Customer Report', 20, 32);
      
      const dateStr = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.setFontSize(9);
      doc.setTextColor(220, 220, 220);
      doc.text(`Generated: ${dateStr}`, pageWidth - 20, 20, { align: 'right' });
      
      const summaryY = 60;
      const formatAmount = (amount) => `Rs. ${amount.toLocaleString('en-IN')}`;
      
      const totalRevenueFormatted = formatAmount(stats.totalRevenue);
      const avgOrderFormatted = formatAmount(stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0);
      
      const summaryData = [
        { label: 'Total Customers', value: stats.total.toString(), color: [66, 139, 202] },
        { label: 'Total Orders', value: stats.totalOrders.toString(), color: [92, 184, 92] },
        { label: 'Total Revenue', value: totalRevenueFormatted, color: [240, 173, 78] },
        { label: 'Avg Order Value', value: avgOrderFormatted, color: [217, 83, 79] }
      ];
      
      const cardWidth = (pageWidth - 40) / 4;
      const cardHeight = 38;
      
      summaryData.forEach((item, index) => {
        const x = 20 + (index * cardWidth);
        
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.roundedRect(x, summaryY, cardWidth - 5, cardHeight, 3, 3, 'F');
        
        doc.setDrawColor(item.color[0], item.color[1], item.color[2]);
        doc.setLineWidth(1.5);
        doc.line(x, summaryY, x + cardWidth - 5, summaryY);
        
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text(item.label, x + 5, summaryY + 12);
        
        doc.setFontSize(11);
        doc.setTextColor(item.color[0], item.color[1], item.color[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(item.value, x + 5, summaryY + 28);
      });
      
      const startY = summaryY + cardHeight + 15;
      
      const tableHeaders = [['Customer Name', 'Email', 'Phone', 'Orders', 'Total Spent (Rs.)', 'Last Order', 'Status']];
      
      const tableBody = customers.map(customer => [
        (customer.name || 'Anonymous').substring(0, 30),
        (customer.email || 'N/A').substring(0, 35),
        customer.phone || 'N/A',
        (customer.total_orders || 0).toString(),
        `Rs. ${(customer.total_spent || 0).toLocaleString('en-IN')}`,
        customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString('en-IN') : 'Never',
        customer.status === 'active' ? 'Active' : 'Inactive'
      ]);
      
      autoTable(doc, {
        head: tableHeaders,
        body: tableBody,
        startY: startY,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 4,
          font: 'helvetica',
          textColor: [60, 60, 60],
          lineColor: [220, 220, 220],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248]
        },
        columnStyles: {
          0: { cellWidth: 40, halign: 'left' },
          1: { cellWidth: 50, halign: 'left' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 35, halign: 'right' },
          5: { cellWidth: 30, halign: 'center' },
          6: { cellWidth: 25, halign: 'center' }
        },
        margin: { left: 20, right: 20 },
        tableWidth: 'auto'
      });
      
      const finalY = doc.lastAutoTable.finalY + 10;
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(20, finalY, pageWidth - 20, finalY);
      
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.setFont('helvetica', 'normal');
      
      doc.text(`Total Customers: ${customers.length} | Active: ${stats.active} | Inactive: ${stats.inactive}`, 20, finalY + 6);
      doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - 20, finalY + 6, { align: 'right' });
      
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`Report generated from Daily Basket Admin Panel`, pageWidth / 2, finalY + 12, { align: 'center' });
      
      doc.save(`customers_report_${new Date().toISOString().split('T')[0]}.pdf`);
      alert("✅ PDF report exported successfully!");
      
    } catch (error) {
      alert("Failed to export to PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const getCustomerBadge = (customer) => {
    const totalSpent = customer.total_spent || 0;
    const orders = customer.total_orders || 0;
    
    if (totalSpent > 10000 || orders > 20) {
      return { label: "VIP", color: "bg-amber-100 text-amber-700", icon: <Star className="w-3 h-3" /> };
    }
    if (totalSpent > 5000 || orders > 10) {
      return { label: "Regular", color: "bg-blue-100 text-blue-700", icon: <Award className="w-3 h-3" /> };
    }
    return { label: "New", color: "bg-green-100 text-green-700", icon: <Clock className="w-3 h-3" /> };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3E7C47] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading customers...</p>
        </div>
      </div>
    );
  }

  const avgOrderValue = stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and view all customer information</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fetchCustomers()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all">
              <Download className="w-4 h-4" /> Export
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={exportToExcel}
                disabled={exporting}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Export to Excel
              </button>
              <button
                onClick={exportToPDF}
                disabled={exporting}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-b-xl transition-colors"
              >
                <FileText className="w-4 h-4 text-red-600" />
                Export to PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {ordersError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-yellow-800">Orders Data Note</h4>
              <p className="text-xs text-yellow-700 mt-1">
                No orders found for customers. Make sure there are orders placed in the system to see customer order statistics.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-800">Error Loading Customers</h4>
              <p className="text-xs text-red-600 mt-1">{error}</p>
              <button 
                onClick={() => fetchCustomers()}
                className="mt-2 text-xs text-red-700 underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#3E7C47]/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-[#3E7C47]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm font-medium text-gray-700 mt-1">Total Customers</p>
          <p className="text-xs text-gray-400 mt-0.5">{stats.active} active, {stats.inactive} inactive</p>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
          <p className="text-sm font-medium text-gray-700 mt-1">Total Orders</p>
          <p className="text-xs text-gray-400 mt-0.5">From all customers</p>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-sm font-medium text-gray-700 mt-1">Total Revenue</p>
          <p className="text-xs text-gray-400 mt-0.5">Lifetime value</p>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{avgOrderValue.toLocaleString('en-IN')}</p>
          <p className="text-sm font-medium text-gray-700 mt-1">Avg. Order Value</p>
          <p className="text-xs text-gray-400 mt-0.5">Per order average</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#3E7C47]/20 focus:border-[#3E7C47]"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#3E7C47]/20"
          >
            <option value="all">All Customers</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Spent</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Order</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map((customer, idx) => {
                const badge = getCustomerBadge(customer);
                return (
                  <motion.tr
                    key={customer._id || customer.id || idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#3E7C47] to-[#2E5C37] rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {customer.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{customer.name || "Anonymous"}</p>
                          <p className="text-xs text-gray-400">ID: {customer._id?.slice(-8) || customer.id?.slice(-8) || "N/A"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Mail className="w-3.5 h-3.5 text-gray-400" /> 
                          <span className="truncate max-w-[180px]">{customer.email || "No email"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400" /> 
                          {customer.phone || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-gray-800">{customer.total_orders || 0}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-[#3E7C47]">₹{(customer.total_spent || 0).toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-500">
                        {customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString('en-IN') : 'Never'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        customer.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : customer.status === 'inactive'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {customer.status === 'active' ? 'Active' : customer.status === 'inactive' ? 'Inactive' : customer.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
              {customers.length === 0 && !error && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No customers found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {customers.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{customers.length}</span> customers
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-xs text-gray-500">VIP (₹10k+ or 20+ orders)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-gray-500">Regular (₹5k+ or 10+ orders)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500">New</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}