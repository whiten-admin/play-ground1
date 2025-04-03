'use client';

import React from 'react';
import { FiUser, FiBell, FiLock, FiGlobe } from 'react-icons/fi';
import { useTaskContext } from '@/features/tasks/contexts/TaskContext';

// シンプルなカードコンポーネント
const SettingsCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">{title}</h2>
    {children}
  </div>
);

const SettingsView = () => {
  const { resetTasks, resetTasksWithSchedule } = useTaskContext();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">設定</h1>
          <div className="w-16 h-1 bg-blue-500 mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* アカウント設定 */}
          <div>
            <SettingsCard title="アカウント設定">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-gray-100 rounded-full">
                  <FiUser className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-gray-600 ml-4">プロフィール情報の管理と更新</p>
              </div>
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded transition-colors">
                編集する
              </button>
            </SettingsCard>
          </div>

          {/* 通知設定 */}
          <div>
            <SettingsCard title="通知設定">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-gray-100 rounded-full">
                  <FiBell className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-gray-600 ml-4">通知の受信設定と管理</p>
              </div>
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded transition-colors">
                設定する
              </button>
            </SettingsCard>
          </div>

          {/* セキュリティ */}
          <div>
            <SettingsCard title="セキュリティ">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-gray-100 rounded-full">
                  <FiLock className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-gray-600 ml-4">パスワードとセキュリティ設定</p>
              </div>
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded transition-colors">
                変更する
              </button>
            </SettingsCard>
          </div>

          {/* 言語と地域 */}
          <div>
            <SettingsCard title="言語と地域">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-gray-100 rounded-full">
                  <FiGlobe className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-gray-600 ml-4">表示言語と地域設定</p>
              </div>
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded transition-colors">
                設定する
              </button>
            </SettingsCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;