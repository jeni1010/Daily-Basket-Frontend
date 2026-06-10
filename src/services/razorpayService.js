// src/services/razorpayService.js
import apiRequest from './api';

// Load Razorpay script dynamically
export const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    // Check if script already exists
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      resolve(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
};

// Create order on your backend
export const createRazorpayOrder = async (amount, currency = "INR", orderId = null) => {
  try {
    const response = await apiRequest('/customer/create-order', {
      method: 'POST',
      body: JSON.stringify({
        amount: amount,
        currency: currency,
        order_id: orderId, // Optional: your internal order ID
      }),
    });
    
    return {
      success: true,
      razorpay_key_id: response.razorpay_key_id,
      razorpay_order_id: response.razorpay_order_id,
      amount: response.amount,
      currency: response.currency,
      order_id: response.order_id, // Your internal order ID
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Verify payment after successful transaction
export const verifyPayment = async (paymentData) => {
  try {
    const response = await apiRequest('/customer/verify-payment', {
      method: 'POST',
      body: JSON.stringify({
        order_id: paymentData.order_id, // Your internal order ID
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      }),
    });
    
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Open Razorpay checkout
export const openRazorpayCheckout = (options, onSuccess, onFailure) => {
  const razorpayOptions = {
    key: options.razorpay_key_id,
    amount: options.amount,
    currency: options.currency,
    name: options.name || 'Daily Basket',
    description: options.description || 'Order Payment',
    image: options.image || '/logo2.jpeg',
    order_id: options.razorpay_order_id,
    handler: function(response) {
      // This function is called when payment is successful
      onSuccess(response);
    },
    prefill: {
      name: options.customerName || '',
      email: options.customerEmail || '',
      contact: options.customerPhone || '',
    },
    notes: options.notes || {},
    theme: {
      color: options.themeColor || '#3B82F6',
    },
    modal: {
      ondismiss: function() {
        if (onFailure) {
          onFailure('Payment modal closed');
        }
      },
    },
  };

  const razorpay = new window.Razorpay(razorpayOptions);
  razorpay.open();
  
  return razorpay;
};