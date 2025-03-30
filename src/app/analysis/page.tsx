'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ProjectAnalysisDashboard from '@/features/analysis/components/ProjectAnalysisDashboard';
import Auth from '@/services/auth/components/Auth';
import { useAuth } from '@/services/auth/hooks/useAuth';
import { Project } from '@/features/projects/types/project';
import ProjectDetail from '@/features/projects/components/ProjectDetail';
import { FilterProvider } from '@/features/tasks/filters/FilterContext';

export default function AnalysisPage() {
  const { isAuthenticated, user, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('analysis');
  const [project, setProject] = useState<Project>({
    id: '1',
    title: 'プロジェクトA',
    description: 'プロジェクトの説明文がここに入ります。',
    startDate: '2025-03-01',
    endDate: '2025-12-31',
    phase: 'development',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // プロジェクト更新処理
  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject);
  };

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
          <main className="flex-1 overflow-y-auto p-3">
            <div className="bg-white rounded-lg shadow p-3">
              <p>※下記は開発中でハリボテです</p>
              <ProjectAnalysisDashboard />
            </div>
          </main>
        </div>
      </div>
    </FilterProvider>
  );
} 