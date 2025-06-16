'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-[#f5f7fa] to-[#e9ecf3] shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between h-16 items-center gap-2 sm:gap-0">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-extrabold text-[#635bff] tracking-tight">Shelfo</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 border border-[#635bff] text-base font-medium rounded-lg text-[#635bff] bg-white hover:bg-[#f5f7fa] transition-all duration-150 w-full sm:w-auto"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-4 py-2 border border-[#635bff] text-base font-semibold rounded-lg text-white bg-[#635bff] hover:bg-[#4f46e5] shadow-sm transition-all duration-150 w-full sm:w-auto"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-8 mx-auto max-w-7xl px-2 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Manage your inventory</span>
                  <span className="block text-[#635bff]">with ease</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Shelfo helps small business owners track stock entries and sales effortlessly. 
                  No technical skills required, optimized for mobile-first use.
                </p>
                <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row sm:justify-center lg:justify-start gap-3 sm:gap-0">
                  <div className="rounded-md shadow">
                    <Link
                      href="/signup"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#635bff] hover:bg-[#4f46e5] md:py-4 md:text-lg md:px-10"
                    >
                      Get started
                    </Link>
                  </div>
                  <div className="sm:mt-0 sm:ml-3">
                    <Link
                      href="/login"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-[#635bff] bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                    >
                      Sign in
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-8 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-[#635bff] font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-2xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to manage your inventory
            </p>
          </div>

          <div className="mt-8 sm:mt-10">
            <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {[
                {
                  title: 'Real-time Stock Tracking',
                  description: 'Monitor your inventory levels in real-time with an easy-to-use interface.',
                },
                {
                  title: 'Sales Tracking',
                  description: 'Record sales and automatically update stock levels with each transaction.',
                },
                {
                  title: 'Weekly Reports',
                  description: 'Get comprehensive reports showing items sold, stock added, and low-stock alerts.',
                },
                {
                  title: 'Mobile First',
                  description: 'Access your inventory from anywhere, optimized for mobile devices.',
                },
              ].map((feature) => (
                <div key={feature.title} className="relative flex flex-col sm:flex-row items-start sm:items-center">
                  <div className="absolute sm:static flex items-center justify-center h-12 w-12 rounded-md bg-[#635bff] text-white">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="ml-16 sm:ml-16">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{feature.title}</h3>
                    <p className="mt-2 text-base text-gray-500">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <Link href="/login" className="text-gray-400 hover:text-gray-500">
              Sign in
            </Link>
            <Link href="/signup" className="text-gray-400 hover:text-gray-500">
              Sign up
            </Link>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">
              &copy; 2024 Shelfo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
