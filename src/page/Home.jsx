import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/auth";
import { ArrowIcon, ImageIcon, WriteIcon } from "../components/Icon";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20"></div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
              Generator{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                CMS
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-6 font-medium">
              Your all-in-one AI-powered content and image management platform
            </p>
            <p className="text-base text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              Transform your creative workflow with intelligent content
              rewriting, AI image generation, and seamless content organization.
              Create, edit, and manage everything in one modern, intuitive
              platform.
            </p>
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/register"
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all duration-200"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-2.5 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition-all duration-200 border border-gray-700"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-8 md:p-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
            What is Generator CMS?
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Content Management
              </h3>
              <p className="text-sm leading-relaxed">
                Leverage advanced AI to rewrite, enhance, and optimize your
                content. Our intelligent system helps you create engaging,
                well-structured content that resonates with your audience while
                maintaining your unique voice.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Image Generation
              </h3>
              <p className="text-sm leading-relaxed">
                Generate stunning, high-quality images powered by cutting-edge
                AI technology. Create custom visuals for your projects, manage
                your image library, and download your creations with ease.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isAuthenticated && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            Quick Actions
          </h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Link
              to="/content"
              className="group relative bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-lg p-5 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <WriteIcon style="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">
                    Generate Content
                  </h3>
                  <p className="text-xs text-gray-400">
                    AI-powered content generation
                  </p>
                </div>
                <ArrowIcon style="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              to="/image"
              className="group relative bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg p-5 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <ImageIcon style="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">
                    Generate Image
                  </h3>
                  <p className="text-xs text-gray-400">AI image generation</p>
                </div>
                <ArrowIcon style="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-5 text-center hover:border-indigo-500/50 transition-all duration-300">
            <div className="text-3xl mb-3">∞</div>
            <h3 className="text-white font-semibold text-base mb-2">
              Unlimited
            </h3>
            <p className="text-gray-400 text-sm">
              Create unlimited content and images
            </p>
          </div>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-5 text-center hover:border-purple-500/50 transition-all duration-300">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-white font-semibold text-base mb-2">
              Lightning Fast
            </h3>
            <p className="text-gray-400 text-sm">
              AI-powered generation in seconds
            </p>
          </div>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-5 text-center hover:border-pink-500/50 transition-all duration-300">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-white font-semibold text-base mb-2">
              Secure & Private
            </h3>
            <p className="text-gray-400 text-sm">
              Your data is safe and protected
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}