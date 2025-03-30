'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IoChevronBack, IoChevronForward } from 'react-icons/io5'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  initialCollapsed?: boolean
}

export default function Sidebar({ activeTab, onTabChange, initialCollapsed = false }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  
  // ローカルストレージから開閉状態を読み込む
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed')
    if (savedState !== null) {
      setCollapsed(savedState === 'true')
    }
  }, [])

  // 開閉状態をローカルストレージに保存
  const toggleCollapsed = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
    
    // サイドバーの状態が変わったときにdata属性を変更
    document.documentElement.setAttribute('data-sidebar-collapsed', String(newState))
  }
  
  // マウント時に初期状態をHTMLに反映
  useEffect(() => {
    document.documentElement.setAttribute('data-sidebar-collapsed', String(collapsed))
    
    // アンマウント時にクリーンアップ
    return () => {
      document.documentElement.removeAttribute('data-sidebar-collapsed')
    }
  }, [])
  
  const tabs = [
    { id: 'todo', label: 'やること', icon: '📝', href: '/' },
    { id: 'tasks', label: 'タスク一覧', icon: '📋', href: '/tasks' },
    { id: 'wbs', label: 'WBS', icon: '📊', href: '/wbs' },
    { id: 'analysis', label: 'PJ分析', icon: '📈', href: '/analysis' },
    { id: 'settings', label: '設定', icon: '⚙️', href: '/settings' },
    { id: 'guide', label: '使い方', icon: '🎓', href: '/guide' },
  ]

  return (
    <div className={`relative bg-white shadow-md ${collapsed ? 'w-16' : 'w-48'}`}>
      {/* 開閉ボタン（右端に配置） */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-12 bg-white rounded-full shadow-md z-10 w-6 h-6 flex items-center justify-center"
        aria-label={collapsed ? "サイドバーを開く" : "サイドバーを閉じる"}
      >
        {collapsed ? <IoChevronForward size={12} /> : <IoChevronBack size={12} />}
      </button>

      <div className="p-4 flex flex-col h-full">
        <div className="space-y-2 mt-2">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-start space-x-3'} px-4 py-2 rounded-lg ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={collapsed ? tab.label : undefined}
            >
              <span className="flex-shrink-0">{tab.icon}</span>
              {!collapsed && <span className="truncate">{tab.label}</span>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
} 