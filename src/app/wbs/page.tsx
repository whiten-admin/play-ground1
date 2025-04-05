'use client'

import React, { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import WBSView from '@/features/wbs/components/WBSView'
import ProjectAnalysisDashboard from '@/features/analysis/components/ProjectAnalysisDashboard'
import Auth from '@/services/auth/components/Auth'
import { useAuth } from '@/services/auth/hooks/useAuth'
import { Project } from '@/features/projects/types/project'
import { FilterProvider } from '@/features/tasks/filters/FilterContext'
import { Task } from '@/features/tasks/types/task'
import { useTaskContext } from '@/features/tasks/contexts/TaskContext'

// タブの種類を定義
type TabView = 'wbs' | 'analysis';

export default function WBSPage() {
  const { isAuthenticated, user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('wbs')
  const [activeView, setActiveView] = useState<TabView>('wbs')
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')
  const { setTasks, addTask } = useTaskContext()
  const [project, setProject] = useState<Project>({
    id: '1',
    title: 'プロジェクトA',
    description: 'プロジェクトの説明文がここに入ります。',
    startDate: '2025-03-01',
    endDate: '2025-12-31',
    phase: 'development',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  // タブを切り替える関数
  const changeView = (view: TabView) => {
    setActiveView(view);
  };

  // タスク選択処理
  const handleTaskSelect = (taskId: string) => {
    console.log(`Task ${taskId} selected`)
  }

  // タスク作成処理
  const handleTaskCreate = (newTask: Task) => {
    console.log('Task created', newTask)
    // プロジェクトIDを設定
    if (!newTask.projectId && project) {
      newTask.projectId = project.id;
    }
    // TaskContextのaddTask関数を使用してタスクを追加
    addTask(newTask);
  }

  // タスク更新処理
  const handleTaskUpdate = (updatedTask: Task) => {
    console.log('WBS: handleTaskUpdate called with:', updatedTask);
    setTasks((prevTasks) => {
      const updated = prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task));
      console.log('WBS: tasks after update:', updated);
      return updated;
    });
  }

  // プロジェクト更新処理
  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject)
  }

  if (!isAuthenticated) {
    return <Auth onLogin={login} />;
  }

  return (
    <FilterProvider>
      <div className="flex h-screen bg-gray-100">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onLogout={logout} user={user} project={project} />
          <main className="flex-1 overflow-y-auto p-6">
            {/* タブナビゲーション */}
            <div className="flex mb-4 bg-white rounded-lg shadow-sm border-b">
              <button
                onClick={() => changeView('wbs')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeView === 'wbs'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                WBS
              </button>
              <button
                onClick={() => changeView('analysis')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeView === 'analysis'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                プロジェクト分析
              </button>
            </div>

            {/* タブコンテンツ */}
            <div className="bg-white rounded-lg shadow">
              {activeView === 'wbs' ? (
                <WBSView 
                  onTaskSelect={handleTaskSelect}
                  onTaskCreate={handleTaskCreate}
                  onTaskUpdate={handleTaskUpdate}
                  projectId={project.id}
                />
              ) : (
                <div className="p-3">
                  <ProjectAnalysisDashboard />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </FilterProvider>
  );
}
