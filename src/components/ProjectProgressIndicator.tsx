import React, { useState } from 'react';
import { useTaskContext } from '@/features/tasks/contexts/TaskContext';
import { useProjectContext } from '@/features/projects/contexts/ProjectContext';
import { IoSearch, IoClose } from 'react-icons/io5';
import {
  calculateProgressPercentage,
  calculateDelayHours,
  calculateRiskLevel,
  getRiskLevelText,
  getRiskLevelColorClass
} from '@/features/tasks/utils/progressUtils';

interface ProjectProgressIndicatorProps {
  compact?: boolean; // コンパクト表示モード（ヘッダー用）
}

export default function ProjectProgressIndicator({ compact = true }: ProjectProgressIndicatorProps) {
  const { filteredTasks } = useTaskContext();
  const { currentProject, isAllProjectsMode } = useProjectContext();
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // プロジェクト全体モードまたはプロジェクトが選択されていない場合は表示しない
  if (isAllProjectsMode || !currentProject) {
    return null;
  }
  
  const progressPercentage = calculateProgressPercentage(filteredTasks);
  const delayHours = calculateDelayHours(filteredTasks);
  const riskLevel = calculateRiskLevel(filteredTasks);
  const riskLevelText = getRiskLevelText(riskLevel);
  const riskLevelColorClass = getRiskLevelColorClass(riskLevel);

  // モーダルを開く関数
  const openDetailModal = () => {
    setShowDetailModal(true);
  };

  // モーダルを閉じる関数
  const closeDetailModal = () => {
    setShowDetailModal(false);
  };

  if (compact) {
    // ヘッダー用のコンパクト表示
    return (
      <>
        <div className="flex items-center gap-2 text-xs bg-gray-50 rounded-md py-1 px-2 border border-gray-200">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">進捗:</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          
          {delayHours > 0 && (
            <>
              <div className="w-px h-3 bg-gray-300"></div>
              <div className="flex items-center gap-1">
                <span className="text-gray-600">遅延:</span>
                <span className="font-medium text-red-600">{delayHours}h</span>
              </div>
            </>
          )}
          
          <div className="w-px h-3 bg-gray-300"></div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600">リスク:</span>
            <span className={`px-1.5 py-0.5 rounded-sm font-medium ${riskLevelColorClass}`}>
              {riskLevelText}
            </span>
          </div>
          
          <button 
            onClick={openDetailModal}
            className="ml-1 text-gray-500 hover:text-gray-700 p-0.5 rounded-full hover:bg-gray-200 transition-colors"
            title="詳細を表示"
          >
            <IoSearch size={14} />
          </button>
        </div>

        {/* 詳細モーダル */}
        {showDetailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
              <div className="flex justify-between items-center border-b p-4">
                <h2 className="text-lg font-bold text-gray-800">{currentProject.title} - 進捗詳細</h2>
                <button 
                  onClick={closeDetailModal}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <IoClose size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 bg-blue-50 p-3 rounded-md border border-blue-200 text-sm text-blue-700">
                  <p>※ この進捗詳細画面は今後アップデート予定です。より詳細な分析やバーンダウンチャートは分析画面でご確認いただけます。</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-base font-medium text-gray-700 mb-2">プロジェクト進捗状況</h3>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">全体進捗</span>
                          <span className="font-medium">{progressPercentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${progressPercentage}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">遅延状況</div>
                        <div className={`font-medium ${delayHours > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {delayHours > 0 ? `${delayHours}時間の遅延` : '遅延なし'}
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">リスク評価</div>
                        <div className="flex items-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskLevelColorClass}`}>
                            {riskLevelText}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-medium text-gray-700 mb-2">タスク概要</h3>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <div className="text-xs text-gray-500">全タスク数</div>
                        <div className="font-medium text-xl">{filteredTasks.length}</div>
                      </div>
                      
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <div className="text-xs text-gray-500">完了タスク</div>
                        <div className="font-medium text-xl text-green-600">
                          {filteredTasks.filter(task => {
                            const taskProgress = task.todos.length === 0 ? 0 : 
                              Math.round((task.todos.filter(todo => todo.completed).reduce((sum, todo) => sum + todo.estimatedHours, 0) / 
                              task.todos.reduce((sum, todo) => sum + todo.estimatedHours, 0)) * 100);
                            return taskProgress === 100;
                          }).length}
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <div className="text-xs text-gray-500">未完了タスク</div>
                        <div className="font-medium text-xl text-blue-600">
                          {filteredTasks.filter(task => {
                            const taskProgress = task.todos.length === 0 ? 0 : 
                              Math.round((task.todos.filter(todo => todo.completed).reduce((sum, todo) => sum + todo.estimatedHours, 0) / 
                              task.todos.reduce((sum, todo) => sum + todo.estimatedHours, 0)) * 100);
                            return taskProgress < 100;
                          }).length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <a 
                    href={`/analytics?project=${currentProject.id}`} 
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <span>プロジェクト分析画面へ</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // 詳細表示バージョン（将来的に必要になった場合）
  return (
    <div className="flex flex-col gap-2 p-3 bg-white rounded-lg shadow">
      <h3 className="font-medium text-sm text-gray-700">プロジェクト進捗状況</h3>
      
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">進捗</span>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${progressPercentage}%` }} 
              />
            </div>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
        </div>
        
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">遅延</span>
          <span className={`font-medium ${delayHours > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {delayHours > 0 ? `${delayHours}時間` : 'なし'}
          </span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">リスク</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskLevelColorClass}`}>
            {riskLevelText}
          </span>
        </div>
      </div>
    </div>
  );
} 