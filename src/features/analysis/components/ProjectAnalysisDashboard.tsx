'use client';

import React from 'react';
import TaskProgressChart from './TaskProgressChart';
import TeamPerformanceChart from './TeamPerformanceChart';
import ProjectStatusSummary from './ProjectStatusSummary';
import MilestoneTimeline from './MilestoneTimeline';
import RiskAssessment from './RiskAssessment';

const ProjectAnalysisDashboard: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* プロジェクト状況サマリー */}
      <div className="lg:col-span-3 bg-white p-2 rounded-lg shadow-sm">
        <ProjectStatusSummary />
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
      
      {/* マイルストーンタイムライン */}
      <div className="lg:col-span-3 bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-3">マイルストーンタイムライン</h2>
        <MilestoneTimeline />
      </div>
    </div>
  );
};

export default ProjectAnalysisDashboard; 