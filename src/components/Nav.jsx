import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth";

export default function Nav({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const { isAuthenticated, name: userName, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">G</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Generator CMS
            </h1>
          </Link>

          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/content"
                className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 transition-colors"
              >
                Content
              </Link>
              <Link
                to="/image"
                className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 transition-colors"
              >
                Image
              </Link>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="cursor-pointer px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold text-sm">
                      {userName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-200">{userName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:opacity-90 transition-opacity duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}