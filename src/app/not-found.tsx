'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <div className="mb-6">
          <svg
            className="w-32 h-32 mx-auto"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* 体 */}
            <path
              d="M50 60C40 60 35 65 35 75C35 85 40 90 50 90C60 90 65 85 65 75C65 65 60 60 50 60Z"
              fill="#4B5563"
            />
            {/* 頭 */}
            <circle cx="50" cy="45" r="20" fill="#4B5563" />
            {/* 耳 */}
            <path
              d="M35 35L40 25L45 35"
              stroke="#4B5563"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M65 35L60 25L55 35"
              stroke="#4B5563"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* 目 */}
            <circle cx="45" cy="45" r="3" fill="white" />
            <circle cx="55" cy="45" r="3" fill="white" />
            {/* 鼻 */}
            <path
              d="M50 50L45 55L55 55L50 50Z"
              fill="#F87171"
            />
            {/* 口 */}
            <path
              d="M45 60C45 60 47 62 50 62C53 62 55 60 55 60"
              stroke="#4B5563"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* ひげ */}
            <path
              d="M45 55L35 55"
              stroke="#4B5563"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <path
              d="M45 57L35 57"
              stroke="#4B5563"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <path
              d="M45 59L35 59"
              stroke="#4B5563"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <path
              d="M55 55L65 55"
              stroke="#4B5563"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <path
              d="M55 57L65 57"
              stroke="#4B5563"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <path
              d="M55 59L65 59"
              stroke="#4B5563"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-6">お探しのページは見つかりませんでした。</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          トップページに戻る
        </Link>
      </div>
    </div>
  )
} 