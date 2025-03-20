'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import WBSView from '@/components/WBSView'
import Auth from '@/components/Auth'
import { useAuth } from '@/hooks/useAuth'
import { Project } from '@/types/project'
import ProjectDetail from '@/components/ProjectDetail'

export default function WBSPage() {
  const { isAuthenticated, user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('wbs')
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')
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

  // タスク選択処理
  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId)
  }

  // タスク作成処理
  const handleTaskCreate = (newTask: any) => {
    // WBSページでのタスク作成処理
    console.log('新しいタスクが作成されました:', newTask)
  }

  // プロジェクト更新処理
  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject)
  }

  if (!isAuthenticated) {
    return <Auth onLogin={login} />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-shrink-0 flex flex-col">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="p-2">
          <ProjectDetail 
            project={project} 
            onUpdate={handleProjectUpdate} 
          />
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={logout} project={project} user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h1 className="text-2xl font-bold">
                WBS（Work Breakdown Structure）
              </h1>
            </div>
            <WBSView 
              onTaskSelect={handleTaskSelect}
              onTaskCreate={handleTaskCreate}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
