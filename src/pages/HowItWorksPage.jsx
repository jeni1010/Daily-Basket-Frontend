// src/pages/HowItWorksPage.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Laptop, ShoppingCart, Truck, Play, X, Leaf, Clock, Shield } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function HowItWorksPage() {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4FBF3]">
      <Navbar />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-12 max-w-[1200px] mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4" style={{ letterSpacing: '-0.02em' }}>
              How <span className="text-green-600">Daily Basket</span> Works
            </h1>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Get your fresh groceries delivered in three simple steps
            </p>
          </motion.div>
        </div>

        {/* Steps Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all"
          >
            <div className="relative">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Laptop className="w-12 h-12 text-green-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold">1</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Open the Website</h3>
            <p className="text-gray-500 text-sm">
              Visit Daily Basket and browse over 7000+ products across groceries, fresh fruits & veggies, meat, and more.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all"
          >
            <div className="relative">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <ShoppingCart className="w-12 h-12 text-green-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold">2</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Place an Order</h3>
            <p className="text-gray-500 text-sm">
              Add your favourite items to the cart & avail the best offers. Choose delivery time that suits you.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all"
          >
            <div className="relative">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Truck className="w-12 h-12 text-green-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold">3</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Get Free Delivery</h3>
            <p className="text-gray-500 text-sm">
              Experience lightning-fast speed & get all your items delivered in minutes. Free delivery above ₹200.
            </p>
          </motion.div>
        </div>

        {/* Demo Video Section - FIXED: Removed Rick Roll URL */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Watch How It Works</h2>
            <p className="text-gray-500">A quick demo to get you started</p>
          </div>
          
          <div className="relative bg-gradient-to-r from-green-600 to-green-700 rounded-2xl overflow-hidden shadow-xl max-w-4xl mx-auto">
            <div className="aspect-video relative">
              {!showVideo ? (
                <>
                  <img 
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=450&fit=crop"
                    alt="Demo Video Thumbnail"
                    className="w-full h-full object-cover opacity-40"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <button 
                        onClick={() => setShowVideo(true)}
                        className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:scale-110 transition-transform group"
                      >
                        <Play className="w-10 h-10 text-white ml-1" />
                      </button>
                      <h3 className="text-white font-semibold text-xl">Watch Demo Video</h3>
                      <p className="text-white/80 text-sm mt-1">2 minute tour of Daily Basket</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-white/70">Demo video would play here</p>
                    <p className="text-white/50 text-sm mt-2">Replace with actual demo video URL</p>
                  </div>
                  <button 
                    onClick={() => setShowVideo(false)}
                    className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-2xl p-8 shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">Why Choose Daily Basket?</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center group">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-600 transition-colors">
                <Truck className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-semibold text-gray-800">Free Delivery</h4>
              <p className="text-xs text-gray-500">On orders above ₹200</p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-600 transition-colors">
                <Leaf className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-semibold text-gray-800">100% Fresh</h4>
              <p className="text-xs text-gray-500">Quality guaranteed</p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-600 transition-colors">
                <Clock className="w-6 h-6 text-orange-600 group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-semibold text-gray-800">Fast Delivery</h4>
              <p className="text-xs text-gray-500">30 mins express</p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-600 transition-colors">
                <Shield className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <h4 className="font-semibold text-gray-800">Secure Payment</h4>
              <p className="text-xs text-gray-500">100% protected</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-2">How fast is delivery?</h4>
              <p className="text-sm text-gray-500">We offer 30-minute express delivery for most areas. Standard delivery takes 1-2 hours.</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-2">Is there a minimum order?</h4>
              <p className="text-sm text-gray-500">Minimum order is ₹100 for delivery. Free delivery on orders above ₹200.</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-2">What payment methods are accepted?</h4>
              <p className="text-sm text-gray-500">We accept Credit/Debit cards, UPI, Net Banking, Cash on Delivery, and Wallets.</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-2">Can I return products?</h4>
              <p className="text-sm text-gray-500">Yes, we have a 7-day easy return policy for quality issues.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}