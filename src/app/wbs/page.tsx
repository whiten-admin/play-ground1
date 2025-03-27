'use client'

import React, { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import WBSView from '@/components/WBSView'
import Auth from '@/components/Auth'
import { useAuth } from '@/hooks/useAuth'
import { Project } from '@/types/project'
import ProjectDetail from '@/components/ProjectDetail'
import { FilterProvider } from '@/contexts/FilterContext'
import { Task } from '@/types/task'
import { useTaskContext } from '@/contexts/TaskContext'

export default function WBSPage() {
  const { isAuthenticated, user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('wbs')
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
          <Header onLogout={logout} user={user} project={project} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="bg-white rounded-lg shadow">

              <WBSView 
                onTaskSelect={handleTaskSelect}
                onTaskCreate={handleTaskCreate}
                onTaskUpdate={handleTaskUpdate}
                projectId={project.id}
              />
            </div>
          </main>
        </div>
      </div>
    </FilterProvider>
  );
}
