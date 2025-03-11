'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import WBSView from '@/components/WBSView'
import Auth from '@/components/Auth'
import { useAuth } from '@/hooks/useAuth'
import { Project } from '@/types/project'

export default function WBSPage() {
  const { isAuthenticated, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('wbs')
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

  if (!isAuthenticated) {
    return <Auth onLogin={login} />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={logout} project={project} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h1 className="text-2xl font-bold">
                WBS（Work Breakdown Structure）
              </h1>
            </div>
            <WBSView />
          </div>
        </main>
      </div>
    </div>
  );
}
