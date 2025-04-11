'use client';

import { useMemo, useState } from 'react';
import { Task } from '../types/task';
import { IoChevronDown, IoChevronUp, IoAlertCircle, IoCheckmarkCircle, IoTimerOutline } from 'react-icons/io5';

interface ProjectProgressSummaryProps {
  tasks: Task[];
}

export default function ProjectProgressSummary({ tasks }: ProjectProgressSummaryProps) {
  const [showProgressSummary, setShowProgressSummary] = useState<boolean>(true);

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
        projectStatus: 'normal' as 'normal' | 'warning' | 'danger' | 'good',
        todoCount: 0,
        completedTodoCount: 0,
        delayedTodoCount: 0
      };
    }

    let totalEstimatedHours = 0;
    let completedHours = 0;
    let delayedHours = 0;
    let todoCount = 0;
    let completedTodoCount = 0;
    let delayedTodoCount = 0;
    
    const now = new Date();
    
    tasks.forEach(task => {
      task.todos.forEach(todo => {
        todoCount++;
        const estimatedHours = todo.estimatedHours || 0;
        totalEstimatedHours += estimatedHours;
        
        if (todo.completed) {
          completedTodoCount++;
          completedHours += estimatedHours;
          
          // 遅延のチェック（完了日が予定終了日より後の場合）
          if (todo.completedDateTime && todo.calendarEndDateTime) {
            const completedDate = new Date(todo.completedDateTime);
            const plannedEndDate = new Date(todo.calendarEndDateTime);
            
            if (completedDate > plannedEndDate) {
              // 遅延時間を計算（日単位で簡略化）
              const delayTime = Math.ceil((completedDate.getTime() - plannedEndDate.getTime()) / (1000 * 60 * 60 * 24)) * 8; // 1日8時間で計算
              delayedHours += delayTime;
              delayedTodoCount++;
            }
          }
        } else {
          // 未完了タスクの遅延チェック（現在日が予定終了日より後の場合）
          if (todo.calendarEndDateTime) {
            const plannedEndDate = new Date(todo.calendarEndDateTime);
            
            if (now > plannedEndDate) {
              // 遅延時間を計算（日単位で簡略化）
              const delayTime = Math.ceil((now.getTime() - plannedEndDate.getTime()) / (1000 * 60 * 60 * 24)) * 8; // 1日8時間で計算
              delayedHours += delayTime;
              delayedTodoCount++;
            }
          }
        }
      });
    });
    
    // 進捗率 = 完了工数 / 総工数
    const progressRate = totalEstimatedHours > 0 
      ? Math.round((completedHours / totalEstimatedHours) * 100) 
      : 0;
    
    // 遅延率 = 遅延時間 / 総工数
    const delayRate = totalEstimatedHours > 0 
      ? Math.round((delayedHours / totalEstimatedHours) * 100) 
      : 0;
    
    // バッファ時間（簡略化：総工数の20%をバッファとする）
    const baseBuffer = totalEstimatedHours * 0.2;
    const remainingBufferHours = Math.max(0, baseBuffer - delayedHours);
    
    // プロジェクト状態の判定
    let projectStatus: 'normal' | 'warning' | 'danger' | 'good' = 'normal';
    
    if (delayRate > 25) {
      projectStatus = 'danger'; // 危険：遅延が大きい
    } else if (delayRate > 10 || remainingBufferHours === 0) {
      projectStatus = 'warning'; // 警告：軽度の遅延または残りバッファなし
    } else if (progressRate >= 80 && delayRate < 5) {
      projectStatus = 'good'; // 良好：高進捗かつ低遅延
    }
    
    return {
      totalEstimatedHours,
      completedHours,
      progressRate,
      delayedHours,
      delayRate,
      remainingBufferHours,
      projectStatus,
      todoCount,
      completedTodoCount,
      delayedTodoCount
    };
  }, [tasks]);

  // 進捗サマリーコンポーネント
  const ProgressSummary = () => (
    <div className="bg-white p-4 mb-4 border rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold">プロジェクト進捗状況</h3>
        <button 
          onClick={() => setShowProgressSummary(false)} 
          className="text-gray-500 hover:text-gray-700"
        >
          <IoChevronUp size={20} />
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {/* 進捗率 */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm text-gray-600 mb-1">進捗率</h4>
          <div className="flex items-center">
            <div className="relative w-16 h-16 mr-3">
              <svg className="w-16 h-16 -rotate-90">
                <circle
                  className="text-gray-200"
                  strokeWidth="5"
                  stroke="currentColor"
                  fill="transparent"
                  r="30"
                  cx="32"
                  cy="32"
                />
                <circle
                  className="text-blue-500"
                  strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - progressSummary.progressRate / 100)}`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="30"
                  cx="32"
                  cy="32"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">{progressSummary.progressRate}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm">完了: {progressSummary.completedHours.toFixed(1)}h</p>
              <p className="text-sm">全体: {progressSummary.totalEstimatedHours.toFixed(1)}h</p>
              <p className="text-xs text-gray-500 mt-1">
                {progressSummary.completedTodoCount}/{progressSummary.todoCount} TODOs完了
              </p>
            </div>
          </div>
        </div>
        
        {/* 遅延状況 */}
        <div className="p-3 bg-orange-50 rounded-lg">
          <h4 className="text-sm text-gray-600 mb-1">遅延状況</h4>
          <div className="flex items-center">
            <div className="relative w-16 h-16 mr-3 flex items-center justify-center">
              <div className={`text-2xl font-bold ${progressSummary.delayRate > 10 ? 'text-red-500' : 'text-orange-500'}`}>
                {progressSummary.delayRate}%
              </div>
            </div>
            <div>
              <p className="text-sm">遅延: {progressSummary.delayedHours.toFixed(1)}h</p>
              <p className="text-sm">影響度: {progressSummary.delayRate > 25 ? '大' : progressSummary.delayRate > 10 ? '中' : '小'}</p>
              <p className="text-xs text-gray-500 mt-1">
                {progressSummary.delayedTodoCount} TODOsが遅延中
              </p>
            </div>
          </div>
        </div>
        
        {/* バッファ時間 */}
        <div className="p-3 bg-green-50 rounded-lg">
          <h4 className="text-sm text-gray-600 mb-1">残りバッファ</h4>
          <div className="flex items-center">
            <div className="relative w-16 h-16 mr-3 flex items-center justify-center">
              <IoTimerOutline size={32} className={`${progressSummary.remainingBufferHours > 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
            <div>
              <p className="text-xl font-bold">{progressSummary.remainingBufferHours.toFixed(1)}h</p>
              <p className="text-xs text-gray-500 mt-1">
                {progressSummary.remainingBufferHours > 0 
                  ? '予定通りに進行中' 
                  : 'バッファを使い切りました'}
              </p>
            </div>
          </div>
        </div>
        
        {/* プロジェクト状態 */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm text-gray-600 mb-1">プロジェクト状態</h4>
          <div className="flex items-center">
            <div className="relative w-16 h-16 mr-3 flex items-center justify-center">
              {progressSummary.projectStatus === 'danger' && (
                <IoAlertCircle size={40} className="text-red-500" />
              )}
              {progressSummary.projectStatus === 'warning' && (
                <IoAlertCircle size={40} className="text-yellow-500" />
              )}
              {progressSummary.projectStatus === 'normal' && (
                <IoCheckmarkCircle size={40} className="text-blue-500" />
              )}
              {progressSummary.projectStatus === 'good' && (
                <IoCheckmarkCircle size={40} className="text-green-500" />
              )}
            </div>
            <div>
              <p className="text-lg font-bold">
                {progressSummary.projectStatus === 'danger' && '危険'}
                {progressSummary.projectStatus === 'warning' && '注意'}
                {progressSummary.projectStatus === 'normal' && '正常'}
                {progressSummary.projectStatus === 'good' && '良好'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {progressSummary.projectStatus === 'danger' && '遅延が大きく、対策が必要です'}
                {progressSummary.projectStatus === 'warning' && '軽度の遅延があります'}
                {progressSummary.projectStatus === 'normal' && '予定通りに進行中です'}
                {progressSummary.projectStatus === 'good' && '順調に進んでいます'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 折りたたまれた進捗サマリー
  const CollapsedProgressSummary = () => (
    <div 
      className="bg-white p-2 mb-4 border rounded-lg shadow-sm flex justify-between items-center cursor-pointer"
      onClick={() => setShowProgressSummary(true)}
    >
      <div className="flex items-center">
        <h3 className="text-md font-bold mr-3">プロジェクト進捗状況</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${
              progressSummary.projectStatus === 'danger' ? 'bg-red-500' :
              progressSummary.projectStatus === 'warning' ? 'bg-yellow-500' :
              progressSummary.projectStatus === 'good' ? 'bg-green-500' : 'bg-blue-500'
            } mr-1`}></div>
            <span className="text-sm">
              {progressSummary.projectStatus === 'danger' ? '危険' :
               progressSummary.projectStatus === 'warning' ? '注意' :
               progressSummary.projectStatus === 'good' ? '良好' : '正常'}
            </span>
          </div>
          <span className="text-sm">進捗: {progressSummary.progressRate}%</span>
          <span className="text-sm">遅延: {progressSummary.delayRate}%</span>
        </div>
      </div>
      <IoChevronDown size={20} className="text-gray-500" />
    </div>
  );

  return (
    <>
      {showProgressSummary ? <ProgressSummary /> : <CollapsedProgressSummary />}
    </>
  );
} 