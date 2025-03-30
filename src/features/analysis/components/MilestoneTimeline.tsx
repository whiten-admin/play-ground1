'use client';

import React from 'react';

interface Milestone {
  id: number;
  title: string;
  date: string;
  status: 'completed' | 'current' | 'upcoming';
  description: string;
}

const MilestoneTimeline: React.FC = () => {
  // サンプルデータ
  const milestones: Milestone[] = [
    {
      id: 1,
      title: '要件定義完了',
      date: '2023-02-15',
      status: 'completed',
      description: 'プロジェクトの要件定義が完了し、承認されました。'
    },
    {
      id: 2,
      title: '設計フェーズ完了',
      date: '2023-04-30',
      status: 'completed',
      description: 'システム設計が完了し、開発チームに引き継がれました。'
    },
    {
      id: 3,
      title: '開発フェーズ50%',
      date: '2023-07-15',
      status: 'current',
      description: '開発作業が予定通り進行中。主要機能の実装が50%完了。'
    },
    {
      id: 4,
      title: '開発フェーズ完了',
      date: '2023-09-30',
      status: 'upcoming',
      description: '全ての開発作業が完了し、テストフェーズへ移行予定。'
    },
    {
      id: 5,
      title: 'テスト完了',
      date: '2023-11-15',
      status: 'upcoming',
      description: '全てのテストが完了し、本番環境への展開準備が整います。'
    },
    {
      id: 6,
      title: 'リリース',
      date: '2023-12-01',
      status: 'upcoming',
      description: 'システムが本番環境にリリースされます。'
    }
  ];

  // 日付をフォーマットする関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // ステータスに応じたスタイルを返す関数
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          dot: 'bg-green-500',
          line: 'border-green-500',
          text: 'text-green-700',
          bg: 'bg-green-50'
        };
      case 'current':
        return {
          dot: 'bg-blue-500',
          line: 'border-blue-500',
          text: 'text-blue-700',
          bg: 'bg-blue-50'
        };
      case 'upcoming':
        return {
          dot: 'bg-gray-300',
          line: 'border-gray-300',
          text: 'text-gray-700',
          bg: 'bg-gray-50'
        };
      default:
        return {
          dot: 'bg-gray-300',
          line: 'border-gray-300',
          text: 'text-gray-700',
          bg: 'bg-gray-50'
        };
    }
  };

  return (
    <div className="relative">
      {milestones.map((milestone, index) => {
        const style = getStatusStyle(milestone.status);
        const isLast = index === milestones.length - 1;
        
        return (
          <div key={milestone.id} className="relative pl-8 pb-8">
            {/* タイムラインの縦線 */}
            {!isLast && (
              <div className={`absolute top-0 left-3 w-0.5 h-full ${style.line} border-l-2`}></div>
            )}
            
            {/* マイルストーンのドット */}
            <div className={`absolute top-0 left-0 w-6 h-6 rounded-full ${style.dot} flex items-center justify-center`}>
              {milestone.status === 'completed' && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
              )}
            </div>
            
            {/* マイルストーンの内容 */}
            <div className={`${style.bg} p-4 rounded-lg border border-gray-200`}>
              <div className="flex justify-between items-center mb-2">
                <h3 className={`font-semibold ${style.text}`}>{milestone.title}</h3>
                <span className="text-sm text-gray-500">{formatDate(milestone.date)}</span>
              </div>
              <p className="text-sm text-gray-600">{milestone.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MilestoneTimeline; 