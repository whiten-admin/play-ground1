'use client';

import { Task } from '@/features/tasks/types/task';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { IoAdd } from 'react-icons/io5';
import { useState, useEffect, useMemo } from 'react';
import TaskCreationForm from '@/features/tasks/components/TaskCreationForm';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { format, isBefore, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { BiTimeFive } from 'react-icons/bi';
import { AiOutlineCalendar } from 'react-icons/ai';
import { FaFire } from 'react-icons/fa';
import { useProjectContext } from '@/features/projects/contexts/ProjectContext';
import { ProjectMember } from '@/features/projects/types/projectMember';
import { getProjectUsers } from '@/utils/memberUtils';
import { useFilterContext } from '@/features/tasks/filters/FilterContext';

// カンバンステータス型
type KanbanStatus = string;

// 拡張したTask型（status属性を追加）
interface ExtendedTask extends Task {
  status?: KanbanStatus;
  statusColor?: {
    bgColor: string;
    textColor: string;
    borderColor: string;
  };
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
  bgColor?: string; // 背景色
  textColor?: string; // テキスト色
  borderColor?: string; // ボーダー色
};

type CustomColumn = {
  id: string;
  title: string;
  bgColor?: string; // 背景色
  textColor?: string; // テキスト色
  borderColor?: string; // ボーダー色
};

// プロジェクトメンバーとユーザー情報を組み合わせた型
interface MemberWithUser {
  assigneeId: string; // プロジェクトメンバーID
  userId: string;     // ユーザーID
  name: string;       // ユーザー名
  role: string;       // メンバーのロール
  isCurrentUser?: boolean; // 現在のユーザーかどうか
}

export default function KanbanView({ tasks, onTaskSelect, onTaskUpdate, onTaskCreate, projectId }: KanbanViewProps) {
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [creatingInColumn, setCreatingInColumn] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnBgColor, setNewColumnBgColor] = useState('bg-gray-200');
  const [newColumnTextColor, setNewColumnTextColor] = useState('text-gray-800');
  const [newColumnBorderColor, setNewColumnBorderColor] = useState('border-gray-300');
  const { getProjectMembers } = useProjectContext();
  const { currentUserId } = useFilterContext();
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [projectMemberUsers, setProjectMemberUsers] = useState<MemberWithUser[]>([]);
  
  // デフォルトのカラム定義
  const defaultColumns = [
    { 
      id: 'not-started', 
      title: '未着手',
      bgColor: 'bg-yellow-200',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-300'
    },
    { 
      id: 'in-progress', 
      title: '進行中',
      bgColor: 'bg-blue-200',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-300'
    },
    { 
      id: 'completed', 
      title: '完了',
      bgColor: 'bg-gray-200',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-300'
    }
  ];
  
  // カスタムカラムの状態を管理
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);

  // プロジェクトメンバーの読み込み
  useEffect(() => {
    if (projectId) {
      const members = getProjectMembers(projectId);
      setProjectMembers(members);

      // プロジェクトユーザーを直接取得
      const projectUsers = getProjectUsers(projectId);
      
      // プロジェクトメンバーとユーザー情報を結合
      const memberUsers: MemberWithUser[] = members.map(member => {
        const userInfo = projectUsers.find(u => u.id === member.userId);
        return {
          assigneeId: member.id,
          userId: member.userId,
          name: userInfo ? userInfo.name : '不明なユーザー',
          role: member.role,
          isCurrentUser: member.userId === currentUserId
        };
      });
      
      setProjectMemberUsers(memberUsers);
    }
  }, [projectId, getProjectMembers, currentUserId]);

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

  // タスクの合計見積もり工数を計算する関数
  const calculateTotalEstimatedHours = (task: Task) => {
    return task.todos.reduce((total, todo) => total + (todo.estimatedHours || 0), 0);
  };

  // 担当者のアイコン表示に使用するユーザー情報を取得
  const getUserInfo = (assigneeId: string) => {
    const member = projectMemberUsers.find(m => m.assigneeId === assigneeId);
    return member || null;
  };

  // タスクの担当者リストを取得する関数
  const getTaskAssignees = (task: Task) => {
    // タスク内の全TODOからユニークな担当者IDを抽出
    const assigneeIds = Array.from(new Set(task.todos.map(todo => todo.assigneeId).filter(Boolean)));
    
    // 各担当者のユーザー情報を取得
    return assigneeIds.map(assigneeId => {
      const memberInfo = getUserInfo(assigneeId);
      
      if (memberInfo) {
        return {
          id: memberInfo.assigneeId,
          userId: memberInfo.userId,
          name: memberInfo.name,
          role: memberInfo.role
        };
      }
      
      // プロジェクトメンバーに存在しない場合
      return { id: assigneeId, userId: '', name: '未アサイン', role: 'member' };
    });
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
    tasks: tasks.filter(task => getTaskStatus(task) === column.id),
    bgColor: column.bgColor,
    textColor: column.textColor,
    borderColor: column.borderColor
  }));

  // 期日超過かどうかをチェックする関数
  const isOverdue = (task: Task) => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const today = startOfDay(new Date());
    const progress = calculateProgress(task);
    
    // 期日が過ぎているかつ完了していない場合はtrue
    return isBefore(dueDate, today) && progress < 100;
  };

  // ステータスに対応する色情報を取得する関数
  const getStatusColors = (statusId: string) => {
    const column = allColumns.find(col => col.id === statusId);
    return {
      bgColor: column?.bgColor || 'bg-gray-200',
      textColor: column?.textColor || 'text-gray-800',
      borderColor: column?.borderColor || 'border-gray-300'
    };
  };

  // ドラッグ終了時の処理
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const task = tasks.find(t => t.id === result.draggableId);
    if (!task) return;

    // タスクのTODOの状態を更新
    const updateTaskStatus = (task: Task, newStatus: string) => {
      const updatedTask = { ...task } as ExtendedTask;
      
      // 明示的にステータスと色情報を設定
      updatedTask.status = newStatus;
      updatedTask.statusColor = getStatusColors(newStatus);
      
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
      updatedTask.statusColor = getStatusColors(creatingInColumn);
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
    
    const newColumn: CustomColumn = { 
      id: columnId, 
      title: newColumnTitle.trim(),
      bgColor: newColumnBgColor,
      textColor: newColumnTextColor,
      borderColor: newColumnBorderColor
    };
    
    setCustomColumns([...customColumns, newColumn]);
    setNewColumnTitle('');
    setNewColumnBgColor('bg-gray-200');
    setNewColumnTextColor('text-gray-800');
    setNewColumnBorderColor('border-gray-300');
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

  // 日付フォーマット
  const formatDate = (date: Date) => {
    try {
      if (!(date instanceof Date) && date) {
        date = new Date(date);
      }
      return format(date, 'MM/dd (E)', { locale: ja });
    } catch (error) {
      return '日付不明';
    }
  };

  // ユーザーの頭文字を取得する
  const getUserInitial = (name: string) => {
    return name ? name.charAt(0) : '?';
  };

  // メンバーロールに基づいた色を取得
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'manager':
        return 'bg-blue-500';
      case 'member':
      default:
        return 'bg-gray-500';
    }
  };

  // 色選択オプション
  const colorOptions = [
    { bg: 'bg-gray-200', text: 'text-gray-800', border: 'border-gray-300', label: 'グレー' },
    { bg: 'bg-blue-200', text: 'text-blue-800', border: 'border-blue-300', label: 'ブルー' },
    { bg: 'bg-green-200', text: 'text-green-800', border: 'border-green-300', label: '緑' },
    { bg: 'bg-yellow-200', text: 'text-yellow-800', border: 'border-yellow-300', label: '黄色' },
    { bg: 'bg-red-200', text: 'text-red-800', border: 'border-red-300', label: '赤' },
    { bg: 'bg-purple-200', text: 'text-purple-800', border: 'border-purple-300', label: '紫' },
    { bg: 'bg-pink-200', text: 'text-pink-800', border: 'border-pink-300', label: 'ピンク' },
    { bg: 'bg-indigo-200', text: 'text-indigo-800', border: 'border-indigo-300', label: 'インディゴ' },
  ];

  return (
    <div className="h-full overflow-x-auto">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 min-w-max h-full px-2">
          {/* タスクカラム */}
          {columns.map(column => (
            <div
              key={column.id}
              className={`w-60 flex flex-col rounded-lg ${
                column.bgColor || 'bg-gray-100'
              }`}
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
                    {column.tasks.map((task, index) => {
                      const overdueTask = isOverdue(task);
                      return (
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
                              className={`bg-white p-3 rounded-lg shadow cursor-pointer transition-shadow relative ${
                                calculateProgress(task) === 100
                                  ? 'opacity-60'
                                  : 'hover:shadow-md'
                              }`}
                            >
                              {/* 期日超過警告アイコン */}
                              {overdueTask && (
                                <div className="absolute right-2 top-2">
                                  <FaFire className="text-red-500 w-4 h-4" title="期日超過" />
                                </div>
                              )}
                              
                              {/* タスク名 */}
                              <h4 className="font-medium text-gray-800 text-sm mb-2 line-clamp-2">{task.title}</h4>
                              
                              <div className="flex flex-col gap-1.5 text-xs">
                                {/* 工数 */}
                                <div className="flex items-center text-gray-600">
                                  <BiTimeFive className="mr-1 text-gray-400" />
                                  <span>{calculateTotalEstimatedHours(task)}時間</span>
                                </div>
                                
                                {/* 期日 */}
                                <div className="flex items-center text-gray-600">
                                  <AiOutlineCalendar className="mr-1 text-gray-400" />
                                  <span className={overdueTask ? 'text-red-500 font-bold' : ''}>
                                    {formatDate(task.dueDate)}
                                  </span>
                                </div>
                              </div>
                              
                              {/* 進捗バーとパーセント */}
                              <div className="mt-2 mb-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-500">進捗</span>
                                  <span className="text-xs font-medium text-blue-600">
                                    {calculateProgress(task)}%
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-200 rounded-full">
                                  <div
                                    className="h-full rounded-full bg-blue-500"
                                    style={{
                                      width: `${calculateProgress(task)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              
                              {/* 担当者 */}
                              <div className="flex items-center mt-2 overflow-hidden">
                                {getTaskAssignees(task).length > 0 ? (
                                  <div className="flex -space-x-2 overflow-hidden">
                                    {getTaskAssignees(task).slice(0, 3).map((member, i) => (
                                      <div 
                                        key={`${member.id}-${i}`}
                                        className={`flex-shrink-0 h-6 w-6 rounded-full ${getRoleColor(member.role)} text-white flex items-center justify-center text-xs font-medium border-2 border-white`}
                                        title={member.name}
                                      >
                                        {getUserInitial(member.name)}
                                      </div>
                                    ))}
                                    {getTaskAssignees(task).length > 3 && (
                                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-medium border-2 border-white">
                                        +{getTaskAssignees(task).length - 3}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">未アサイン</span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                    
                    {/* カラムごとのタスク追加ボタン */}
                    <button
                      onClick={() => {
                        setIsCreatingTask(true);
                        setCreatingInColumn(column.id);
                      }}
                      className="w-full p-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 transition-colors bg-white"
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
          <div className="w-60 flex flex-col bg-gray-50 rounded-lg border-dashed border-2 border-gray-200 max-h-[50vh]">
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
                  
                  <div className="mt-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">色を選択</label>
                    <div className="grid grid-cols-4 gap-2">
                      {colorOptions.map((color, index) => (
                        <button
                          key={index}
                          className={`p-2 rounded ${color.bg} ${color.text} ${color.border} border flex items-center justify-center h-8 text-xs ${
                            newColumnBgColor === color.bg ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                          }`}
                          onClick={() => {
                            setNewColumnBgColor(color.bg);
                            setNewColumnTextColor(color.text);
                            setNewColumnBorderColor(color.border);
                          }}
                        >
                          {color.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
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
                        setNewColumnBgColor('bg-gray-200');
                        setNewColumnTextColor('text-gray-800');
                        setNewColumnBorderColor('border-gray-300');
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