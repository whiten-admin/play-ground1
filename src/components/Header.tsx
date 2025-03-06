'use client'

import React from 'react'

interface HeaderProps {
  onLogout?: () => void
}

export default function Header({ onLogout }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">青い銀行大改修PJ</h1>
          <p className="text-sm text-gray-600">2024/1/1 - 2025/6/15</p>
        </div>
        <div className="text-red-600 font-semibold">
          PJ炎上リスク：50%
        </div>
        <div className="flex items-center space-x-4">
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ログアウト
            </button>
          )}
        </div>
      </div>
    </header>
  )
} 