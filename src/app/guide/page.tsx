'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import GuideView from '@/features/guide/components/GuideView';
import Auth from '@/services/auth/components/Auth';
import { useAuth } from '@/services/auth/hooks/useAuth';
import { Project } from '@/features/projects/types/project';
import ProjectDetail from '@/features/projects/components/ProjectDetail';
import { FilterProvider } from '@/features/tasks/filters/FilterContext';

export default function GuidePage() {
  const { isAuthenticated, user, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('guide');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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

  // サイドバーの状態を監視
  useEffect(() => {
    const checkSidebarState = () => {
      const collapsed = document.documentElement.getAttribute('data-sidebar-collapsed') === 'true';
      setIsSidebarCollapsed(collapsed);
    };
    
    // 初期状態をチェック
    checkSidebarState();
    
    // データ属性の変更を監視
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-sidebar-collapsed') {
          checkSidebarState();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);

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
          <div className={`p-2 ${isSidebarCollapsed ? 'w-16' : 'w-48'}`}>
            <ProjectDetail 
              project={project} 
              onUpdate={handleProjectUpdate} 
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onLogout={logout} user={user} />
          <main className="flex-1 overflow-y-auto p-4">
            <GuideView />
          </main>
        </div>
      </div>
    </FilterProvider>
  );
} 