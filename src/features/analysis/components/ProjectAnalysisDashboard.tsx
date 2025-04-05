'use client';

import React from 'react';
import TaskProgressChart from './TaskProgressChart';
import TeamPerformanceChart from './TeamPerformanceChart';
import ProjectStatusSummary from './ProjectStatusSummary';
import RiskAssessment from './RiskAssessment';
import TeamWorkloadChart from './TeamWorkloadChart';
import { useTaskContext } from '@/features/tasks/contexts/TaskContext';

const ProjectAnalysisDashboard: React.FC = () => {
  const { tasks } = useTaskContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* プロジェクト状況サマリー */}
      <div className="lg:col-span-3 bg-white p-2 rounded-lg shadow-sm">
        <ProjectStatusSummary />
      </div>
      
      {/* メンバー稼働状況 */}
      <div className="lg:col-span-3 bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-3">メンバーリソース状況</h2>
        <TeamWorkloadChart tasks={tasks} />
      </div>
      
      {/* タスク進捗チャート */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-3">タスク進捗状況</h2>
        <TaskProgressChart />
      </div>
      
      {/* チームパフォーマンスチャート */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-3">チームパフォーマンス</h2>
        <TeamPerformanceChart />
      </div>
      
      {/* リスク評価 */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-3">リスク評価</h2>
        <RiskAssessment />
      </div>
    </div>
  );
};

export default ProjectAnalysisDashboard; 