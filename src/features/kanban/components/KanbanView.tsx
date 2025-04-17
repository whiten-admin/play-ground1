'use client';

import { Task } from '@/features/tasks/types/task';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { IoAdd } from 'react-icons/io5';
import { useState, useEffect } from 'react';
import TaskCreationForm from '@/features/tasks/components/TaskCreationForm';
import { RiDeleteBin6Line } from 'react-icons/ri';

// カンバンステータス型
type KanbanStatus = string;

// 拡張したTask型（status属性を追加）
interface ExtendedTask extends Task {
  status?: KanbanStatus;
}

interface KanbanViewProps {
  tasks: Task[];
  onTaskSelect: (taskId: string) => void;
  onTaskUpdate?: (updatedTask: Task) => void;
  onTaskCreate?: (newTask: Task) => void;
  projectId: string;
}

type KanbanColumn = {
  id: string;
  title: string;
  tasks: Task[];
};

type CustomColumn = {
  id: string;
  title: string;
};

export default function KanbanView({ tasks, onTaskSelect, onTaskUpdate, onTaskCreate, projectId }: KanbanViewProps) {
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [creatingInColumn, setCreatingInColumn] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  
  // デフォルトのカラム定義
  const defaultColumns = [
    { id: 'not-started', title: '未着手' },
    { id: 'in-progress', title: '進行中' },
    { id: 'completed', title: '完了' }
  ];
  
  // カスタムカラムの状態を管理
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);

  // ローカルストレージからカスタムカラムを読み込み
  useEffect(() => {
    const loadCustomColumns = () => {
      if (typeof window === 'undefined') return; // SSR対応
      
      try {
        const savedColumns = localStorage.getItem(`kanban-columns-${projectId}`);
        if (savedColumns) {
          setCustomColumns(JSON.parse(savedColumns));
        }
      } catch (error) {
        console.error('カスタムカラムの読み込みに失敗しました:', error);
      }
    };
    
    loadCustomColumns();
  }, [projectId]);

  // カスタムカラムが変更されたらローカルストレージに保存
  useEffect(() => {
    if (typeof window === 'undefined') return; // SSR対応
    
    try {
      localStorage.setItem(`kanban-columns-${projectId}`, JSON.stringify(customColumns));
    } catch (error) {
      console.error('カスタムカラムの保存に失敗しました:', error);
    }
  }, [customColumns, projectId]);

  // 進捗率を計算する関数
  const calculateProgress = (task: Task) => {
    if (task.todos.length === 0) return 0;
    const completedTodos = task.todos.filter(todo => todo.completed).length;
    return Math.round((completedTodos / task.todos.length) * 100);
  };

  // タスクのステータスを取得する関数
  const getTaskStatus = (task: Task): KanbanStatus => {
    const extendedTask = task as ExtendedTask;
    // 明示的に設定されたステータスがあればそれを優先
    if (extendedTask.status) {
      return extendedTask.status;
    }
    
    // ステータスが設定されていなければ進捗率から判定
    const progress = calculateProgress(task);
    if (progress === 0) return 'not-started';
    if (progress === 100) return 'completed';
    return 'in-progress';
  };

  // 全てのカラム（デフォルト + カスタム）
  const allColumns = [...defaultColumns, ...customColumns];

  // タスクをステータスに基づいて分類
  const columns: KanbanColumn[] = allColumns.map(column => ({
    id: column.id,
    title: column.title,
    tasks: tasks.filter(task => getTaskStatus(task) === column.id)
  }));

  // ドラッグ終了時の処理
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const task = tasks.find(t => t.id === result.draggableId);
    if (!task) return;

    // タスクのTODOの状態を更新
    const updateTaskStatus = (task: Task, newStatus: string) => {
      const updatedTask = { ...task } as ExtendedTask;
      
      // 明示的にステータスを設定
      updatedTask.status = newStatus;
      
      // デフォルトステータスの場合、特定の処理を適用
      if (newStatus === 'not-started') {
        // すべてのTODOを未完了に
        updatedTask.todos = task.todos.map(todo => ({
          ...todo,
          completed: false
        }));
      } else if (newStatus === 'completed') {
        // すべてのTODOを完了に
        updatedTask.todos = task.todos.map(todo => ({
          ...todo,
          completed: true
        }));
      }
      // カスタムステータスやin-progressステータスでは完了状態を変更しない

      return updatedTask as Task;
    };

    // タスクの状態を更新
    const updatedTask = updateTaskStatus(task, destination.droppableId);
    onTaskUpdate?.(updatedTask);
  };

  // 新規タスク作成
  const handleCreateTask = (task: Task) => {
    // カラムに応じたTODOの状態を設定
    const updatedTask = { ...task } as ExtendedTask;
    
    // 明示的にステータスを設定
    if (creatingInColumn) {
      updatedTask.status = creatingInColumn;
    }
    
    // デフォルトステータスの特別処理
    if (creatingInColumn === 'completed') {
      // 完了カラムの場合、すべてのTODOを完了状態に設定
      updatedTask.todos = updatedTask.todos.map(todo => ({
        ...todo,
        completed: true
      }));
    } else if (creatingInColumn === 'not-started') {
      // 未着手カラムの場合、すべてのTODOを未完了状態に設定
      updatedTask.todos = updatedTask.todos.map(todo => ({
        ...todo,
        completed: false
      }));
    }
    // その他のカラムの場合は完了状態を変更しない

    onTaskCreate?.(updatedTask as Task);
    setIsCreatingTask(false);
    setCreatingInColumn(null);
  };

  // 新しいカラム追加
  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return;
    
    // IDを生成（タイトルをスネークケースに変換）
    const columnId = newColumnTitle.trim().toLowerCase().replace(/\s+/g, '-');
    
    // すでに同じIDまたはタイトルが存在する場合はエラー
    if (allColumns.some(c => c.id === columnId || c.title === newColumnTitle.trim())) {
      setErrorMessage('同じ名前のステータスがすでに存在します');
      return;
    }
    
    const newColumn: CustomColumn = { id: columnId, title: newColumnTitle.trim() };
    setCustomColumns([...customColumns, newColumn]);
    setNewColumnTitle('');
    setIsAddingColumn(false);
    setErrorMessage(null);
  };

  // カスタムカラム削除
  const handleDeleteColumn = (columnId: string) => {
    // デフォルトカラムは削除できない
    if (defaultColumns.some(c => c.id === columnId)) return;
    
    // このカラムのタスクを「未着手」に移動
    if (tasks.some(task => getTaskStatus(task) === columnId) && onTaskUpdate) {
      tasks.forEach(task => {
        if (getTaskStatus(task) === columnId) {
          const updatedTask = { ...task } as ExtendedTask;
          updatedTask.status = 'not-started';
          onTaskUpdate(updatedTask as Task);
        }
      });
    }
    
    setCustomColumns(customColumns.filter(c => c.id !== columnId));
  };

  return (
    <div className="h-full overflow-x-auto">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 min-w-max h-full px-2">
          {/* タスクカラム */}
          {columns.map(column => (
            <div
              key={column.id}
              className="w-40 flex flex-col bg-gray-100 rounded-lg"
            >
              <h3 className="font-medium text-gray-700 p-3 pb-2 flex items-center justify-between">
                <span className="flex-1 truncate">{column.title}</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-500">
                    {column.tasks.length}件
                  </span>
                  {/* デフォルト以外のカラムは削除可能 */}
                  {!defaultColumns.some(c => c.id === column.id) && (
                    <button
                      onClick={() => handleDeleteColumn(column.id)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-200"
                      title="このステータスを削除"
                    >
                      <RiDeleteBin6Line className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </h3>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 p-2 space-y-2 overflow-y-auto"
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onTaskSelect(task.id)}
                            className={`bg-white p-3 rounded-lg shadow cursor-pointer transition-shadow ${
                              calculateProgress(task) === 100
                                ? 'opacity-60'
                                : 'hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <h4 className="font-medium text-gray-800 text-sm">{task.title}</h4>
                              <span className="text-xs text-gray-500">
                                {calculateProgress(task)}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2 mb-1.5">
                              {task.description}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${calculateProgress(task)}%`,
                                    background: `linear-gradient(to right, rgb(219, 234, 254), rgb(37, 99, 235))`
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">
                                {task.todos.filter(todo => todo.completed).length}/{task.todos.length}
                              </span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {/* カラムごとのタスク追加ボタン */}
                    <button
                      onClick={() => {
                        setIsCreatingTask(true);
                        setCreatingInColumn(column.id);
                      }}
                      className="w-full p-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 transition-colors"
                    >
                      <IoAdd className="w-4 h-4" />
                      タスク追加
                    </button>
                  </div>
                )}
              </Droppable>
            </div>
          ))}
          {/* 新しいステータス追加カラム */}
          <div className="w-40 flex flex-col bg-gray-50 rounded-lg border-dashed border-2 border-gray-200 max-h-[50vh]">
            <h3 className="font-medium text-gray-700 p-3 pb-2">新しいステータス</h3>
            
            <div className="flex-1 p-2">
              {isAddingColumn ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    placeholder="ステータス名"
                    className="w-full p-2 text-sm border rounded"
                    autoFocus
                  />
                  {errorMessage && (
                    <p className="text-xs text-red-500">{errorMessage}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddColumn}
                      className="flex-1 p-1 text-xs bg-blue-500 text-white rounded"
                    >
                      追加
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingColumn(false);
                        setNewColumnTitle('');
                        setErrorMessage(null);
                      }}
                      className="flex-1 p-1 text-xs bg-gray-200 rounded"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingColumn(true)}
                  className="w-full h-full p-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <IoAdd className="w-5 h-5" />
                  ステータス追加
                </button>
              )}
            </div>
          </div>
        </div>
      </DragDropContext>
      
      {/* 共通のTaskCreationFormを使用 */}
      {isCreatingTask && (
        <TaskCreationForm
          onCancel={() => {
            setIsCreatingTask(false);
            setCreatingInColumn(null);
          }}
          onTaskCreate={handleCreateTask}
          projectId={projectId}
          title={`新しいタスクを作成${
            creatingInColumn ? ` (${columns.find(c => c.id === creatingInColumn)?.title || ''})` : ''
          }`}
        />
      )}
    </div>
  );
} 