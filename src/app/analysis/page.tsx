'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ProjectAnalysisDashboard from '@/components/analysis/ProjectAnalysisDashboard';
import Auth from '@/components/Auth';
import { useAuth } from '@/hooks/useAuth';
import { Project } from '@/types/project';

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

  if (!isAuthenticated) {
    return <Auth onLogin={login} />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={logout} project={project} user={user} />
        <main className="flex-1 overflow-y-auto p-3">
          <div className="bg-white rounded-lg shadow p-3">
            <p>※下記は開発中でハリボテです</p>
            <ProjectAnalysisDashboard />
          </div>
        </main>
      </div>
    </div>
  );
} 