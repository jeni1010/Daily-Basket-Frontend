import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  CheckCircle, Receipt, Calendar, CreditCard, MapPin, 
  Truck, Download, ShoppingBag, Phone, Mail, Clock, Loader2,
  Package, User, Home, AlertCircle
} from "lucide-react";
import { customerApi } from "../../services/customerApi";
import BrandLogo from "../../components/BrandLogo";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export function OrderSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId: paramOrderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  
  // Get orderId from URL params or location state
  const orderId = paramOrderId || location.state?.orderId;
  const paymentMethodFromUrl = new URLSearchParams(window.location.search).get('method');
  const paymentMethod = paymentMethodFromUrl || location.state?.paymentMethod || "Razorpay";

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
      setError("No order ID found");
      setTimeout(() => {
        navigate("/orders");
      }, 3000);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching order details for ID:", orderId);
      
      const response = await customerApi.orders.getDetails(orderId);
      
      console.log("Order details response:", response);
      
      let orderData = null;
      
      if (response && response.data) {
        orderData = response.data;
      } else if (response && response.order) {
        orderData = response.order;
      } else if (response && response._id) {
        orderData = response;
      } else if (response && response.items) {
        orderData = response;
      } else if (response && (response.id || response.order_id)) {
        orderData = response;
      }
      
      setOrder(orderData);
      
    } catch (error) {
      console.error("Error fetching order:", error);
      setError(error.message || "Failed to fetch order details");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      const response = await customerApi.orders.getInvoice(orderId);
      
      if (response && response.url) {
        window.open(response.url, '_blank');
        return;
      }
      
      if (response && (response.pdf || response.invoice_url)) {
        const pdfUrl = response.pdf || response.invoice_url;
        window.open(pdfUrl, '_blank');
        return;
      }
      
      createSimpleInvoice();
      
    } catch (error) {
      createSimpleInvoice();
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const getItemPrice = (item) => {
    return item.price || item.unit_price || item.product_price || 0;
  };

  const getItemName = (item) => {
    return item.product_name || item.name || item.product?.name || "Product";
  };

  const getItemQuantity = (item) => {
    return item.quantity || 1;
  };

  const calculateSubtotal = () => {
    if (!order?.items || order.items.length === 0) return 0;
    return order.items.reduce((sum, item) => {
      return sum + (getItemPrice(item) * getItemQuantity(item));
    }, 0);
  };

  const getDeliveryCharge = () => {
    const deliveryCharge = 
      order?.shipping_charge || 
      order?.delivery_fee || 
      order?.delivery_charge || 
      order?.shipping_cost ||
      40;
    return deliveryCharge;
  };

  const getTaxAmount = () => {
    return order?.tax_amount || order?.tax || 0;
  };

  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const deliveryCharge = getDeliveryCharge();
    const taxAmount = getTaxAmount();
    return subtotal + deliveryCharge + taxAmount;
  };

  const createSimpleInvoice = () => {
    const orderNumber = order?.order_number || order?.order_id || orderId || "N/A";
    const subtotal = calculateSubtotal();
    const deliveryCharge = getDeliveryCharge();
    const taxAmount = getTaxAmount();
    const grandTotal = calculateGrandTotal();
    
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${orderNumber}</title>
        <style>
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; background: #f5f5f7; }
          .invoice-container { max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
          .invoice-header { background: linear-gradient(135deg, #3E7C47, #2E5C37); color: white; padding: 30px; text-align: center; }
          .invoice-body { padding: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
          th { background: #f8f9fa; font-weight: 600; }
          .summary { text-align: right; margin-top: 20px; }
          .invoice-footer { text-align: center; padding-top: 20px; border-top: 2px solid #eee; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="invoice-header">
            <h1>Daily Basket</h1>
            <p>Order Invoice</p>
          </div>
          <div class="invoice-body">
            <h3>Order Items</h3>
            <table>
              <thead>
                <tr><th>Item</th><th>Quantity</th><th>Price</th><th>Total</th></tr>
              </thead>
              <tbody>
                ${order?.items?.map(item => `
                  <tr>
                    <td>${getItemName(item)}</td>
                    <td>${getItemQuantity(item)}</td>
                    <td>₹${getItemPrice(item)}</td>
                    <td>₹${getItemPrice(item) * getItemQuantity(item)}</td>
                  </tr>
                `).join('') || '<tr><td colspan="4">No items found</td></tr>'}
              </tbody>
            </table>
            <div class="summary">
              <p>Subtotal: ₹${subtotal}</p>
              <p>Delivery: ₹${deliveryCharge}</p>
              <p>Tax: ₹${taxAmount}</p>
              <h3>Grand Total: ₹${grandTotal}</h3>
            </div>
            <div class="invoice-footer">
              <p>Thank you for shopping with Daily Basket!</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${orderNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formattedTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const getOrderStatus = (status) => {
    if (!status) return "Confirmed";
    const statusMap = {
      placed: "Placed",
      confirmed: "Confirmed",
      packed: "Packed",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
      pending: "Pending",
      processing: "Processing"
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-yellow-500";
    const statusMap = {
      placed: "bg-blue-500",
      confirmed: "bg-blue-500",
      packed: "bg-purple-500",
      shipped: "bg-indigo-500",
      delivered: "bg-green-500",
      cancelled: "bg-red-500",
      pending: "bg-yellow-500",
      processing: "bg-orange-500"
    };
    return statusMap[status] || "bg-gray-500";
  };

  const getDeliveryEstimate = (status) => {
    if (status === "delivered") return "Delivered";
    if (status === "shipped") return "~15-20 mins";
    if (status === "packed") return "~30-40 mins";
    if (status === "confirmed") return "~45-60 mins";
    return "~30 mins";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF9]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#3E7C47] animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading order details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FFFDF9]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Order Not Found</h2>
            <p className="text-gray-500 text-sm mb-6">{error || "Unable to fetch order details"}</p>
            <button
              onClick={() => navigate("/orders")}
              className="px-6 py-3 bg-[#3E7C47] text-white rounded-full font-medium hover:bg-[#2E5C37] transition-colors"
            >
              View My Orders
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const orderNumber = order?.order_number || order?.order_id || order?.id || orderId || "N/A";
  const orderStatus = order?.order_status || order?.status || "pending";
  
  const subtotal = calculateSubtotal();
  const deliveryCharge = getDeliveryCharge();
  const taxAmount = getTaxAmount();
  const grandTotal = calculateGrandTotal();
  
  const createdAt = order?.created_at ? new Date(order.created_at).toLocaleDateString() : formattedDate;
  const createdAtTime = order?.created_at ? new Date(order.created_at).toLocaleTimeString() : formattedTime;
  
  const shippingAddress = order?.shipping_address || {};
  const customerName = shippingAddress?.full_name || order?.customer_name || "Customer";
  const customerPhone = shippingAddress?.phone || order?.customer_phone || "N/A";
  const addressLine1 = shippingAddress?.address_line1 || "";
  const addressLine2 = shippingAddress?.address_line2 || "";
  const city = shippingAddress?.city || "";
  const state = shippingAddress?.state || "";
  const pincode = shippingAddress?.postal_code || shippingAddress?.pincode || "";
  
  const fullAddress = [addressLine1, addressLine2, city, state, pincode].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-[#FFFDF9]">
      <Navbar />
      
      <div className="flex items-center justify-center p-4 min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="relative bg-white rounded-xl shadow-md border border-[#E8E1D5] overflow-hidden">
            <div className="pt-5 px-4 pb-3 border-b border-[#E8E1D5]">
              <div className="flex flex-col items-center">
                <BrandLogo size="sm" showTagline={false} />
                <div className="flex items-center gap-2 text-[#3E7C47] mt-2">
                  <CheckCircle className="w-5 h-5" />
                  <h1 className="text-base font-semibold">Order Successful</h1>
                </div>
                {paymentMethod === "Razorpay" && (
                  <p className="text-xs text-gray-500 mt-1">Payment successful via Razorpay</p>
                )}
              </div>
            </div>

            <div className="p-4">
              <div className="text-center mb-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Order ID</p>
                <p className="font-mono text-sm font-semibold text-[#3E7C47] mt-0.5">
                  {orderNumber}
                </p>
              </div>

              <div className="border-t border-dashed border-[#E8E1D5] my-3" />

              <div className={`${getStatusColor(orderStatus)}/10 rounded-lg p-2 mb-3 text-center border border-${getStatusColor(orderStatus)}/20`}>
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(orderStatus)}`} />
                  <p className="text-xs font-medium text-gray-700">
                    Status: {getOrderStatus(orderStatus)}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Delivery {getDeliveryEstimate(orderStatus)}
                </p>
              </div>

              <div className="border-t border-dashed border-[#E8E1D5] my-3" />

              {order?.items && order.items.length > 0 && (
                <>
                  <div className="mb-3">
                    <h3 className="text-xs font-semibold text-gray-700 mb-2">Items</h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <div className="flex-1">
                            <span className="text-gray-700">{getItemName(item)}</span>
                            <span className="text-gray-400 ml-1">x{getItemQuantity(item)}</span>
                          </div>
                          <span className="text-gray-700 font-medium">₹{getItemPrice(item) * getItemQuantity(item)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-dashed border-[#E8E1D5] my-3" />
                </>
              )}

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-[#B6463A]" />
                  <span className="text-xs text-gray-500">Invoice:</span>
                  <span className="text-xs text-gray-700 truncate">{currentDate.getFullYear()}{currentDate.getMonth()+1}{currentDate.getDate()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#B6463A]" />
                  <span className="text-xs text-gray-500">Date:</span>
                  <span className="text-xs text-gray-700">{createdAt}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-[#B6463A]" />
                  <span className="text-xs text-gray-500">Payment:</span>
                  <span className="text-xs text-gray-700 capitalize">{paymentMethod}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#B6463A]" />
                  <span className="text-xs text-gray-500">Time:</span>
                  <span className="text-xs text-gray-700">{createdAtTime}</span>
                </div>
              </div>

              {fullAddress && (
                <>
                  <div className="flex items-start gap-2 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-[#B6463A] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600 flex-1">
                      {fullAddress}
                    </p>
                  </div>
                  <div className="border-t border-dashed border-[#E8E1D5] my-3" />
                </>
              )}

              <div className="bg-[#F5EBD9]/20 rounded-lg p-3 mb-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-700">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Delivery</span>
                    <span className="text-gray-700">₹{deliveryCharge.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Tax</span>
                    <span className="text-gray-700">₹{taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-[#E8E1D5] pt-2 mt-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-800">Total</span>
                      <span className="text-sm font-bold text-[#3E7C47]">₹{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => navigate("/orders")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#3E7C47] text-white rounded-lg text-xs font-medium hover:bg-[#2E5C37] transition-all"
                >
                  <Truck className="w-3.5 h-3.5" /> Track
                </button>
                <button
                  onClick={handleDownloadInvoice}
                  disabled={downloadingInvoice}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-[#E8E1D5] text-gray-600 rounded-lg text-xs font-medium hover:border-[#3E7C47] transition-all disabled:opacity-50"
                >
                  {downloadingInvoice ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  {downloadingInvoice ? "Downloading..." : "Invoice"}
                </button>
                <button
                  onClick={() => navigate("/products")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-[#E8E1D5] text-gray-600 rounded-lg text-xs font-medium hover:border-[#3E7C47] transition-all"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Shop
                </button>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-400">
                  Need help? <span className="text-[#3E7C47]">support@dailybasket.com</span>
                </p>
              </div>
            </div>

            <div className="h-0.5 bg-gradient-to-r from-[#3E7C47] via-[#B6463A] to-[#3E7C47]" />
          </div>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
}