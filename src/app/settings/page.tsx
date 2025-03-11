'use client';

import React, { useState } from 'react';
import SettingsView from '@/components/SettingsView';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Project } from '@/types/project';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('settings');
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

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header project={project} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <SettingsView />
        </main>
      </div>
    </div>
  );
};

export default SettingsPage; 