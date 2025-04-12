'use client';

import { useEffect, useState } from 'react';
import { Task } from '../types/task';
import { IoClose } from 'react-icons/io5';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type ModalType = 'progress' | 'delay' | 'buffer' | 'status' | null;

interface ProjectStatsSummary {
  totalEstimatedHours: number;
  completedHours: number;
  progressRate: number;
  delayedHours: number;
  delayRate: number;
  remainingBufferHours: number;
  bufferHours: number;
  projectStatus: 'good' | 'normal' | 'warning' | 'danger';
  delayedTodos: any[];
  completedTodos: any[];
}

interface ProjectStatsModalProps {
  type: ModalType;
  progressSummary: ProjectStatsSummary;
  onClose: () => void;
  tasks: Task[];
}

export default function ProjectStatsModal({ type, progressSummary, onClose, tasks }: ProjectStatsModalProps) {
  const [chartData, setChartData] = useState<{ date: string; actual: number; ideal: number }[]>([]);

  useEffect(() => {
    if (type === 'progress') {
      generateBurndownData();
    }
  }, []);

  // バーンダウンチャートのデータ生成
  const generateBurndownData = () => {
    if (!tasks || tasks.length === 0) return;

    // プロジェクトの開始日と終了日を取得
    const allTodos = tasks.flatMap(task => task.todos);
    
    if (allTodos.length === 0) return;
    
    const startDates = allTodos.map(todo => new Date(todo.startDate).getTime());
    const endDates = allTodos.map(todo => new Date(todo.endDate).getTime());
    
    const projectStartDate = new Date(Math.min(...startDates));
    const projectEndDate = new Date(Math.max(...endDates));
    
    // 日付の差を計算
    const diffTime = Math.abs(projectEndDate.getTime() - projectStartDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 理想的な進捗ライン（一定の割合で減少）
    const data = [];
    const totalEstimatedHours = progressSummary.totalEstimatedHours;
    
    for (let i = 0; i <= diffDays; i++) {
      const currentDate = new Date(projectStartDate.getTime());
      currentDate.setDate(projectStartDate.getDate() + i);
      
      // 理想的な残りの工数（線形に減少）
      const idealRemaining = totalEstimatedHours - (totalEstimatedHours / diffDays) * i;
      
      // 実際の残りの工数（現在日付までの完了タスクを反映）
      const completedUntilDate = progressSummary.completedTodos.filter(todo => {
        const completedDate = new Date(todo.completedDate || new Date());
        return completedDate <= currentDate;
      });
      
      const completedHoursUntilDate = completedUntilDate.reduce((sum, todo) => sum + todo.estimatedHours, 0);
      const actualRemaining = totalEstimatedHours - completedHoursUntilDate;
      
      data.push({
        date: format(currentDate, 'MM/dd'),
        ideal: Math.round(idealRemaining * 10) / 10,
        actual: Math.round(actualRemaining * 10) / 10
      });
    }
    
    setChartData(data);
  };

  const getModalTitle = () => {
    switch (type) {
      case 'progress':
        return '進捗状況の詳細';
      case 'delay':
        return '遅延状況の詳細';
      case 'buffer':
        return 'バッファ状況の詳細';
      case 'status':
        return 'プロジェクト状態の詳細';
      default:
        return '';
    }
  };

  const getDelayReasons = () => {
    // 遅延の理由を簡易分析
    if (progressSummary.delayRate < 5) return '遅延は最小限に抑えられています';
    if (progressSummary.delayedTodos.length > progressSummary.completedTodos.length * 0.3) 
      return '完了タスクに比べて遅延タスクの割合が高くなっています';
    if (progressSummary.delayedHours > progressSummary.completedHours * 0.5)
      return '遅延による時間的影響が大きくなっています';
    return '一部のタスクに遅れが生じています';
  };

  const getRiskFactorsAndMeasures = () => {
    const factors = [];
    const measures = [];
    
    // リスク要因の分析
    if (progressSummary.delayRate > 20) {
      factors.push('多くのタスクが期限超過しています');
      measures.push('優先度の高い遅延タスクに集中的にリソースを投入');
    }
    
    if (progressSummary.bufferHours > 0 && progressSummary.remainingBufferHours === 0) {
      factors.push('バッファ時間が消費されています');
      measures.push('スコープの見直しまたは納期の再調整を検討');
    }
    
    if (progressSummary.progressRate < 30 && progressSummary.delayRate > 10) {
      factors.push('初期段階から遅延が発生しています');
      measures.push('計画の見直しと実現可能なスケジュールの再設定');
    }
    
    if (factors.length === 0) {
      factors.push('現在、深刻なリスク要因は見当たりません');
      measures.push('現状の進行状況を維持してプロジェクトを継続');
    }
    
    return { factors, measures };
  };

  const renderContent = () => {
    switch (type) {
      case 'progress':
        return (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">バーンダウンチャート</h3>
              <div className="bg-gray-50 p-4 rounded-lg h-64 relative">
                {chartData.length > 0 ? (
                  <div className="h-full">
                    <svg width="100%" height="100%" viewBox={`0 0 ${chartData.length * 50} 200`} preserveAspectRatio="none">
                      {/* Y軸 */}
                      <line x1="40" y1="10" x2="40" y2="180" stroke="#ccc" strokeWidth="1" />
                      {/* X軸 */}
                      <line x1="40" y1="180" x2={chartData.length * 50} y2="180" stroke="#ccc" strokeWidth="1" />
                      
                      {/* 理想線 */}
                      <polyline
                        points={chartData.map((point, i) => `${40 + i * 50},${10 + (180 - 10) * (1 - point.ideal / progressSummary.totalEstimatedHours)}`).join(' ')}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                      />
                      
                      {/* 実績線 */}
                      <polyline
                        points={chartData.map((point, i) => `${40 + i * 50},${10 + (180 - 10) * (1 - point.actual / progressSummary.totalEstimatedHours)}`).join(' ')}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                      />
                      
                      {/* X軸ラベル */}
                      {chartData.map((point, i) => (
                        <text
                          key={i}
                          x={40 + i * 50}
                          y="195"
                          textAnchor="middle"
                          fontSize="10"
                          fill="#666"
                        >
                          {point.date}
                        </text>
                      ))}
                      
                      {/* Y軸ラベル */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                        <text
                          key={i}
                          x="35"
                          y={10 + (180 - 10) * (1 - ratio)}
                          textAnchor="end"
                          fontSize="10"
                          dominantBaseline="middle"
                          fill="#666"
                        >
                          {Math.round(progressSummary.totalEstimatedHours * ratio)}h
                        </text>
                      ))}
                    </svg>
                    
                    <div className="absolute bottom-0 right-0 bg-white p-2 text-xs rounded border">
                      <div className="flex items-center">
                        <div className="w-3 h-1 bg-blue-500 mr-1"></div>
                        <span>理想進捗</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <div className="w-3 h-1 bg-red-500 mr-1"></div>
                        <span>実績進捗</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">データがありません</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="border rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">完了タスク</h4>
                <p className="text-xl font-bold">{progressSummary.completedTodos.length}件</p>
                <p className="text-sm text-gray-500">工数: {Math.round(progressSummary.completedHours)}時間</p>
              </div>
              <div className="border rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">残りタスク</h4>
                <p className="text-xl font-bold">{(tasks.flatMap(task => task.todos).length - progressSummary.completedTodos.length)}件</p>
                <p className="text-sm text-gray-500">工数: {Math.round(progressSummary.totalEstimatedHours - progressSummary.completedHours)}時間</p>
              </div>
            </div>
          </div>
        );
        
      case 'delay':
        return (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">遅延の概要</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="mb-2">遅延率: <span className="font-bold">{Math.round(progressSummary.delayRate)}%</span></p>
                <p className="mb-2">遅延時間: <span className="font-bold">{Math.round(progressSummary.delayedHours)}時間</span></p>
                <p className="mb-2">遅延理由: <span className="font-medium">{getDelayReasons()}</span></p>
              </div>
            </div>
            
            {progressSummary.delayedTodos.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">遅延しているTODO</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">タスク/TODO</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">予定終了日</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">遅延日数</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {progressSummary.delayedTodos.map((todo, index) => {
                        const parentTask = tasks.find(task => task.todos.some(t => t.id === todo.id));
                        const now = new Date();
                        const endDate = new Date(todo.endDate);
                        const delayInDays = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <tr key={index}>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900">{parentTask?.title}</div>
                              <div className="text-sm text-gray-500">{todo.text}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {format(new Date(todo.endDate), 'yyyy年M月d日', { locale: ja })}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex text-sm font-medium ${
                                delayInDays > 7 ? 'text-red-600' : delayInDays > 3 ? 'text-orange-600' : 'text-yellow-600'
                              }`}>
                                {delayInDays}日
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'buffer':
        return (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">バッファの状況</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">バッファ消費率</span>
                    <span className="text-sm font-medium">
                      {progressSummary.bufferHours > 0 
                        ? `${Math.round(((progressSummary.bufferHours - progressSummary.remainingBufferHours) / progressSummary.bufferHours) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        progressSummary.bufferHours > 0 && progressSummary.remainingBufferHours === 0
                          ? 'bg-red-500'
                          : progressSummary.bufferHours > 0 && progressSummary.remainingBufferHours < progressSummary.bufferHours * 0.3
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${progressSummary.bufferHours > 0 
                          ? ((progressSummary.bufferHours - progressSummary.remainingBufferHours) / progressSummary.bufferHours) * 100
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="border rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">総バッファ時間</h4>
                    <p className="text-xl font-bold">{Math.round(progressSummary.bufferHours)}時間</p>
                    <p className="text-sm text-gray-500">総見積もりの20%</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">残りバッファ</h4>
                    <p className={`text-xl font-bold ${progressSummary.remainingBufferHours === 0 ? 'text-red-600' : ''}`}>
                      {Math.round(progressSummary.remainingBufferHours)}時間
                    </p>
                    <p className="text-sm text-gray-500">
                      {progressSummary.remainingBufferHours === 0 ? 'バッファを使い切りました' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">バッファについて</h4>
                  <p className="text-sm text-yellow-700">
                    バッファは予期せぬ遅延に対応するための予備時間です。総見積もり工数の20%として計算されています。
                    バッファが消費されると、プロジェクトの完了が予定より遅れる可能性が高まります。
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'status':
        const { factors, measures } = getRiskFactorsAndMeasures();
        
        return (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">プロジェクト状態</h3>
              <div className={`p-4 rounded-lg ${
                progressSummary.projectStatus === 'danger' ? 'bg-red-50' :
                progressSummary.projectStatus === 'warning' ? 'bg-yellow-50' :
                progressSummary.projectStatus === 'good' ? 'bg-green-50' :
                'bg-blue-50'
              }`}>
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-full mr-3 ${
                    progressSummary.projectStatus === 'danger' ? 'bg-red-100' :
                    progressSummary.projectStatus === 'warning' ? 'bg-yellow-100' :
                    progressSummary.projectStatus === 'good' ? 'bg-green-100' :
                    'bg-blue-100'
                  }`}>
                    <div className={`text-2xl ${
                      progressSummary.projectStatus === 'danger' ? 'text-red-600' :
                      progressSummary.projectStatus === 'warning' ? 'text-yellow-600' :
                      progressSummary.projectStatus === 'good' ? 'text-green-600' :
                      'text-blue-600'
                    }`}>
                      {progressSummary.projectStatus === 'danger' ? '⚠️' :
                       progressSummary.projectStatus === 'warning' ? '⚠️' :
                       progressSummary.projectStatus === 'good' ? '✅' :
                       '🕒'}
                    </div>
                  </div>
                  <div>
                    <h4 className={`text-lg font-bold ${
                      progressSummary.projectStatus === 'danger' ? 'text-red-700' :
                      progressSummary.projectStatus === 'warning' ? 'text-yellow-700' :
                      progressSummary.projectStatus === 'good' ? 'text-green-700' :
                      'text-blue-700'
                    }`}>
                      {progressSummary.projectStatus === 'danger' ? '危険' :
                       progressSummary.projectStatus === 'warning' ? '注意' :
                       progressSummary.projectStatus === 'good' ? '良好' :
                       '正常'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      進捗率: {Math.round(progressSummary.progressRate)}% / 遅延率: {Math.round(progressSummary.delayRate)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">リスク要因</h3>
                <ul className="list-disc list-inside bg-gray-50 p-4 rounded-lg">
                  {factors.map((factor, index) => (
                    <li key={index} className="mb-1 text-gray-700">{factor}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">推奨される対策</h3>
                <ul className="list-disc list-inside bg-gray-50 p-4 rounded-lg">
                  {measures.map((measure, index) => (
                    <li key={index} className="mb-1 text-gray-700">{measure}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-bold text-gray-800">{getModalTitle()}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {renderContent()}
        </div>
        <div className="border-t p-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
} 