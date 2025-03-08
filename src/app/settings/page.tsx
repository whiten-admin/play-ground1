'use client';

import React, { useState } from 'react';
import SettingsView from '@/components/SettingsView';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <SettingsView />
        </main>
      </div>
    </div>
  );
};

export default SettingsPage; 