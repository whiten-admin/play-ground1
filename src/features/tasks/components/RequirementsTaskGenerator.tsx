'use client';

import React, { useState } from 'react';
import { IoClose, IoDocument, IoListOutline, IoCheckmarkCircleOutline, IoBuildOutline, IoStatsChartOutline } from 'react-icons/io5';
import { Task } from '@/features/tasks/types/task';

interface RequirementsTaskGeneratorProps {
  onClose: () => void;
  onTasksCreate: (tasks: Task[]) => void;
  projectId?: string;
}

type Step = {
  id: string;
  title: string;
  icon: JSX.Element;
  optional: boolean;
};

export default function RequirementsTaskGenerator({
  onClose,
  onTasksCreate,
  projectId
}: RequirementsTaskGeneratorProps) {
  // 各ステップの定義
  const steps: Step[] = [
    { 
      id: 'document', 
      title: '資料の読み込み', 
      icon: <IoDocument className="w-5 h-5" />,
      optional: false
    },
    { 
      id: 'features', 
      title: '機能一覧の提示', 
      icon: <IoListOutline className="w-5 h-5" />,
      optional: true
    },
    { 
      id: 'tasks', 
      title: 'タスク一覧の提案', 
      icon: <IoCheckmarkCircleOutline className="w-5 h-5" />,
      optional: false
    },
    { 
      id: 'todos', 
      title: 'TODO提案', 
      icon: <IoBuildOutline className="w-5 h-5" />,
      optional: true
    },
    { 
      id: 'estimation', 
      title: '工数見積もり', 
      icon: <IoStatsChartOutline className="w-5 h-5" />,
      optional: true
    }
  ];

  // 状態管理
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [features, setFeatures] = useState<Array<{ id: string; name: string; description: string; selected: boolean }>>([]);
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; description: string; selected: boolean }>>([]);
  const [todos, setTodos] = useState<Record<string, Array<{ id: string; text: string; estimatedHours: number; selected: boolean }>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 現在のステップ
  const currentStep = steps[currentStepIndex];

  // 次のステップに進む
  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  // 前のステップに戻る
  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  // ステップをスキップ
  const handleSkipStep = () => {
    if (currentStep.optional && currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  // ドキュメントをアップロードする（UI表示のみで実際の機能は未実装）
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    // この部分は実際のファイルアップロード処理は未実装（UI表示のみ）
    setTimeout(() => {
      setDocumentContent('アップロードされたドキュメントのサンプルコンテンツです。\n\n要件1: ユーザー管理機能の実装\n要件2: ダッシュボード表示の改善\n要件3: レポート出力機能の追加');
      setIsLoading(false);
    }, 1500);
  };

  // 最終ステップで完了をクリック
  const handleComplete = () => {
    // ここでは実際のタスク作成は行わず、ダイアログを閉じる
    onClose();
  };

  // ドキュメントステップのレンダリング
  const renderDocumentStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-2">
        要件定義書や機能一覧などの資料をアップロードしてください。
        テキスト、PDF、Word、Excelなどの形式に対応しています。
      </p>
      
      {documentContent ? (
        <div className="border rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto">
          <h3 className="font-medium text-sm mb-2">読み込み結果</h3>
          <pre className="text-sm whitespace-pre-wrap">{documentContent}</pre>
          
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => setDocumentContent('')}
              className="text-xs text-red-600 hover:text-red-800"
            >
              クリア
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            id="document-upload"
            className="hidden"
            onChange={handleDocumentUpload}
            accept=".txt,.pdf,.doc,.docx,.xls,.xlsx"
          />
          <label
            htmlFor="document-upload"
            className="cursor-pointer block"
          >
            <div className="flex flex-col items-center justify-center">
              <IoDocument className="w-10 h-10 text-blue-500 mb-2" />
              <p className="text-sm font-medium text-blue-600">クリックして資料をアップロード</p>
              <p className="text-xs text-gray-500 mt-1">または、ファイルをここにドラッグ＆ドロップ</p>
            </div>
          </label>
        </div>
      )}
      
      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600">資料を解析中...</span>
        </div>
      )}
    </div>
  );

  // 機能一覧ステップのレンダリング
  const renderFeaturesStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-2">
        資料から抽出された機能一覧です。
        必要な機能を選択してください。
      </p>
      
      <div className="border rounded-lg p-3 max-h-64 overflow-y-auto">
        <div className="space-y-2">
          {/* サンプル機能リスト (実際はAPIレスポンスから生成) */}
          {[
            { id: 'f1', name: 'ユーザー管理機能', description: 'ユーザーの登録・編集・削除を行う機能', selected: true },
            { id: 'f2', name: 'ダッシュボード', description: '主要な情報を一覧表示する機能', selected: true },
            { id: 'f3', name: 'レポート出力', description: '各種レポートをPDF形式で出力する機能', selected: true }
          ].map(feature => (
            <div key={feature.id} className="flex items-start border-b pb-2">
              <input 
                type="checkbox" 
                id={`feature-${feature.id}`}
                checked={feature.selected}
                onChange={() => {}}
                className="mt-1 mr-2"
              />
              <div>
                <label 
                  htmlFor={`feature-${feature.id}`}
                  className="block text-sm font-medium"
                >
                  {feature.name}
                </label>
                <p className="text-xs text-gray-500">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <button
          className="text-sm text-blue-600 hover:text-blue-800"
          onClick={() => {}}
        >
          全て選択
        </button>
        <button
          className="text-sm text-blue-600 hover:text-blue-800"
          onClick={() => {}}
        >
          機能を追加
        </button>
      </div>
    </div>
  );

  // タスク一覧ステップのレンダリング
  const renderTasksStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-2">
        選択された機能から生成されたタスク一覧です。
        実装するタスクを選択してください。
      </p>
      
      <div className="border rounded-lg p-3 max-h-64 overflow-y-auto">
        <div className="space-y-4">
          {/* サンプルタスクリスト（実際はAPIレスポンスから生成） */}
          <div className="border-b pb-2">
            <h3 className="font-medium text-blue-800 text-sm mb-1">ユーザー管理機能</h3>
            <div className="space-y-2 pl-2">
              {[
                { id: 't1', title: 'ユーザー登録画面の実装', description: 'ユーザーの新規登録フォームを実装する', selected: true },
                { id: 't2', title: 'ユーザー一覧表示', description: '登録済みユーザーの一覧表示機能を実装する', selected: true },
                { id: 't3', title: 'ユーザー編集機能', description: 'ユーザー情報の編集機能を実装する', selected: true }
              ].map(task => (
                <div key={task.id} className="flex items-start">
                  <input 
                    type="checkbox" 
                    id={`task-${task.id}`}
                    checked={task.selected}
                    onChange={() => {}}
                    className="mt-1 mr-2"
                  />
                  <div>
                    <label 
                      htmlFor={`task-${task.id}`}
                      className="block text-sm font-medium"
                    >
                      {task.title}
                    </label>
                    <p className="text-xs text-gray-500">{task.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-b pb-2">
            <h3 className="font-medium text-blue-800 text-sm mb-1">ダッシュボード</h3>
            <div className="space-y-2 pl-2">
              {[
                { id: 't4', title: 'ダッシュボードレイアウト', description: 'ダッシュボードの基本レイアウトを実装する', selected: true },
                { id: 't5', title: 'データ可視化コンポーネント', description: 'グラフやチャートのコンポーネントを実装する', selected: true }
              ].map(task => (
                <div key={task.id} className="flex items-start">
                  <input 
                    type="checkbox" 
                    id={`task-${task.id}`}
                    checked={task.selected}
                    onChange={() => {}}
                    className="mt-1 mr-2"
                  />
                  <div>
                    <label 
                      htmlFor={`task-${task.id}`}
                      className="block text-sm font-medium"
                    >
                      {task.title}
                    </label>
                    <p className="text-xs text-gray-500">{task.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // TODO提案ステップのレンダリング
  const renderTodosStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-2">
        選択されたタスクに対するTODO項目の提案です。
        必要なTODO項目を選択してください。
      </p>
      
      <div className="border rounded-lg p-3 max-h-64 overflow-y-auto">
        <div className="space-y-4">
          {/* タスク＆TODOのサンプル表示（実際はAPIレスポンスから生成） */}
          <div className="border-b pb-2">
            <h3 className="font-medium text-blue-800 text-sm mb-1">ユーザー登録画面の実装</h3>
            <div className="space-y-2 pl-2">
              {[
                { id: 'todo1', text: '入力フォームUIの作成', estimatedHours: 2, selected: true },
                { id: 'todo2', text: 'バリデーション実装', estimatedHours: 1.5, selected: true },
                { id: 'todo3', text: 'API接続処理の実装', estimatedHours: 1, selected: true },
                { id: 'todo4', text: 'エラーハンドリング', estimatedHours: 1, selected: true }
              ].map(todo => (
                <div key={todo.id} className="flex items-start">
                  <input 
                    type="checkbox" 
                    id={`todo-${todo.id}`}
                    checked={todo.selected}
                    onChange={() => {}}
                    className="mt-1 mr-2"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <label 
                        htmlFor={`todo-${todo.id}`}
                        className="block text-sm font-medium"
                      >
                        {todo.text}
                      </label>
                      <span className="text-xs text-gray-600">{todo.estimatedHours}h</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 工数見積もりステップのレンダリング
  const renderEstimationStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-2">
        各TODOの見積もり工数です。
        必要に応じて調整してください。
      </p>
      
      <div className="border rounded-lg p-3 max-h-64 overflow-y-auto">
        <div className="space-y-4">
          {/* 見積もりのサンプル表示（実際はAPIレスポンスから生成） */}
          <div className="border-b pb-2">
            <h3 className="font-medium text-blue-800 text-sm mb-1">ユーザー登録画面の実装</h3>
            <div className="space-y-2 pl-2">
              {[
                { id: 'todo1', text: '入力フォームUIの作成', estimatedHours: 2 },
                { id: 'todo2', text: 'バリデーション実装', estimatedHours: 1.5 },
                { id: 'todo3', text: 'API接続処理の実装', estimatedHours: 1 },
                { id: 'todo4', text: 'エラーハンドリング', estimatedHours: 1 }
              ].map(todo => (
                <div key={todo.id} className="flex items-center">
                  <div className="flex-1">
                    <span className="text-sm">{todo.text}</span>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={todo.estimatedHours}
                      onChange={() => {}}
                      className="w-16 p-1 text-sm border rounded"
                    />
                    <span className="ml-1 text-sm">時間</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between text-sm font-medium">
            <span>合計工数</span>
            <span>5.5時間</span>
          </div>
        </div>
      </div>
    </div>
  );

  // 現在のステップに応じたコンテンツをレンダリング
  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'document':
        return renderDocumentStep();
      case 'features':
        return renderFeaturesStep();
      case 'tasks':
        return renderTasksStep();
      case 'todos':
        return renderTodosStep();
      case 'estimation':
        return renderEstimationStep();
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-bold text-gray-800">要件からタスク自動生成</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>
        
        {/* ステップ表示 */}
        <div className="px-4 py-3 border-b bg-gray-50">
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className="flex flex-col items-center"
              >
                <div 
                  className={`rounded-full w-8 h-8 flex items-center justify-center
                    ${index === currentStepIndex 
                      ? 'bg-blue-500 text-white' 
                      : index < currentStepIndex 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-600'}`}
                >
                  {step.icon}
                </div>
                <span className={`text-xs mt-1 ${index === currentStepIndex ? 'font-medium' : ''}`}>
                  {step.title}
                </span>
                {step.optional && (
                  <span className="text-xs text-gray-500">(任意)</span>
                )}
              </div>
            ))}
          </div>
          <div className="relative mt-2">
            <div className="absolute h-1 bg-gray-200 top-0 left-0 right-0"></div>
            <div 
              className="absolute h-1 bg-blue-500 top-0 left-0" 
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* ステップコンテンツ */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderStepContent()}
        </div>
        
        {/* フッター */}
        <div className="flex justify-between items-center border-t p-4">
          <div>
            {currentStepIndex > 0 && (
              <button 
                onClick={handlePreviousStep}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
              >
                戻る
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {currentStep.optional && (
              <button 
                onClick={handleSkipStep}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
              >
                スキップ
              </button>
            )}
            {currentStepIndex < steps.length - 1 ? (
              <button 
                onClick={handleNextStep}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                disabled={currentStep.id === 'document' && !documentContent}
              >
                次へ
              </button>
            ) : (
              <button 
                onClick={handleComplete}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                完了
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 