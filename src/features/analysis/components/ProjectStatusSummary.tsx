'use client';

import React, { useMemo, useState } from 'react';
import { Task } from '@/features/tasks/types/task';
import { getMemberWorkableHours } from '@/utils/memberUtils';
import { BUSINESS_HOURS } from '@/utils/constants/constants';
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, isWithinInterval, getDay, differenceInDays, differenceInBusinessDays } from 'date-fns';
import { ja } from 'date-fns/locale';

type WorkloadPeriod = 'month' | 'project';

interface ProjectStatusSummaryProps {
  tasks: Task[];
  projectStartDate?: string; // プロジェクト開始日（デフォルトは現在日付から6ヶ月前）
  projectEndDate?: string;   // プロジェクト終了日（デフォルトは現在日付から6ヶ月後）
}

const ProjectStatusSummary: React.FC<ProjectStatusSummaryProps> = ({ 
  tasks, 
  projectStartDate = new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString(),
  projectEndDate = new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString()
}) => {
  // 全体負荷率の期間選択
  const [workloadPeriod, setWorkloadPeriod] = useState<WorkloadPeriod>('month');

  // 現在の日付
  const today = new Date();

  // プロジェクトの日付情報の計算
  const projectDates = useMemo(() => {
    const startDate = new Date(projectStartDate);
    const endDate = new Date(projectEndDate);
    
    // プロジェクト全体の日数
    const totalDays = differenceInDays(endDate, startDate);
    
    // 開始から現在までの日数
    const elapsedDays = differenceInDays(today, startDate);
    
    // 時間経過の割合（進捗予定）
    const timeProgressRate = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
    
    return {
      startDate,
      endDate,
      totalDays,
      elapsedDays,
      timeProgressRate
    };
  }, [projectStartDate, projectEndDate]);

  // タスクの進捗状況を計算
  const taskStats = useMemo(() => {
    const totalTasks = tasks.length;
    let completedTasks = 0;
    let totalEstimatedHours = 0;
    let completedEstimatedHours = 0;
    
    tasks.forEach(task => {
      const totalTodos = task.todos.length;
      let completedTodos = 0;
      
      task.todos.forEach(todo => {
        totalEstimatedHours += todo.estimatedHours;
        
        if (todo.completed) {
          completedTodos++;
          completedEstimatedHours += todo.estimatedHours;
        }
      });
      
      // タスクの完了率が100%ならタスク自体も完了と見なす
      if (totalTodos > 0 && completedTodos === totalTodos) {
        completedTasks++;
      }
    });
    
    // 進捗率（完了したタスクの割合）
    const taskProgressRate = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;
    
    // 時間ベースの進捗率（完了した工数の割合）
    const hoursProgressRate = totalEstimatedHours > 0 
      ? Math.round((completedEstimatedHours / totalEstimatedHours) * 100) 
      : 0;
    
    return {
      totalTasks,
      completedTasks,
      taskProgressRate,
      totalEstimatedHours,
      completedEstimatedHours,
      hoursProgressRate
    };
  }, [tasks]);

  // 遅延率の計算（時間経過率と進捗率の差）
  const delayRate = taskStats.hoursProgressRate - projectDates.timeProgressRate;

  // メンバーの負荷状況を計算
  const workloadStats = useMemo(() => {
    // 期間の計算
    const periodStart = new Date();
    let periodEnd: Date;
    
    if (workloadPeriod === 'month') {
      // 向こう1ヶ月間
      periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      // 納期まで
      periodEnd = new Date(projectEndDate);
    }
    
    // 稼働可能日の計算（土日を除く）
    let workableDays = 0;
    let currentDay = new Date(periodStart);
    
    while (currentDay <= periodEnd) {
      const dayOfWeek = getDay(currentDay);
      // 0が日曜、6が土曜
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workableDays++;
      }
      currentDay = addDays(currentDay, 1);
    }
    
    // メンバーIDごとにTODOを集計
    const memberTodos: Record<string, number> = {};
    const memberIds = new Set<string>();
    
    // 選択した期間内のTODOを抽出して合計時間を計算
    tasks.forEach(task => {
      task.todos.forEach(todo => {
        // 完了していないTODOかつ期間内のものだけ集計
        if (!todo.completed && isWithinInterval(todo.calendarStartDateTime, {
          start: periodStart,
          end: periodEnd
        })) {
          const assigneeId = todo.assigneeId;
          if (assigneeId) {
            memberIds.add(assigneeId);
            if (!memberTodos[assigneeId]) {
              memberTodos[assigneeId] = 0;
            }
            memberTodos[assigneeId] += todo.estimatedHours;
          }
        }
      });
    });
    
    // 総メンバー数
    const totalMembers = memberIds.size;
    
    // メンバー全体の総稼働可能時間
    let totalWorkableHours = 0;
    let totalAssignedHours = 0;
    
    // 各メンバーの稼働時間を合計
    memberIds.forEach(memberId => {
      // 各メンバーの1日あたりの稼働可能時間を取得
      const memberDailyHours = getMemberWorkableHours(memberId);
      
      // 期間中の合計稼働可能時間
      const memberWorkableHours = memberDailyHours * workableDays;
      totalWorkableHours += memberWorkableHours;
      
      // アサイン済み時間
      totalAssignedHours += memberTodos[memberId] || 0;
    });
    
    // 全体負荷率
    const workloadRate = totalWorkableHours > 0 
      ? Math.round((totalAssignedHours / totalWorkableHours) * 100) 
      : 0;
    
    return {
      totalMembers,
      workableDays,
      totalWorkableHours,
      totalAssignedHours,
      workloadRate,
      periodLabel: workloadPeriod === 'month' ? '向こう1ヶ月間' : '納期まで'
    };
  }, [tasks, workloadPeriod, projectEndDate]);

  // 日付をフォーマットする関数
  const formatDate = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 遅延率に基づく色とラベルを取得
  const getDelayStatusInfo = (delayRate: number) => {
    if (delayRate > 5) return { color: 'bg-green-500 text-white', label: '前倒し' };
    if (delayRate >= -5 && delayRate <= 5) return { color: 'bg-blue-500 text-white', label: '順調' };
    if (delayRate >= -15) return { color: 'bg-yellow-500 text-white', label: '若干遅延' };
    return { color: 'bg-red-500 text-white', label: '遅延' };
  };

  // 負荷率に基づく色を取得
  const getWorkloadColor = (workload: number) => {
    if (workload < 70) return 'text-green-600';
    if (workload < 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const delayStatus = getDelayStatusInfo(delayRate);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">プロジェクト状況サマリー</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
        {/* 全体進捗 */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-1">全体進捗</h3>
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-600">{taskStats.hoursProgressRate}%</div>
            <div className="ml-3 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${taskStats.hoursProgressRate}%` }}
              ></div>
            </div>
          </div>
          <div className="mt-3 text-sm">
            <div className="text-gray-600 mb-2 text-xs">
              {formatDate(projectDates.startDate)} 〜 {formatDate(projectDates.endDate)}
            </div>
            
            {/* 遂行ペース - より目立つデザイン */}
            <div className="bg-gray-100 p-2 rounded-md">
              <div className="font-medium text-gray-600 mb-1 text-xs">遂行ペース</div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-md font-medium ${delayStatus.color}`}>
                  {delayStatus.label}
                </span>
                <span className="text-base font-bold">
                  {delayRate > 0 ? '+' : ''}{delayRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 全体負荷率 */}
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-sm font-medium text-purple-800">全体負荷率</h3>
            
            {/* 期間選択スイッチ */}
            <div className="flex text-xs bg-white rounded-md overflow-hidden border border-purple-200">
              <button 
                className={`px-2 py-1 ${workloadPeriod === 'month' ? 'bg-purple-500 text-white' : 'text-purple-700'}`}
                onClick={() => setWorkloadPeriod('month')}
              >
                1ヶ月
              </button>
              <button 
                className={`px-2 py-1 ${workloadPeriod === 'project' ? 'bg-purple-500 text-white' : 'text-purple-700'}`}
                onClick={() => setWorkloadPeriod('project')}
              >
                納期まで
              </button>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className={`text-2xl font-bold ${getWorkloadColor(workloadStats.workloadRate)}`}>
              {workloadStats.workloadRate}%
            </div>
            <div className="ml-3 w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  workloadStats.workloadRate < 70 ? 'bg-green-500' : 
                  workloadStats.workloadRate < 100 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(workloadStats.workloadRate, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            <div className="mb-1">期間: {workloadStats.periodLabel}</div>
            <div>チームメンバー: {workloadStats.totalMembers}名</div>
            <div>タスク完了: {taskStats.completedTasks} / {taskStats.totalTasks}</div>
          </div>
        </div>
        
        {/* 将来追加予定の項目 */}
        <div className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300">
          <h3 className="text-sm font-medium text-gray-600 mb-1">その他指標</h3>
          <div className="text-center py-5">
            <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            <p className="mt-2 text-sm text-gray-500">
              今後追加予定の指標です
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectStatusSummary; 