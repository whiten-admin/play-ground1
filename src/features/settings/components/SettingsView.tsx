'use client';

import React, { useState } from 'react';
import { FiUser, FiZap, FiLock, FiGlobe, FiUsers, FiCalendar, FiCreditCard, FiSettings, FiEdit, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import { useAuth } from '@/services/auth/hooks/useAuth';

// タブの種類を定義
type TabType = 'account' | 'calendar' | 'ai' | 'connection' | 'other';

const SettingsView = () => {
  // アクティブなタブを状態として管理
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const { user } = useAuth();
  
  // パスワード変更用の状態
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');

  // タブを切り替える関数
  const changeTab = (tab: TabType) => {
    setActiveTab(tab);
  };

  // タブの定義
  const tabs = [
    { id: 'account', label: 'アカウント設定', icon: <FiUser className="w-5 h-5" /> },
    { id: 'calendar', label: 'カレンダー設定', icon: <FiCalendar className="w-5 h-5" /> },
    { id: 'ai', label: 'AI設定', icon: <FiZap className="w-5 h-5" /> },
    { id: 'connection', label: '外部連携', icon: <FiGlobe className="w-5 h-5" /> },
    { id: 'other', label: 'その他', icon: <FiSettings className="w-5 h-5" /> },
  ];

  // パスワード変更を処理する関数
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    // パスワードバリデーション
    if (newPassword.length < 8) {
      setPasswordChangeError('新しいパスワードは8文字以上必要です');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordChangeError('パスワードが一致しません');
      return;
    }
    
    // ここで実際のパスワード変更APIを呼び出す予定
    // デモ用にモック処理を実装
    setTimeout(() => {
      setPasswordChangeSuccess(true);
      setPasswordChangeError('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // 成功メッセージを3秒後に消す
      setTimeout(() => {
        setPasswordChangeSuccess(false);
      }, 3000);
    }, 500);
  };

  // アカウント設定タブの内容
  const renderAccountSettings = () => {
    return (
      <div className="p-6">
        {/* ユーザー情報 */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">アカウント情報</h3>
          <div className="bg-gray-50 p-4 rounded-lg flex items-start">
            {/* アバター画像（仮） */}
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center text-blue-600 text-xl font-bold mr-4">
              {user?.name.charAt(0)}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-medium">{user?.name}</h4>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                  {user?.role === 'manager' ? '管理者' : 'メンバー'}
                </span>
              </div>
              <p className="text-gray-600 text-sm mt-1">ユーザーID: {user?.id}</p>
              <button className="mt-2 text-sm flex items-center text-blue-600 hover:text-blue-800">
                <FiEdit className="w-4 h-4 mr-1" />
                プロフィールを編集
              </button>
            </div>
          </div>
        </div>
        
        {/* パスワード変更フォーム */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">パスワード変更</h3>
          
          {passwordChangeSuccess && (
            <div className="bg-green-50 text-green-800 p-3 rounded-md mb-4 flex items-center">
              <FiCheck className="w-5 h-5 mr-2" />
              パスワードが正常に変更されました
            </div>
          )}
          
          {passwordChangeError && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4">
              {passwordChangeError}
            </div>
          )}
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* 現在のパスワード */}
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
                現在のパスワード
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showCurrentPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {/* 新しいパスワード */}
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                新しいパスワード
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showNewPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">パスワードは8文字以上必要です</p>
            </div>
            
            {/* パスワード確認 */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワードの確認
              </label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                パスワードを変更する
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // タブコンテンツをレンダリングする関数
  const renderTabContent = () => {
    if (activeTab === 'account') {
      return renderAccountSettings();
    }
    
    // それ以外のタブは「開発中」表示
    return (
      <div className="bg-white p-8">
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