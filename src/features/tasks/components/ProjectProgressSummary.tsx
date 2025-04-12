'use client';

import { useMemo, useState } from 'react';
import { Task } from '../types/task';
import { IoChevronDown, IoChevronUp, IoAlertCircle, IoCheckmarkCircle, IoTimerOutline, IoSearch, IoAnalytics } from 'react-icons/io5';
import Link from 'next/link';
import ProjectStatsModal from './ProjectStatsModal';

interface ProjectProgressSummaryProps {
  tasks: Task[];
}

type ModalType = 'progress' | 'delay' | 'buffer' | 'status' | null;

// Todo型に必要なプロパティを定義
type Todo = {
  id: string;
  text: string;
  completed: boolean;
  estimatedHours: number;
  startDate: Date;
  endDate: Date;
  completedDate?: Date;
};

export default function ProjectProgressSummary({ tasks }: ProjectProgressSummaryProps) {
  const [showProgressSummary, setShowProgressSummary] = useState<boolean>(true);
  const [modalType, setModalType] = useState<ModalType>(null);

  // プロジェクトの進捗状況を計算
  const progressSummary = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        totalEstimatedHours: 0,
        completedHours: 0,
        progressRate: 0,
        delayedHours: 0,
        delayRate: 0,
        remainingBufferHours: 0,
        bufferHours: 0, // 初期値を追加
        projectStatus: 'normal' as 'good' | 'normal' | 'warning' | 'danger',
        delayedTodos: [],
        completedTodos: []
      };
    }

    // すべてのTODOを集計
    const allTodos = tasks.flatMap(task => task.todos);
    
    // 総見積もり工数
    const totalEstimatedHours = allTodos.reduce((sum, todo) => sum + todo.estimatedHours, 0);
    
    // 完了したTODOの工数
    const completedTodos = allTodos.filter(todo => todo.completed);
    const completedHours = completedTodos.reduce((sum, todo) => sum + todo.estimatedHours, 0);
    
    // 進捗率
    const progressRate = totalEstimatedHours > 0 ? (completedHours / totalEstimatedHours) * 100 : 0;
    
    // 遅延しているTODOの抽出
    const now = new Date();
    const delayedTodos = allTodos.filter(todo => {
      if (todo.completed) return false;
      
      const endDate = new Date(todo.endDate);
      return endDate < now;
    });
    
    // 遅延時間の計算
    const delayedHours = delayedTodos.reduce((sum, todo) => {
      const endDate = new Date(todo.endDate);
      const delayInDays = Math.max(0, (now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
      // 1日あたりの作業時間を8時間と仮定
      return sum + delayInDays * 8;
    }, 0);
    
    // 遅延率
    const delayRate = totalEstimatedHours > 0 ? (delayedHours / totalEstimatedHours) * 100 : 0;
    
    // バッファ時間の計算（総見積もり工数の20%）
    const bufferHours = totalEstimatedHours * 0.2;
    const remainingBufferHours = Math.max(0, bufferHours - delayedHours);
    
    // プロジェクト状態の判定
    let projectStatus: 'good' | 'normal' | 'warning' | 'danger' = 'normal';
    
    if (delayRate >= 25 || (bufferHours > 0 && remainingBufferHours === 0)) {
      projectStatus = 'danger';
    } else if (delayRate >= 10 || (bufferHours > 0 && remainingBufferHours < bufferHours * 0.3)) {
      projectStatus = 'warning';
    } else if (progressRate >= 80 && delayRate < 5) {
      projectStatus = 'good';
    }
    
    return {
      totalEstimatedHours,
      completedHours,
      progressRate,
      delayedHours,
      delayRate,
      remainingBufferHours,
      bufferHours,
      projectStatus,
      delayedTodos,
      completedTodos
    };
  }, [tasks]);

  const handleModalOpen = (type: ModalType) => {
    setModalType(type);
  };

  const handleModalClose = () => {
    setModalType(null);
  };

  const getStatusIcon = () => {
    switch (progressSummary.projectStatus) {
      case 'good':
        return <IoCheckmarkCircle className="w-6 h-6 text-green-500" />;
      case 'warning':
        return <IoAlertCircle className="w-6 h-6 text-yellow-500" />;
      case 'danger':
        return <IoAlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <IoTimerOutline className="w-6 h-6 text-blue-500" />;
    }
  };

  const getStatusText = () => {
    switch (progressSummary.projectStatus) {
      case 'good':
        return '良好';
      case 'warning':
        return '注意';
      case 'danger':
        return '危険';
      default:
        return '正常';
    }
  };

  const getDelayLevel = () => {
    if (progressSummary.delayRate >= 20) return '大';
    if (progressSummary.delayRate >= 10) return '中';
    if (progressSummary.delayRate > 0) return '小';
    return 'なし';
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800">プロジェクト進捗状況</h2>
          <Link href="/wbs?tab=analysis" className="px-3 py-1 text-xs rounded flex items-center gap-1 bg-indigo-500 text-white hover:bg-indigo-600">
            <IoAnalytics className="w-3 h-3" />
            分析詳細
          </Link>
        </div>
        <button
          onClick={() => setShowProgressSummary(!showProgressSummary)}
          className="p-1 rounded hover:bg-gray-100"
        >
          {showProgressSummary ? <IoChevronUp /> : <IoChevronDown />}
        </button>
      </div>

      {showProgressSummary && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 進捗率 */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-gray-600">進捗率</h3>
              <button 
                className="p-1 rounded-full hover:bg-blue-100"
                onClick={() => handleModalOpen('progress')}
              >
                <IoSearch className="w-4 h-4 text-blue-500" />
              </button>
            </div>
            <div className="mt-2 flex items-center">
              <div className="relative h-16 w-16">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    className="stroke-current text-blue-100"
                    strokeWidth="2"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    className="stroke-current text-blue-500"
                    strokeWidth="2"
                    strokeDasharray="100"
                    strokeDashoffset={100 - progressSummary.progressRate}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className="text-xl font-bold text-blue-600">{Math.round(progressSummary.progressRate)}%</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm text-gray-600">
                  完了: {progressSummary.completedTodos.length}件
                </div>
                <div className="text-sm text-gray-600">
                  総見積: {Math.round(progressSummary.totalEstimatedHours)}時間
                </div>
              </div>
            </div>
          </div>

          {/* 遅延状況 */}
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-gray-600">遅延状況</h3>
              <button 
                className="p-1 rounded-full hover:bg-orange-100"
                onClick={() => handleModalOpen('delay')}
              >
                <IoSearch className="w-4 h-4 text-orange-500" />
              </button>
            </div>
            <div className="mt-2 flex items-center">
              <div className="relative h-16 w-16">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    className="stroke-current text-orange-100"
                    strokeWidth="2"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    className={`stroke-current ${
                      progressSummary.delayRate > 20 ? 'text-red-500' : 'text-orange-500'
                    }`}
                    strokeWidth="2"
                    strokeDasharray="100"
                    strokeDashoffset={100 - Math.min(100, progressSummary.delayRate * 2)}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className={`text-xl font-bold ${
                    progressSummary.delayRate > 20 ? 'text-red-600' : 'text-orange-600'
                  }`}>{Math.round(progressSummary.delayRate)}%</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm text-gray-600">
                  遅延: {progressSummary.delayedTodos.length}件
                </div>
                <div className="text-sm text-gray-600">
                  影響度: <span className={
                    getDelayLevel() === '大' ? 'text-red-500 font-bold' :
                    getDelayLevel() === '中' ? 'text-orange-500 font-bold' :
                    getDelayLevel() === '小' ? 'text-yellow-500 font-bold' :
                    'text-green-500'
                  }>{getDelayLevel()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* バッファ残量 */}
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-gray-600">残りバッファ</h3>
              <button 
                className="p-1 rounded-full hover:bg-green-100"
                onClick={() => handleModalOpen('buffer')}
              >
                <IoSearch className="w-4 h-4 text-green-500" />
              </button>
            </div>
            <div className="mt-2 flex items-center">
              <div className="relative h-16 w-16">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    className="stroke-current text-green-100"
                    strokeWidth="2"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    className={`stroke-current ${
                      progressSummary.bufferHours > 0 && progressSummary.remainingBufferHours === 0
                        ? 'text-red-500'
                        : 'text-green-500'
                    }`}
                    strokeWidth="2"
                    strokeDasharray="100"
                    strokeDashoffset={
                      progressSummary.bufferHours > 0
                        ? 100 - (progressSummary.remainingBufferHours / progressSummary.bufferHours) * 100
                        : 0
                    }
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className={`text-xl font-bold ${
                    progressSummary.bufferHours > 0 && progressSummary.remainingBufferHours === 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}>{Math.round(progressSummary.remainingBufferHours)}h</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm text-gray-600">
                  総バッファ: {Math.round(progressSummary.bufferHours)}時間
                </div>
                <div className="text-sm text-gray-600">
                  消費: {Math.round(progressSummary.bufferHours - progressSummary.remainingBufferHours)}時間
                </div>
              </div>
            </div>
          </div>

          {/* プロジェクト状態 */}
          <div className={`p-3 rounded-lg ${
            progressSummary.projectStatus === 'danger' ? 'bg-red-50' :
            progressSummary.projectStatus === 'warning' ? 'bg-yellow-50' :
            progressSummary.projectStatus === 'good' ? 'bg-green-50' :
            'bg-blue-50'
          }`}>
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-gray-600">プロジェクト状態</h3>
              <button 
                className={`p-1 rounded-full ${
                  progressSummary.projectStatus === 'danger' ? 'hover:bg-red-100' :
                  progressSummary.projectStatus === 'warning' ? 'hover:bg-yellow-100' :
                  progressSummary.projectStatus === 'good' ? 'hover:bg-green-100' :
                  'hover:bg-blue-100'
                }`}
                onClick={() => handleModalOpen('status')}
              >
                <IoSearch className={`w-4 h-4 ${
                  progressSummary.projectStatus === 'danger' ? 'text-red-500' :
                  progressSummary.projectStatus === 'warning' ? 'text-yellow-500' :
                  progressSummary.projectStatus === 'good' ? 'text-green-500' :
                  'text-blue-500'
                }`} />
              </button>
            </div>
            <div className="mt-2 flex items-center">
              <div className="w-16 h-16 flex items-center justify-center">
                {getStatusIcon()}
              </div>
              <div className="ml-4">
                <div className={`text-xl font-bold ${
                  progressSummary.projectStatus === 'danger' ? 'text-red-600' :
                  progressSummary.projectStatus === 'warning' ? 'text-yellow-600' :
                  progressSummary.projectStatus === 'good' ? 'text-green-600' :
                  'text-blue-600'
                }`}>
                  {getStatusText()}
                </div>
                <div className="text-sm text-gray-600">
                  {progressSummary.projectStatus === 'danger' ? '重大な遅延あり' :
                   progressSummary.projectStatus === 'warning' ? '軽度の遅延あり' :
                   progressSummary.projectStatus === 'good' ? '順調に進行中' :
                   '通常通り進行中'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* モーダル */}
      {modalType && (
        <ProjectStatsModal
          type={modalType}
          progressSummary={progressSummary}
          onClose={handleModalClose}
          tasks={tasks}
        />
      )}
    </div>
  );
} 