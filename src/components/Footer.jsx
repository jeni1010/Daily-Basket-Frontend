import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, Mail, Phone, CreditCard } from "lucide-react";

export default function Footer() {
  const navigate = useNavigate();

  const footerSections = [
    { title: "Company", links: ["About Us", "Careers", "Blog", "Press"] },
    { title: "Customer Service", links: ["Help Center", "Returns", "Shipping Info", "FAQs"] },
    { title: "Policies", links: ["Privacy Policy", "Terms of Service", "Security", "Cookie Policy"] },
  ];

  const categoriesList = ["Fruits", "Vegetables", "Dairy", "Snacks", "Bakery", "Beverages"];

  return (
    <footer className="bg-gray-900 text-white mt-8 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-1">
            <div className="cursor-pointer" onClick={() => navigate("/")}>
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-16 w-auto object-contain"
              />
            </div>
            <p className="text-gray-400 text-xs leading-relaxed mt-3">
              Fresh groceries delivered to your doorstep. Quality guaranteed since 2024.
            </p>
            <div className="flex gap-2 mt-3">
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors text-sm">
                f
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors text-sm">
                in
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors text-sm">
                t
              </a>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-sm mb-3">{section.title}</h3>
              <ul className="space-y-1.5">
                {section.links.map((link) => (
                  <li key={link}>
                    <Link to="#" className="text-gray-400 text-xs hover:text-green-400 transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="font-semibold text-sm mb-3">Categories</h3>
            <ul className="space-y-1.5">
              {categoriesList.map((cat) => (
                <li key={cat}>
                  <button onClick={() => navigate(`/products?category=${cat.toLowerCase()}`)} className="text-gray-400 text-xs hover:text-green-400 transition-colors">
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-gray-400 text-xs hover:text-green-400 transition-colors">
                <MapPin className="w-3.5 h-3.5" /> 123 Fresh St, Food City
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-xs hover:text-green-400 transition-colors">
                <Mail className="w-3.5 h-3.5" /> hello@dailybasket.com
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-xs hover:text-green-400 transition-colors">
                <Phone className="w-3.5 h-3.5" /> +1 234 567 890
              </li>
            </ul>
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-500" />
                <span className="text-gray-500 text-xs">Secure Payments</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-6 pt-4 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-gray-500 text-xs">&copy; 2024 Daily Basket. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-gray-500 text-xs">Delivering to: India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}