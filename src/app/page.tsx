'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import TaskDetail from '@/components/TaskDetail'
import TodayTodo from '@/components/TodayTodo'
import AdditionalTask from '@/components/AdditionalTask'
import ProjectDetail from '@/components/ProjectDetail'
import Auth from '@/components/Auth'
import { useAuth } from '@/hooks/useAuth'

interface Task {
  id: string
  title: string
  description: string
  todos: { id: string; text: string; completed: boolean }[]
  isNew?: boolean
}

export default function Home() {
  const { isAuthenticated, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('todo')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const tasks: Task[] = [
    {
      id: '1',
      title: '要件定義書の作成',
      description: 'プロジェクトの要件を詳細に定義し、ドキュメント化します。',
      todos: [
        { id: '1-1', text: '基本要件の洗い出し', completed: true },
        { id: '1-2', text: 'ユーザーストーリーの作成', completed: false },
        { id: '1-3', text: '要件定義書のレビュー', completed: false },
      ],
      isNew: true,
    },
    {
      id: '2',
      title: '設計書の作成',
      description: 'システムの詳細設計を行い、技術仕様書を作成します。',
      todos: [
        { id: '2-1', text: 'システム構成図の作成', completed: false },
        { id: '2-2', text: 'データベース設計', completed: false },
        { id: '2-3', text: 'API設計', completed: false },
      ],
      isNew: true,
    },
    {
      id: '3',
      title: '開発環境のセットアップ',
      description: '開発に必要な環境を整備します。',
      todos: [
        { id: '3-1', text: 'GitHubリポジトリの作成', completed: true },
        { id: '3-2', text: 'CI/CD環境の構築', completed: false },
        { id: '3-3', text: '開発マシンの環境設定', completed: false },
      ],
    },
  ]

  const selectedTask = tasks.find(task => task.id === selectedTaskId) || null

  if (!isAuthenticated) {
    return <Auth onLogin={login} />
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={logout} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <TaskDetail selectedTask={selectedTask} />
              <TodayTodo
                tasks={tasks}
                selectedTaskId={selectedTaskId}
                onTaskSelect={setSelectedTaskId}
              />
            </div>
            <div className="space-y-6">
              <AdditionalTask />
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">週間スケジュール</h2>
                <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
                  <p className="text-gray-500">カレンダー表示予定</p>
                </div>
              </div>
              <ProjectDetail />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 