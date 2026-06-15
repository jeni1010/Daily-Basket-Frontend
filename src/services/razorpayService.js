// src/services/razorpayService.js
import apiRequest from './api';

// Load Razorpay script dynamically
export const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      let attempts = 0;
      const checkRazorpay = setInterval(() => {
        if (window.Razorpay) {
          clearInterval(checkRazorpay);
          resolve(true);
        }
        attempts++;
        if (attempts > 50) {
          clearInterval(checkRazorpay);
          reject(new Error('Razorpay SDK loaded but not available'));
        }
      }, 100);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      let attempts = 0;
      const checkRazorpay = setInterval(() => {
        if (window.Razorpay) {
          clearInterval(checkRazorpay);
          resolve(true);
        }
        attempts++;
        if (attempts > 50) {
          clearInterval(checkRazorpay);
          reject(new Error('Razorpay SDK loaded but not available'));
        }
      }, 100);
    };
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
};

// ✅ FIXED: Send EMPTY body - backend reads amount from order.summary.amount
export const createRazorpayOrder = async (amount, currency = "INR", orderId = null) => {
  try {
    if (!orderId) {
      throw new Error("Order ID is required for payment creation");
    }
    
    if (!amount || amount <= 0) {
      throw new Error("Valid amount is required for payment creation");
    }
    
    console.log('Creating Razorpay order for orderId:', orderId);
    console.log('Amount will be read from order summary:', amount);
    
    // ✅ Send EMPTY body - backend reads amount from order.summary.amount
    const response = await apiRequest(`/payments/create-order/${orderId}`, {
      method: 'POST',
      // No body - empty request
    });
    
    console.log('Razorpay order response:', response);
    
    const responseData = response.data || response;
    
    return {
      success: true,
      razorpay_key_id: responseData.key_id || responseData.razorpay_key_id,
      razorpay_order_id: responseData.order_id || responseData.razorpay_order_id,
      amount: responseData.amount || amount,
      currency: responseData.currency || currency,
      order_id: orderId,
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return {
      success: false,
      error: error.message || "Failed to create payment order",
    };
  }
};

// ✅ FIXED: Use correct customer endpoint for payment verification
export const verifyPayment = async (paymentData) => {
  try {
    const response = await apiRequest('/customer/verify-payment', {
      method: 'POST',
      body: paymentData,
    });
    
    console.log('Payment verification response:', response);
    
    const responseData = response.data || response;
    
    return {
      success: true,
      data: responseData,
      verified: responseData.status === 'success' || responseData.verified === true,
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    return {
      success: false,
      error: error.message || "Payment verification failed",
    };
  }
};

// Open Razorpay checkout
export const openRazorpayCheckout = (options, onSuccess, onFailure) => {
  if (!window.Razorpay) {
    console.error('Razorpay SDK not loaded');
    if (onFailure) {
      onFailure('Payment system not loaded. Please refresh and try again.');
    }
    return null;
  }
  
  const razorpayOptions = {
    key: options.razorpay_key_id,
    amount: options.amount,
    currency: options.currency,
    name: options.name || 'Daily Basket',
    description: options.description || 'Order Payment',
    image: options.image || '/logo2.jpeg',
    order_id: options.razorpay_order_id,
    handler: function(response) {
      console.log('Razorpay payment success:', response);
      if (onSuccess) {
        onSuccess(response);
      }
    },
    prefill: {
      name: options.customerName || '',
      email: options.customerEmail || '',
      contact: options.customerPhone || '',
    },
    notes: options.notes || {},
    theme: {
      color: options.themeColor || '#3E7C47',
    },
    modal: {
      ondismiss: function() {
        console.log('Razorpay modal closed');
        if (onFailure) {
          onFailure('Payment cancelled');
        }
      },
    },
  };

  try {
    const razorpay = new window.Razorpay(razorpayOptions);
    
    razorpay.on('payment.failed', function(response) {
      console.error('Razorpay payment failed:', response);
      if (onFailure) {
        onFailure(response.error?.description || 'Payment failed');
      }
    });
    
    razorpay.open();
    return razorpay;
  } catch (error) {
    console.error('Error opening Razorpay checkout:', error);
    if (onFailure) {
      onFailure('Failed to open payment window');
    }
    return null;
  }
};

// Complete payment flow - one function to handle everything
export const initiatePayment = async (orderId, amount, customerDetails = {}, onSuccess, onFailure) => {
  try {
    // 1. Load Razorpay script
    await loadRazorpayScript();
    
    // 2. Create Razorpay order (sends empty body)
    const orderResult = await createRazorpayOrder(amount, 'INR', orderId);
    
    if (!orderResult.success) {
      throw new Error(orderResult.error);
    }
    
    // 3. Open checkout
    openRazorpayCheckout(
      {
        razorpay_key_id: orderResult.razorpay_key_id,
        razorpay_order_id: orderResult.razorpay_order_id,
        amount: orderResult.amount,
        currency: orderResult.currency,
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.phone,
        notes: {
          order_id: orderId,
        },
      },
      onSuccess,
      onFailure
    );
    
    return orderResult;
  } catch (error) {
    console.error('Payment initiation failed:', error);
    if (onFailure) {
      onFailure(error.message);
    }
    return null;
  }
};

export default {
  loadRazorpayScript,
  createRazorpayOrder,
  verifyPayment,
  openRazorpayCheckout,
  initiatePayment,
};