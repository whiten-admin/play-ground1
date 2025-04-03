'use client';

import React, { useState } from 'react';
import { FiUser, FiBell, FiLock, FiGlobe, FiUsers, FiCalendar, FiCreditCard, FiSettings } from 'react-icons/fi';

// タブの種類を定義
type TabType = 'account' | 'team' | 'calendar' | 'payment' | 'other';

const SettingsView = () => {
  // アクティブなタブを状態として管理
  const [activeTab, setActiveTab] = useState<TabType>('account');

  // タブを切り替える関数
  const changeTab = (tab: TabType) => {
    setActiveTab(tab);
  };

  // タブの定義
  const tabs = [
    { id: 'account', label: 'アカウント設定', icon: <FiUser className="w-5 h-5" /> },
    { id: 'team', label: 'チーム設定', icon: <FiUsers className="w-5 h-5" /> },
    { id: 'calendar', label: 'カレンダー設定', icon: <FiCalendar className="w-5 h-5" /> },
    { id: 'payment', label: '支払い設定', icon: <FiCreditCard className="w-5 h-5" /> },
    { id: 'other', label: 'その他', icon: <FiSettings className="w-5 h-5" /> },
  ];

  // タブコンテンツをレンダリングする関数
  const renderTabContent = () => {
    // 現在開発中の表示
    return (
      <div className="bg-white rounded-lg shadow-md p-8 mt-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4">🚧</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{tabs.find(tab => tab.id === activeTab)?.label}は現在開発中です</h3>
          <p className="text-gray-600">この機能は近日公開予定です。今しばらくお待ちください。</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">設定</h1>
          <div className="w-16 h-1 bg-blue-500 mx-auto rounded-full"></div>
        </div>
        
        {/* タブナビゲーション */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex flex-wrap border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => changeTab(tab.id as TabType)}
                className={`flex items-center px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* タブコンテンツ */}
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;