'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IoChevronBack, IoChevronForward, IoSettingsSharp, IoCloudUpload, IoCloudDownload } from 'react-icons/io5'
import { useTaskContext } from '@/features/tasks/contexts/TaskContext'
import { useProjectContext } from '@/features/projects/contexts/ProjectContext'
import { exportTasksAsJson, importTasksFromJson } from '@/services/storage/utils/seedDataUtils'
import { useAuth } from '@/services/auth/hooks/useAuth'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  initialCollapsed?: boolean
}

export default function Sidebar({ activeTab, onTabChange, initialCollapsed = false }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false)
  const { tasks, setTasks, resetTasks, clearAllTasks } = useTaskContext();
  const { resetToDefaultProjects, clearAllProjects } = useProjectContext();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    { id: 'wbs', label: 'WBS・分析', icon: '📊', href: '/wbs' },
    { id: 'project-info', label: 'PJ情報', icon: 'ℹ️', href: '/project-info' },
    { id: 'team-management', label: 'チーム管理', icon: '🧑‍🤝‍🧑', href: '/team-management' },
    { id: 'settings', label: '設定', icon: '⚙️', href: '/settings' },
    { id: 'guide', label: '使い方', icon: '🎓', href: '/guide' },
  ]

  // データをリセット（タスクとプロジェクト両方）
  const handleReset = () => {
    if (window.confirm('本当にタスクとプロジェクトのデータを初期状態にリセットしますか？この操作は元に戻せません。')) {
      resetTasks();
      resetToDefaultProjects();
      alert('タスクとプロジェクトのデータを初期状態にリセットしました');
    }
  };
  
  // データをすべてクリア（タスクとプロジェクト両方）
  const handleClearAll = () => {
    if (window.confirm('本当にすべてのタスクとプロジェクトのデータをクリアしますか？この操作は元に戻せません。')) {
      clearAllTasks();
      clearAllProjects();
      alert('すべてのタスクとプロジェクトのデータをクリアしました');
    }
  };
  
  // データをJSON形式でエクスポート
  const handleExport = () => {
    try {
      const jsonData = exportTasksAsJson(tasks);
      
      // ダウンロードリンクを作成
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasks_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      // クリーンアップ
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('データのエクスポートが完了しました');
    } catch (error) {
      alert('エクスポートに失敗しました');
    }
  };
  
  // ファイル選択ダイアログを開く
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };
  
  // ファイルからデータをインポート
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = event.target?.result as string;
        const importedTasks = importTasksFromJson(jsonData);
        
        if (!importedTasks) {
          alert('無効なデータ形式です');
          return;
        }
        
        setTasks(importedTasks);
        alert('ファイルからのインポートが完了しました');
      } catch (error) {
        alert('ファイルの読み込みに失敗しました');
      }
    };
    
    reader.readAsText(file);
  };

  // 管理者かどうかをチェック
  const isAdmin = user?.role === 'admin';

  return (
    <div className={`relative bg-white shadow-md flex flex-col h-full ${collapsed ? 'w-16' : 'w-48'}`}>
      {/* 開閉ボタン（右端に配置） */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-12 bg-white rounded-full shadow-md z-10 w-6 h-6 flex items-center justify-center"
        aria-label={collapsed ? "サイドバーを開く" : "サイドバーを閉じる"}
      >
        {collapsed ? <IoChevronForward size={12} /> : <IoChevronBack size={12} />}
      </button>

      <div className="p-4 flex flex-col flex-grow">
        <div className="space-y-2 mt-2">
          {tabs.filter(tab => tab.id !== 'guide').map((tab) => (
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
      
      {/* 使い方メニュー */}
      <div className="px-4 py-2">
        {tabs.filter(tab => tab.id === 'guide').map((tab) => (
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
      
      {/* 管理者設定メニュー */}
      {isAdmin && (
        <div className="mt-auto border-t border-gray-200 pt-2 pb-2 px-2">
          <Link
            href="/admin"
            onClick={() => onTabChange('admin')}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-start'} px-4 py-2 rounded-lg ${
              activeTab === 'admin'
                ? 'bg-purple-500 text-white'
                : 'text-purple-700 hover:bg-purple-100'
            }`}
            title={collapsed ? "管理者設定" : undefined}
          >
            <span className="flex-shrink-0">👑</span>
            {!collapsed && <span className="ml-3 truncate">管理者設定</span>}
          </Link>
        </div>
      )}
      
      {/* 開発用データ管理セクション */}
      <div className={`${isAdmin ? '' : 'mt-auto'} border-t border-gray-200 pt-2 pb-4 px-2`}>
        <div 
          className={`${collapsed ? 'justify-center' : 'justify-start px-2'} flex items-center cursor-pointer py-2 text-gray-500 hover:text-gray-700`}
          onClick={() => setIsDevMenuOpen(!isDevMenuOpen)}
          title={collapsed ? "開発用データ管理" : undefined}
        >
          <IoSettingsSharp className="w-5 h-5" />
          {!collapsed && <span className="ml-2 text-sm">開発用データ管理</span>}
        </div>
        
        {isDevMenuOpen && (
          <div className={`mt-2 space-y-2 ${collapsed ? 'absolute bottom-16 left-full ml-2 bg-white shadow-lg rounded p-3 w-48 z-20' : ''}`}>
            <button
              onClick={handleReset}
              className="w-full text-left text-xs px-2 py-1.5 text-red-600 hover:bg-red-50 rounded"
            >
              初期データにリセット
            </button>
            <button
              onClick={handleClearAll}
              className="w-full text-left text-xs px-2 py-1.5 text-red-600 hover:bg-red-50 rounded"
            >
              データを全てクリア
            </button>
            <button
              onClick={handleExport}
              className="w-full text-left text-xs px-2 py-1.5 text-blue-600 hover:bg-blue-50 rounded flex items-center"
            >
              <IoCloudDownload className="mr-1 w-3.5 h-3.5" />
              データをエクスポート
            </button>
            <button
              onClick={openFileDialog}
              className="w-full text-left text-xs px-2 py-1.5 text-green-600 hover:bg-green-50 rounded flex items-center"
            >
              <IoCloudUpload className="mr-1 w-3.5 h-3.5" />
              データをインポート
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json"
              onChange={handleFileImport}
            />
          </div>
        )}
      </div>
    </div>
  )
} 