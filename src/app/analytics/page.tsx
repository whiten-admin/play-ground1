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
import { useProjectContext } from '@/features/projects/contexts/ProjectContext'
import EmptyProjectState from '@/features/projects/components/EmptyProjectState'

// タブの種類を定義
type TabView = 'wbs' | 'analysis';

export default function WBSPage() {
  const { isAuthenticated, user, login, logout } = useAuth()
  const { filteredProjects, projects } = useProjectContext()
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

  // プロジェクト作成モーダルを開く処理
  const handleOpenCreateModal = () => {
    console.log('プロジェクト作成モーダルを開く')
  }

  if (!isAuthenticated) {
    return <Auth onLogin={login} />;
  }

  // ユーザーがアサインされているプロジェクトが存在しない場合は専用画面を表示
  if (filteredProjects.length === 0) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onLogout={logout} user={user} />
          <main className="flex-1 overflow-y-auto p-4">
            <EmptyProjectState 
              onCreateProject={handleOpenCreateModal} 
            />
          </main>
        </div>
      </div>
    );
  }

  return (
    <FilterProvider>
      <div className="flex h-screen bg-gray-100">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onLogout={logout} user={user} project={project} />
          <main className="flex-1 overflow-y-auto p-2">
            {/* タブコンテンツ */}
            <div className="bg-white rounded-lg shadow p-3">
              <ProjectAnalysisDashboard />
            </div>
          </main>
        </div>
      </div>
    </FilterProvider>
  );
}
