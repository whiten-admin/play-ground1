'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Task } from '@/features/tasks/types/task';
import { getProjectMemberName, getMemberWorkableHours, setMemberWorkableHours as saveMemberWorkableHours } from '@/utils/memberUtils';
import { BUSINESS_HOURS } from '@/utils/constants/constants';
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, isWithinInterval, getDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import '@/utils/chartConfig'; // Chart.jsの設定をインポート

interface TeamWorkloadChartProps {
  tasks: Task[];
}

type ViewMode = 'week' | 'month';

interface MemberWorkload {
  memberId: string;
  name: string;
  totalHours: number;
  workloadPercentage: number;
  workableHours: number;
}

interface UnassignedTodos {
  count: number;
  totalHours: number;
}

const TeamWorkloadChart: React.FC<TeamWorkloadChartProps> = ({ tasks }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showModal, setShowModal] = useState(false);
  // メンバーごとの稼働時間設定を管理するステート
  const [memberWorkableHours, setMemberWorkableHoursState] = useState<Record<string, number>>({});
  // メンバーごとの稼働時間設定を編集するためのステート
  const [editWorkableHours, setEditWorkableHours] = useState<Record<string, number>>({});

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
    
    // メンバーごとの負荷情報を作成
    const workloads: MemberWorkload[] = Object.entries(memberTodos).map(([memberId, hours]) => {
      // 各メンバーの1日あたりの稼働可能時間を取得
      const memberDailyHours = getMemberWorkableHours(memberId);
      
      // 期間中の合計稼働可能時間
      const totalWorkableHours = memberDailyHours * workableDays;
      
      return {
        memberId,
        name: getProjectMemberName(memberId),
        totalHours: hours,
        workloadPercentage: Math.round((hours / totalWorkableHours) * 100),
        workableHours: memberDailyHours
      };
    });
    
    // 負荷の高い順にソート
    return workloads.sort((a, b) => b.workloadPercentage - a.workloadPercentage);
  }, [tasks, periodStart, periodEnd, workableDays]);

  // グラフ用のデータを準備
  const chartData = useMemo<ChartData<'bar' | 'line'>>(() => {
    // 標準の1日あたりの稼働時間
    const defaultDailyHours = BUSINESS_HOURS.MAX_HOURS;
    
    // 標準の稼働可能時間（メンバー別設定がない場合のデフォルト）
    const defaultWorkableHours = defaultDailyHours * workableDays;
    
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
          label: '稼働可能時間（全員共通）',
          data: Array(labels.length).fill(defaultWorkableHours),
          borderColor: 'rgba(100, 100, 100, 0.7)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
          tension: 0
        },
        {
          type: 'line' as const,
          label: '稼働可能時間（個人設定）',
          data: memberWorkloads.map(member => member.workableHours * workableDays),
          borderColor: 'rgba(54, 162, 235, 0.7)',
          borderWidth: 2,
          pointRadius: 3,
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
          type: 'linear',
          beginAtZero: true,
          title: {
            display: true,
            text: '時間'
          }
        },
        x: {
          type: 'category',
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

  // 前の期間に移動
  const goToPreviousPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  // 次の期間に移動
  const goToNextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // モーダルを開く
  const openModal = () => {
    // 現在のメンバーごとの稼働時間設定を編集用にコピー
    const initialEditValues: Record<string, number> = {};
    memberWorkloads.forEach(member => {
      initialEditValues[member.memberId] = member.workableHours;
    });
    setEditWorkableHours(initialEditValues);
    setShowModal(true);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setShowModal(false);
  };

  // 稼働時間設定を保存
  const saveWorkableHours = () => {
    // 各メンバーの稼働時間設定を保存
    Object.entries(editWorkableHours).forEach(([memberId, hours]) => {
      saveMemberWorkableHours(memberId, hours);
    });
    
    // 状態も更新
    setMemberWorkableHoursState(editWorkableHours);
    
    // モーダルを閉じる
    closeModal();
  };

  // 個別メンバーの稼働時間設定を変更するハンドラー
  const handleWorkableHoursChange = (memberId: string, hours: number) => {
    setEditWorkableHours(prev => ({
      ...prev,
      [memberId]: hours
    }));
  };

  const getWorkloadColor = (percentage: number) => {
    if (percentage < 70) return 'bg-green-600';
    if (percentage < 100) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700">チームリソース状況</h2>
        
        <div className="flex items-center space-x-2">
          <div className="bg-white rounded-md shadow-sm">
            <button
              className={`px-3 py-1 text-sm rounded-l-md ${viewMode === 'week' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setViewMode('week')}
            >
              週次
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-r-md ${viewMode === 'month' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setViewMode('month')}
            >
              月次
            </button>
          </div>
          
          <div className="flex items-center">
            <button
              className="p-1 rounded-full hover:bg-gray-200"
              onClick={goToPreviousPeriod}
            >
              ◀
            </button>
            <span className="mx-2 text-sm font-medium">{periodLabel}</span>
            <button
              className="p-1 rounded-full hover:bg-gray-200"
              onClick={goToNextPeriod}
            >
              ▶
            </button>
          </div>
          
          {/* 設定アイコン */}
          <button
            onClick={openModal}
            className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-full"
            title="稼働時間設定"
          >
            ⚙️
          </button>
        </div>
      </div>
      
      {/* リソース概要 */}
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
      
      {/* 稼働時間設定モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">メンバー稼働時間設定</h3>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                各メンバーの1日あたりの稼働可能時間を設定します。設定しない場合はデフォルト値（{BUSINESS_HOURS.MAX_HOURS}時間）が適用されます。
              </p>
            </div>
            
            <div className="space-y-4">
              {memberWorkloads.map((member) => (
                <div key={member.memberId} className="flex items-center justify-between">
                  <div className="text-sm font-medium">{member.name}</div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={editWorkableHours[member.memberId] || member.workableHours}
                      onChange={(e) => handleWorkableHoursChange(member.memberId, parseFloat(e.target.value))}
                      className="border border-gray-300 rounded px-2 py-1 w-16 text-center"
                    />
                    <span className="text-sm text-gray-600">時間/日</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
              >
                キャンセル
              </button>
              <button
                onClick={saveWorkableHours}
                className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamWorkloadChart; 