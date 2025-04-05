'use client';

import React, { useState, useMemo } from 'react';
import { Task } from '@/features/tasks/types/task';
import { getProjectMemberName } from '@/utils/memberUtils';
import { BUSINESS_HOURS } from '@/utils/constants/constants';
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, isWithinInterval, getDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

// Chart.jsの必要なコンポーネントを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TeamWorkloadChartProps {
  tasks: Task[];
}

type ViewMode = 'week' | 'month';

interface MemberWorkload {
  memberId: string;
  name: string;
  totalHours: number;
  workloadPercentage: number;
}

interface UnassignedTodos {
  count: number;
  totalHours: number;
}

const TeamWorkloadChart: React.FC<TeamWorkloadChartProps> = ({ tasks }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showModal, setShowModal] = useState(false);

  // 期間の開始日と終了日を計算
  const { periodStart, periodEnd, periodLabel } = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { locale: ja });
      const end = endOfWeek(currentDate, { locale: ja });
      return {
        periodStart: start,
        periodEnd: end,
        periodLabel: `${format(start, 'yyyy年MM月dd日')} 〜 ${format(end, 'yyyy年MM月dd日')}`
      };
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return {
        periodStart: start,
        periodEnd: end,
        periodLabel: format(currentDate, 'yyyy年MM月')
      };
    }
  }, [currentDate, viewMode]);

  // 稼働可能日の計算（土日を除く）
  const workableDays = useMemo(() => {
    let days = 0;
    let currentDay = periodStart;
    
    while (currentDay <= periodEnd) {
      const dayOfWeek = getDay(currentDay);
      // 0が日曜、6が土曜
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days++;
      }
      currentDay = addDays(currentDay, 1);
    }
    
    return days;
  }, [periodStart, periodEnd]);

  // メンバーごとの作業負荷を計算
  const memberWorkloads = useMemo(() => {
    // メンバーIDごとにTODOを集計
    const memberTodos: Record<string, number> = {};
    
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
            if (!memberTodos[assigneeId]) {
              memberTodos[assigneeId] = 0;
            }
            memberTodos[assigneeId] += todo.estimatedHours;
          }
        }
      });
    });
    
    // 1人あたりの1日の稼働時間（デフォルト8時間）
    const dailyHours = BUSINESS_HOURS.MAX_HOURS;
    
    // 期間中の合計稼働可能時間
    const totalWorkableHours = dailyHours * workableDays;
    
    // メンバーごとの負荷情報を作成
    const workloads: MemberWorkload[] = Object.entries(memberTodos).map(([memberId, hours]) => {
      return {
        memberId,
        name: getProjectMemberName(memberId),
        totalHours: hours,
        workloadPercentage: Math.round((hours / totalWorkableHours) * 100)
      };
    });
    
    // 負荷の高い順にソート
    return workloads.sort((a, b) => b.workloadPercentage - a.workloadPercentage);
  }, [tasks, periodStart, periodEnd, workableDays]);

  // グラフ用のデータを準備
  const chartData = useMemo<ChartData<'bar' | 'line'>>(() => {
    // 1人あたりの1日の稼働時間
    const dailyHours = BUSINESS_HOURS.MAX_HOURS;
    
    // 期間中の合計稼働可能時間
    const totalWorkableHours = dailyHours * workableDays;
    
    const labels = memberWorkloads.map(member => member.name);
    
    return {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: 'アサイン済み時間',
          data: memberWorkloads.map(member => member.totalHours),
          backgroundColor: memberWorkloads.map(member => {
            const percentage = member.workloadPercentage;
            if (percentage < 70) return 'rgba(75, 192, 192, 0.8)'; // 緑
            if (percentage < 100) return 'rgba(255, 206, 86, 0.8)'; // 黄
            return 'rgba(255, 99, 132, 0.8)'; // 赤
          }),
          borderColor: memberWorkloads.map(member => {
            const percentage = member.workloadPercentage;
            if (percentage < 70) return 'rgb(75, 192, 192)';
            if (percentage < 100) return 'rgb(255, 206, 86)';
            return 'rgb(255, 99, 132)';
          }),
          borderWidth: 1,
        },
        {
          type: 'line' as const,
          label: '稼働可能時間',
          data: Array(labels.length).fill(totalWorkableHours),
          borderColor: 'rgba(100, 100, 100, 0.7)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
          tension: 0
        }
      ]
    };
  }, [memberWorkloads, workableDays]);

  // グラフのオプション設定
  const chartOptions = useMemo<ChartOptions<'bar' | 'line'>>(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '時間'
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const datasetLabel = context.dataset.label || '';
              const value = context.parsed.y;
              
              if (context.dataset.type === 'bar') {
                const index = context.dataIndex;
                const percentage = memberWorkloads[index].workloadPercentage;
                return `${datasetLabel}: ${value}時間 (負荷率: ${percentage}%)`;
              }
              
              return `${datasetLabel}: ${value}時間`;
            }
          }
        }
      }
    };
  }, [memberWorkloads]);

  // 未アサインのTODOを計算
  const unassignedTodos = useMemo(() => {
    let count = 0;
    let totalHours = 0;
    
    tasks.forEach(task => {
      task.todos.forEach(todo => {
        // 完了していないTODOかつ未アサインかつ期間内のものだけ集計
        if (!todo.completed && 
            !todo.assigneeId && 
            isWithinInterval(todo.calendarStartDateTime, {
              start: periodStart,
              end: periodEnd
            })) {
          count++;
          totalHours += todo.estimatedHours;
        }
      });
    });
    
    return {
      count,
      totalHours
    };
  }, [tasks, periodStart, periodEnd]);

  // メンバー全体の空きリソースと未アサインTODOの負荷率を計算
  const teamResourceStats = useMemo(() => {
    const dailyHours = BUSINESS_HOURS.MAX_HOURS;
    const totalWorkableHours = dailyHours * workableDays;
    
    // メンバー数
    const memberCount = memberWorkloads.length;
    
    // チーム全体の総稼働可能時間
    const teamTotalWorkableHours = totalWorkableHours * memberCount;
    
    // チーム全体のアサイン済み時間
    const teamAssignedHours = memberWorkloads.reduce((sum, member) => sum + member.totalHours, 0);
    
    // チーム全体の空き時間
    const teamAvailableHours = Math.max(0, teamTotalWorkableHours - teamAssignedHours);
    
    // 未アサインTODOをチームの空きリソースに割り当てた場合の負荷率
    const unassignedWorkloadPercentage = teamAvailableHours > 0 
      ? Math.round((unassignedTodos.totalHours / teamAvailableHours) * 100)
      : 100;
    
    return {
      teamTotalWorkableHours,
      teamAssignedHours,
      teamAvailableHours,
      unassignedWorkloadPercentage
    };
  }, [memberWorkloads, workableDays, unassignedTodos.totalHours]);

  // 前の期間へ移動
  const goToPreviousPeriod = () => {
    if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() - 1);
      setCurrentDate(newDate);
    }
  };

  // 次の期間へ移動
  const goToNextPeriod = () => {
    if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() + 1);
      setCurrentDate(newDate);
    }
  };

  // 負荷率に基づいた色を返す関数
  const getWorkloadColor = (percentage: number) => {
    if (percentage < 70) return 'bg-green-500';
    if (percentage < 100) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // 負荷分散ボタンのクリックハンドラー
  const handleBalanceWorkload = () => {
    setShowModal(true);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === 'week' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            週単位
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === 'month' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            月単位
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousPeriod}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            ←
          </button>
          <span className="text-sm font-medium">{periodLabel}</span>
          <button
            onClick={goToNextPeriod}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            →
          </button>
        </div>
      </div>
      
      {memberWorkloads.length === 0 && unassignedTodos.count === 0 ? (
        <div className="text-center py-10 text-gray-500">
          この期間にTODOがありません
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-700">メンバー別負荷</h3>
            {unassignedTodos.count > 0 && memberWorkloads.length > 0 && (
              <button 
                onClick={handleBalanceWorkload}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                負荷分散
              </button>
            )}
          </div>
          {memberWorkloads.length === 0 ? (
            <div className="text-center py-5 text-gray-500 mb-4">
              この期間にアサインされたTODOがありません
            </div>
          ) : (
            <div className="mb-6">
              {/* グラフ表示 */}
              <div className="bg-white p-4 rounded-lg shadow-sm" style={{ height: '300px' }}>
                <Chart type="bar" data={chartData} options={chartOptions} />
              </div>
              
              {/* 負荷率サマリー */}
              <div className="mt-3 flex flex-wrap gap-2 justify-center">
                {memberWorkloads.map((workload) => (
                  <div key={workload.memberId} className="flex items-center bg-white px-3 py-1.5 rounded-md shadow-sm">
                    <span className="font-medium text-sm">{workload.name}:</span>
                    <span className="ml-1 text-sm text-gray-600">{workload.totalHours}時間</span>
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-medium bg-opacity-80 text-white ${getWorkloadColor(workload.workloadPercentage)}`}>
                      {workload.workloadPercentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 未アサインTODO情報 */}
          <div className="bg-orange-50 p-4 rounded-lg shadow-sm mt-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-700">未アサインTODO</h3>
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <span className="font-medium">{unassignedTodos.count}</span> 件
                  <span className="mx-1">・</span>
                  <span className="font-medium">{unassignedTodos.totalHours}</span> 時間
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 開発中モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="text-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-semibold mt-2">機能開発中</h3>
            </div>
            <p className="text-gray-600 mb-6">
              負荷分散機能は現在開発中です。この機能は未アサインのTODOをチームメンバーの空きリソースに応じて最適に分散するもので、近日中にリリース予定です。
            </p>
            <div className="flex justify-center">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamWorkloadChart; 