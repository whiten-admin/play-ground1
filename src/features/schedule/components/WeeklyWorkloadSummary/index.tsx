'use client';

import React, { useMemo } from 'react';
import { WorkloadSummaryByPeriod } from '../../types/schedule';
import { getWeekKey, formatHours } from '../../utils/workloadUtils';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface WeeklyWorkloadSummaryProps {
  workloadData: WorkloadSummaryByPeriod;
  currentDate: Date;
}

export default function WeeklyWorkloadSummary({ 
  workloadData, 
  currentDate 
}: WeeklyWorkloadSummaryProps) {
  // 週の最大工数（7日 x 8時間）
  const weekMaxHours = 7 * 8;
  
  // 週のキーを取得
  const weekKey = useMemo(() => getWeekKey(currentDate), [currentDate]);
  
  // 週の工数データを取得
  const weekData = useMemo(() => 
    workloadData.weekly.get(weekKey) || {
      externalHours: 0,
      internalHours: 0,
      bufferHours: 0,
      freeHours: 0,
      totalHours: 0
    }, 
  [workloadData, weekKey]);
  
  // 日付範囲のラベルを生成
  const weekDateRange = useMemo(() => {
    return {
      label: `${format(startOfWeek(currentDate, { locale: ja }), 'M/d')} 〜 ${format(endOfWeek(currentDate, { locale: ja }), 'M/d')}`,
      start: startOfWeek(currentDate, { locale: ja }),
      end: endOfWeek(currentDate, { locale: ja })
    };
  }, [currentDate]);
  
  // 各工数タイプの合計を計算
  const totals = {
    external: weekData.externalHours,
    internal: weekData.internalHours,
    buffer: weekData.bufferHours,
    free: weekData.freeHours,
    total: weekData.totalHours
  };
  
  // 各工数タイプの割合を計算
  const calculatePercentage = (value: number) => {
    if (weekMaxHours <= 0) return 0;
    return Math.round((value / weekMaxHours) * 100);
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-3">
      <h4 className="text-sm font-bold mb-2">週間工数合計 ({weekDateRange.label})</h4>
      <table className="w-full text-sm">
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="py-1.5 pr-2 flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
              外部予定
            </td>
            <td className="py-1.5 text-right font-medium">{formatHours(totals.external)}</td>
            <td className="py-1.5 pl-2 text-right text-gray-500 w-14">{calculatePercentage(totals.external)}%</td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="py-1.5 pr-2 flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              内部TODO
            </td>
            <td className="py-1.5 text-right font-medium">{formatHours(totals.internal)}</td>
            <td className="py-1.5 pl-2 text-right text-gray-500 w-14">{calculatePercentage(totals.internal)}%</td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="py-1.5 pr-2 flex items-center">
              <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
              バッファ
            </td>
            <td className="py-1.5 text-right font-medium">{formatHours(totals.buffer)}</td>
            <td className="py-1.5 pl-2 text-right text-gray-500 w-14">{calculatePercentage(totals.buffer)}%</td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="py-1.5 pr-2 flex items-center">
              <div className="w-2 h-2 rounded-full bg-gray-200 mr-2"></div>
              空き時間
            </td>
            <td className="py-1.5 text-right font-medium">{formatHours(totals.free)}</td>
            <td className="py-1.5 pl-2 text-right text-gray-500 w-14">{calculatePercentage(totals.free)}%</td>
          </tr>
          <tr className="border-t border-gray-200 font-medium">
            <td className="pt-2 pr-2">合計</td>
            <td className="pt-2 text-right">{formatHours(totals.total)}</td>
            <td className="pt-2 pl-2 text-right w-14">{calculatePercentage(totals.total)}%</td>
          </tr>
          <tr className="text-gray-500">
            <td className="pt-1 pr-2">最大</td>
            <td className="pt-1 text-right">{formatHours(weekMaxHours)}</td>
            <td className="pt-1 pl-2 text-right w-14">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
} 