'use client';

import { useState } from 'react';
import { IoCalendarOutline } from 'react-icons/io5';
import { useTaskContext } from '@/features/tasks/contexts/TaskContext';
import { scheduleAndSaveTasks } from '@/features/schedule/utils/taskScheduler';

interface ScheduleTodosButtonProps {
  onScheduleComplete?: () => void;
}

export default function ScheduleTodosButton({ onScheduleComplete }: ScheduleTodosButtonProps) {
  const { tasks, setTasks } = useTaskContext();
  const [isScheduling, setIsScheduling] = useState(false);

  const handleScheduleTodos = async () => {
    if (isScheduling) return;

    try {
      setIsScheduling(true);
      
      // 確認ダイアログを表示
      if (window.confirm('TODOを期日に基づいて自動スケジュールしますか？\n\n・各TODOの予定開始日時(plannedStartDate)を設定します\n・1日の最大工数は8時間です\n・変更は保存されます')) {
        // スケジュールを実行
        const updatedTasks = scheduleAndSaveTasks(tasks);
        
        // タスクを更新
        setTasks(updatedTasks);
        
        // 完了のコールバックを呼び出し
        if (onScheduleComplete) {
          onScheduleComplete();
        }
        
        // 成功メッセージ
        alert('TODOのスケジュールが完了しました。各TODOに開始予定時間が設定されました。');
      }
    } catch (error) {
      console.error('スケジュール処理中にエラーが発生しました:', error);
      alert(`スケジュール処理中にエラーが発生しました: ${error}`);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <button
      onClick={handleScheduleTodos}
      disabled={isScheduling}
      className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm ${
        isScheduling 
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      }`}
    >
      <IoCalendarOutline className="w-5 h-5" />
      <span>{isScheduling ? 'スケジューリング中...' : 'TODOを期日に沿ってスケジュール'}</span>
    </button>
  );
}
