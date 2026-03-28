import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company */}
          <div>
            <h3 className="text-lg font-bold text-primary mb-4">MATCHMETER</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              The ultimate sports tournament management platform.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/tournaments" className="text-gray-600 hover:text-primary dark:text-gray-400 text-sm">
                  Tournaments
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-600 hover:text-primary dark:text-gray-400 text-sm">
                  Features
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-600 hover:text-primary dark:text-gray-400 text-sm">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-primary dark:text-gray-400 text-sm">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary dark:text-gray-400 text-sm">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary dark:text-gray-400 text-sm">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Follow Us</h4>
            <div className="flex gap-4">
              <a href="#" className="text-gray-600 hover:text-primary dark:text-gray-400">
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12H6V9h3zm0 10H6V19h3zm5 0h-3v-3h3zm0-7h-3v-3h3zm-5-7H6V2h3zm5 0h-3V2h3z" />
                </svg>
              </a>
              <a href="#" className="text-gray-600 hover:text-primary dark:text-gray-400">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12H6V9h3zm0 10H6V19h3zm5 0h-3v-3h3zm0-7h-3v-3h3zm-5-7H6V2h3zm5 0h-3V2h3z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
            © {currentYear} MATCHMETER. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
