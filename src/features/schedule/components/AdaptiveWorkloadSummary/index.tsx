'use client';

import React from 'react';
import { WorkloadSummaryByPeriod, ViewMode } from '../../types/schedule';
import DailyWorkloadSummary from '../DailyWorkloadSummary';
import WeeklyWorkloadSummary from '../WeeklyWorkloadSummary';
import MonthlyWorkloadSummary from '../MonthlyWorkloadSummary';

interface AdaptiveWorkloadSummaryProps {
  workloadData: WorkloadSummaryByPeriod;
  currentDate: Date;
  viewMode: ViewMode; // カレンダーの表示モード（'day' | 'week' | 'month'）
}

export default function AdaptiveWorkloadSummary({
  workloadData,
  currentDate,
  viewMode
}: AdaptiveWorkloadSummaryProps) {
  // 表示モードに応じて適切なコンポーネントを表示
  switch (viewMode) {
    case 'day':
      return (
        <DailyWorkloadSummary
          workloadData={workloadData}
          currentDate={currentDate}
        />
      );
    case 'week':
      return (
        <WeeklyWorkloadSummary
          workloadData={workloadData}
          currentDate={currentDate}
        />
      );
    case 'month':
      return (
        <MonthlyWorkloadSummary
          workloadData={workloadData}
          currentDate={currentDate}
        />
      );
    default:
      // デフォルトは週間表示
      return (
        <WeeklyWorkloadSummary
          workloadData={workloadData}
          currentDate={currentDate}
        />
      );
  }
} 