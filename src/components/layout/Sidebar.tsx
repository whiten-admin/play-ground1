'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const pathname = usePathname()
  
  const tabs = [
    { id: 'todo', label: 'やること', icon: '📝', href: '/' },
    { id: 'tasks', label: 'タスク一覧', icon: '📋', href: '/tasks' },
    { id: 'wbs', label: 'WBS', icon: '📊', href: '/wbs' },
    { id: 'analysis', label: 'PJ分析', icon: '📈', href: '/analysis' },
    { id: 'settings', label: '設定', icon: '⚙️', href: '/settings' },
    { id: 'guide', label: '使い方', icon: '🎓', href: '/guide' },
  ]

  return (
    <div className="bg-white shadow-md p-4">
      <div className="space-y-2">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
} 