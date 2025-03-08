'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import TaskDetail from '@/components/TaskDetail'
import TodayTodo from '@/components/TodayTodo'
import AdditionalTask from '@/components/AdditionalTask'
import ProjectDetail from '@/components/ProjectDetail'
import WeeklySchedule from '@/components/WeeklySchedule'
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
      title: 'プロジェクトMTG',
      description: 'プロジェクトの進捗確認と今後の方針について討議します。\n主な議題：\n1. 現在の進捗状況\n2. リスクの確認\n3. 次週の作業計画',
      todos: [
        { id: '1-1', text: '議事録の作成', completed: false },
        { id: '1-2', text: '参加者への資料共有', completed: false },
        { id: '1-3', text: '次回MTGの日程調整', completed: false }
      ],
      isNew: true
    },
    {
      id: '2',
      title: '要件定義',
      description: 'システムの要件定義を行います。\n機能要件と非機能要件を明確化し、ステークホルダーと合意を取ります。',
      todos: [
        { id: '2-1', text: '機能要件の洗い出し', completed: true },
        { id: '2-2', text: '非機能要件の定義', completed: false },
        { id: '2-3', text: 'ステークホルダーとの合意', completed: false }
      ],
      isNew: true
    },
    {
      id: '3',
      title: '要件定義書の作成',
      description: '要件定義書のドラフトを作成します。\n必要な図表やユースケースも含めて文書化します。',
      todos: [
        { id: '3-1', text: '目次の作成', completed: false },
        { id: '3-2', text: 'ユースケース図の作成', completed: false },
        { id: '3-3', text: 'レビュー依頼', completed: false }
      ]
    }
  ]

  // WeeklyScheduleのイベントをTaskDetailで表示するための関数
  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId)
  }

  if (!isAuthenticated) {
    return <Auth onLogin={login} />
  }

  // 選択されたタスクを取得
  const selectedTask = selectedTaskId
    ? tasks.find(task => task.id === selectedTaskId) || null
    : null

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-36 flex-shrink-0">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={logout} />
        <main className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-3">
              <div className="text-sm">
                <TaskDetail selectedTask={selectedTask} />
              </div>
              <div className="text-sm">
                <AdditionalTask />
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-sm">
                <TodayTodo
                  tasks={tasks}
                  selectedTaskId={selectedTaskId}
                  onTaskSelect={setSelectedTaskId}
                />
              </div>
              <div className="text-sm">
                <WeeklySchedule onTaskSelect={handleTaskSelect} />
              </div>
              <div className="text-sm">
                <ProjectDetail />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 