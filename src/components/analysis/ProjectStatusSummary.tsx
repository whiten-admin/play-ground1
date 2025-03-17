'use client';

import React from 'react';

const ProjectStatusSummary: React.FC = () => {
  // サンプルデータ
  const projectData = {
    name: 'プロジェクトX',
    startDate: '2023-01-15',
    endDate: '2023-12-31',
    progress: 65,
    budget: {
      total: 10000000,
      spent: 6500000,
      remaining: 3500000
    },
    tasks: {
      total: 120,
      completed: 78,
      inProgress: 25,
      notStarted: 17
    },
    team: {
      members: 12,
      activeToday: 8
    }
  };

  // 日付をフォーマットする関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 予算を日本円表示にフォーマットする関数
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">プロジェクト状況サマリー</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {/* プロジェクト進捗 */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-1">全体進捗</h3>
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-600">{projectData.progress}%</div>
            <div className="ml-3 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${projectData.progress}%` }}
              ></div>
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-600">
            {formatDate(projectData.startDate)} 〜 {formatDate(projectData.endDate)}
          </div>
        </div>
        
        {/* タスク状況 */}
        <div className="bg-green-50 p-3 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-1">タスク状況</h3>
          <div className="text-2xl font-bold text-green-600">
            {projectData.tasks.completed} / {projectData.tasks.total}
          </div>
          <div className="mt-1 text-xs text-gray-600">
            <span className="inline-block mr-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              完了: {projectData.tasks.completed}
            </span>
            <span className="inline-block mr-2">
              <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
              進行中: {projectData.tasks.inProgress}
            </span>
            <span className="inline-block">
              <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
              未着手: {projectData.tasks.notStarted}
            </span>
          </div>
        </div>
        
        {/* 予算状況 */}
        <div className="bg-purple-50 p-3 rounded-lg">
          <h3 className="text-sm font-medium text-purple-800 mb-1">予算状況</h3>
          <div className="text-2xl font-bold text-purple-600">
            {Math.round((projectData.budget.spent / projectData.budget.total) * 100)}%
          </div>
          <div className="mt-1 text-xs text-gray-600">
            使用済み: {formatCurrency(projectData.budget.spent)}<br />
            残り: {formatCurrency(projectData.budget.remaining)}
          </div>
        </div>
        
        {/* チーム状況 */}
        <div className="bg-orange-50 p-3 rounded-lg">
          <h3 className="text-sm font-medium text-orange-800 mb-1">チーム状況</h3>
          <div className="text-2xl font-bold text-orange-600">
            {projectData.team.members}名
          </div>
          <div className="mt-1 text-xs text-gray-600">
            本日アクティブ: {projectData.team.activeToday}名
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectStatusSummary; 