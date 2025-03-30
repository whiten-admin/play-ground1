'use client'

import React, { useState, useEffect, useRef } from 'react'
import { IoAdd, IoTrash, IoPencil, IoSave, IoClose, IoBulb, IoList, IoGrid, IoBarChart, IoCaretDown, IoCaretUp, IoFilter, IoCheckbox } from 'react-icons/io5'
import { Task, Todo } from '@/features/tasks/types/task'
import { format, startOfDay, isBefore, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'
import { suggestTodos } from '@/services/api/utils/openai'
import KanbanView from '@/features/kanban/components/KanbanView'
import GanttChartView from '@/features/gantt/components/GanttChartView'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { getUserNameById, getUserNamesByIds, getAllUsers } from '@/features/tasks/utils/userUtils'
import UserAssignSelect from '@/components/UserAssignSelect'
import { User } from '@/features/tasks/types/user'
import { useFilterContext } from '@/features/tasks/filters/FilterContext'
import { useProjectContext } from '@/features/projects/contexts/ProjectContext'
import TaskCreationForm from './TaskCreationForm'
import { FaClock } from 'react-icons/fa'
import Link from 'next/link'

type ViewMode = 'list' | 'kanban' | 'gantt'

interface TaskDetailProps {
  selectedTask: Task | null
  selectedTodoId: string | null
  onTaskUpdate?: (updatedTask: Task) => void
  tasks: Task[]
  onTaskSelect: (taskId: string, todoId?: string) => void
  onTaskCreate?: (newTask: Task) => void
}

interface EditState {
  title: boolean
  description: boolean
  todos: { [key: string]: boolean }
}

// APIの使用回数を取得する関数をインポート
const API_USAGE_KEY = 'openai_api_usage'
const DAILY_LIMIT = 20

function getApiUsageCount(): number {
  const storedUsage = localStorage.getItem(API_USAGE_KEY)
  if (!storedUsage) return 0

  const usage = JSON.parse(storedUsage)
  if (usage.date !== new Date().toISOString().split('T')[0]) return 0

  return usage.count
}

interface ViewModeButton {
  id: ViewMode
  icon: JSX.Element
  label: string
}

type SortField = 'dueDate'
type SortOrder = 'asc' | 'desc'

interface SortState {
  field: SortField
  order: SortOrder
}

// 期日の状態に応じたスタイルを返す関数
const getDueDateStyle = (date: Date | number) => {
  const today = startOfDay(new Date());
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isBefore(dateObj, today)) {
    return 'text-red-500'; // 期日超過
  }
  if (isToday(dateObj)) {
    return 'text-orange-500'; // 今日が期日
  }
  return 'text-blue-500'; // 期日が近い
};

export default function TaskDetail({ selectedTask, selectedTodoId, onTaskUpdate, tasks, onTaskSelect, onTaskCreate }: TaskDetailProps) {
  const [editState, setEditState] = useState<EditState>({
    title: false,
    description: false,
    todos: {}
  })
  const [editedTask, setEditedTask] = useState<Task | null>(null)
  const [newTodoText, setNewTodoText] = useState('')
  const [isSuggestingTodos, setIsSuggestingTodos] = useState(false)
  const [suggestedTodos, setSuggestedTodos] = useState<{ text: string; estimatedHours: number }[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [viewModeButtons, setViewModeButtons] = useState<ViewModeButton[]>([
    { id: 'list', icon: <IoList className="w-5 h-5" />, label: 'リスト形式' },
    { id: 'kanban', icon: <IoGrid className="w-5 h-5" />, label: 'カンバン形式' },
    { id: 'gantt', icon: <IoBarChart className="w-5 h-5" />, label: 'ガントチャート' }
  ])
  const [sortState, setSortState] = useState<SortState>({
    field: 'dueDate',
    order: 'asc'
  })
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    todos: [],
    dueDate: new Date()
  })
  const [newTaskTodos, setNewTaskTodos] = useState<Todo[]>([])
  const [newTaskTodoText, setNewTaskTodoText] = useState('')
  const [isGeneratingTodos, setIsGeneratingTodos] = useState(false)
  const [newTaskSuggestedTodos, setNewTaskSuggestedTodos] = useState<{ text: string; estimatedHours: number }[]>([])
  
  // フィルタリングコンテキストを使用
  const { selectedUserIds, showUnassigned } = useFilterContext();
  
  // 表示するタスクをフィルタリングする
  const filteredTasks = tasks.filter((task) => {
    // 各タスクのTODOから担当者リストを作成
    const taskAssignees = new Set<string>();
    task.todos.forEach(todo => {
      if (todo.assigneeId) {
        taskAssignees.add(todo.assigneeId);
      }
    });
    
    // アサインされていないタスクを表示するかどうか
    if (showUnassigned && taskAssignees.size === 0) {
      return true;
    }
    
    // 選択されたユーザーのタスクを表示
    if (Array.from(taskAssignees).some(id => selectedUserIds.includes(id))) {
      return true;
    }
    
    return false;
  });

  const { currentProject } = useProjectContext()

  // 編集モードの切り替え
  const toggleEdit = (field: 'title' | 'description' | string, isEditingTodo: boolean = false) => {
    if (!selectedTask) return

    if (!editedTask) {
      setEditedTask(selectedTask)
    }

    setEditState(prev => {
      if (isEditingTodo) {
        return {
          ...prev,
          todos: {
            ...prev.todos,
            [field]: !prev.todos[field]
          }
        }
      }
      return {
        ...prev,
        [field]: !prev[field as keyof EditState]
      }
    })
  }

  // 変更の保存
  const handleSave = (field: 'title' | 'description' | string, isEditingTodo: boolean = false) => {
    if (editedTask && onTaskUpdate) {
      onTaskUpdate(editedTask)
    }
    toggleEdit(field, isEditingTodo)
  }

  // 変更のキャンセル
  const handleCancel = (field: 'title' | 'description' | string, isEditingTodo: boolean = false) => {
    setEditedTask(selectedTask)
    toggleEdit(field, isEditingTodo)
  }

  // タイトルの更新
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editedTask) {
      setEditedTask({ ...editedTask, title: e.target.value })
    }
  }

  // 概要の更新
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (editedTask) {
      setEditedTask({ ...editedTask, description: e.target.value })
    }
  }

  // TODOの追加、更新、削除時に、タスク全体のアサイン情報を更新する関数
  const updateTaskAssignees = (todos: Todo[], task: Task): string[] => {
    // 各TODOのアサイン情報を集める
    const assigneeIdsSet = new Set<string>();
    
    todos.forEach(todo => {
      if (todo.assigneeId) {
        assigneeIdsSet.add(todo.assigneeId);
      }
    });
    
    // 配列に変換して返す
    return Array.from(assigneeIdsSet);
  };

  // TODOの完了状態の更新
  const handleTodoStatusChange = (todoId: string) => {
    if (editedTask) {
      const updatedTodos = editedTask.todos.map(todo =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      );
      
      const updatedTask = { 
        ...editedTask, 
        todos: updatedTodos
      };
      
      setEditedTask(updatedTask);
      onTaskUpdate?.(updatedTask);
    }
  };

  // TODOの内容の更新
  const handleTodoTextChange = (todoId: string, newText: string) => {
    if (editedTask) {
      const updatedTodos = editedTask.todos.map(todo =>
        todo.id === todoId ? { ...todo, text: newText } : todo
      )
      setEditedTask({ ...editedTask, todos: updatedTodos })
    }
  }

  // 新しいTODOの追加
  const handleAddTodo = () => {
    if (!newTodoText || !editedTask) return

    const today = new Date()
    
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: newTodoText,
      completed: false,
      startDate: today,
      calendarStartDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),
      calendarEndDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0),
      estimatedHours: 1,
      actualHours: 0,
      assigneeId: ''
    }
    
    const updatedTodos = [...editedTask.todos, newTodo];
    
    const updatedTask = {
      ...editedTask,
      todos: updatedTodos
    }
    
    setEditedTask(updatedTask)
    onTaskUpdate?.(updatedTask)
    setNewTodoText('')
  }

  // TODOの削除
  const handleDeleteTodo = (todoId: string) => {
    if (editedTask) {
      const todoToDelete = editedTask.todos.find(todo => todo.id === todoId);
      if (!todoToDelete) return;

      if (window.confirm(`「${todoToDelete.text}」を削除してもよろしいですか？`)) {
        const updatedTodos = editedTask.todos.filter(todo => todo.id !== todoId);
        
        const updatedTask = {
          ...editedTask,
          todos: updatedTodos
        };
        
        setEditedTask(updatedTask);
        onTaskUpdate?.(updatedTask);
      }
    }
  };

  // 進捗率を計算する関数
  const calculateProgress = (todos: Todo[]) => {
    if (todos.length === 0) return 0
    const totalHours = todos.reduce((sum, todo) => sum + todo.estimatedHours, 0)
    const completedHours = todos
      .filter(todo => todo.completed)
      .reduce((sum, todo) => sum + todo.estimatedHours, 0)
    return Math.round((completedHours / totalHours) * 100)
  }

  // TODOの見積もり工数の更新
  const handleEstimatedHoursChange = (todoId: string, hours: number) => {
    if (editedTask) {
      const updatedTodos = editedTask.todos.map(todo =>
        todo.id === todoId ? { ...todo, estimatedHours: hours } : todo
      )
      setEditedTask({ ...editedTask, todos: updatedTodos })
    }
  }

  // ドラッグ終了時の処理
  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(viewModeButtons)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setViewModeButtons(items)
    // 左端のボタンをデフォルトとして localStorage に保存
    localStorage.setItem('defaultViewMode', items[0].id)
  }

  // コンポーネントマウント時にデフォルト表示を適用
  useEffect(() => {
    const defaultMode = localStorage.getItem('defaultViewMode') as ViewMode
    if (defaultMode) {
      setViewMode(defaultMode)
    }
  }, [])

  // ソート関数
  const sortTasks = (tasksToSort: Task[]): Task[] => {
    return [...tasksToSort].sort((a, b) => {
      // 完了タスクを下部に配置
      const aProgress = calculateProgress(a.todos);
      const bProgress = calculateProgress(b.todos);
      if (aProgress === 100 && bProgress !== 100) return 1;
      if (aProgress !== 100 && bProgress === 100) return -1;

      // 通常の並び替え
      if (sortState.field === 'dueDate') {
        const aDate = Math.min(...a.todos.map(todo => todo.startDate instanceof Date ? todo.startDate.getTime() : new Date(todo.startDate as any).getTime()));
        const bDate = Math.min(...b.todos.map(todo => todo.startDate instanceof Date ? todo.startDate.getTime() : new Date(todo.startDate as any).getTime()));
        return sortState.order === 'asc' ? aDate - bDate : bDate - aDate;
      }
      return 0; // デフォルトケース
    });
  };

  const sortedTasks = sortTasks(filteredTasks);

  // 新しいタスクの作成を開始
  const handleInitiateTaskCreation = () => {
    setIsCreatingTask(true);
    if (currentProject) {
      setNewTask({
        title: '',
        description: '',
        todos: [],
        dueDate: new Date(),
      });
    }
  };

  // タスク作成の確定
  const handleCreateTask = () => {
    if (!newTask.title || !currentProject) return;

    const taskToCreate: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      description: newTask.description || '',
      todos: newTaskTodos.length > 0 ? newTaskTodos : getDefaultTodos(),
      dueDate: newTask.dueDate || new Date(),
      completedDateTime: undefined,
      projectId: currentProject.id
    };

    if (onTaskCreate) {
      onTaskCreate(taskToCreate);
      setIsCreatingTask(false);
      setNewTask({
        title: '',
        description: '',
        todos: [],
        dueDate: new Date()
      });
      setNewTaskTodos([]);
      setNewTaskSuggestedTodos([]);
    }
  };

  // 新規タスクにTODOを追加
  const handleAddNewTaskTodo = () => {
    if (!newTaskTodoText) return
    
    const today = new Date()
    
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: newTaskTodoText,
      completed: false,
      startDate: today,
      calendarStartDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),
      calendarEndDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0),
      estimatedHours: 1,
      actualHours: 0,
      assigneeId: ''
    }
    
    setNewTaskTodos([...newTaskTodos, newTodo])
    setNewTaskTodoText('')
  }

  // 新規タスクからTODOを削除
  const handleRemoveNewTaskTodo = (todoId: string) => {
    setNewTaskTodos(newTaskTodos.filter(todo => todo.id !== todoId))
  }

  // 新規タスク用のTODO提案を取得
  const handleSuggestNewTaskTodos = async () => {
    if (!newTask.title) return

    try {
      setIsGeneratingTodos(true)
      const suggestions = await suggestTodos(
        newTask.title,
        newTask.description || '',
        newTaskTodos.map(todo => todo.text)
      )
      setNewTaskSuggestedTodos(suggestions)
    } catch (error) {
      console.error('Error getting todo suggestions:', error)
      setErrorMessage(error instanceof Error ? error.message : 'TODOの提案中にエラーが発生しました。')
    } finally {
      setIsGeneratingTodos(false)
    }
  }

  // 提案されたTODOを新規タスクに追加
  const handleAddSuggestedNewTaskTodo = (suggestion: { text: string; estimatedHours: number }) => {
    const today = new Date()
    
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: suggestion.text,
      completed: false,
      startDate: today,
      calendarStartDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),
      calendarEndDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0),
      estimatedHours: suggestion.estimatedHours,
      actualHours: 0,
      assigneeId: ''
    }

    const updatedTodos = [...newTaskTodos, newTodo];
    
    setNewTaskTodos(updatedTodos)
    
    // 追加したTODOを提案リストから削除
    setNewTaskSuggestedTodos(prev => prev.filter(todo => todo.text !== suggestion.text))
  }

  // 並び替えの切り替え
  const toggleSort = (field: SortField) => {
    setSortState(prev => ({
      field,
      order: prev.field === field ? (prev.order === 'asc' ? 'desc' : 'asc') : 'asc'
    }))
  }

  // デフォルトのTODOを生成
  const getDefaultTodos = (): Todo[] => {
    const today = new Date();
    const dueDateCopy = newTask.dueDate ? new Date(newTask.dueDate) : new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return [
      {
        id: `todo-${Date.now()}-1`,
        text: '開始',
        completed: false,
        startDate: today,
        calendarStartDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),
        calendarEndDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0),
        estimatedHours: 1,
        actualHours: 0,
        assigneeId: ''
      },
      {
        id: `todo-${Date.now()}-2`,
        text: '完了',
        completed: false,
        startDate: dueDateCopy,
        calendarStartDateTime: new Date(dueDateCopy.getFullYear(), dueDateCopy.getMonth(), dueDateCopy.getDate(), 15, 0, 0),
        calendarEndDateTime: new Date(dueDateCopy.getFullYear(), dueDateCopy.getMonth(), dueDateCopy.getDate(), 17, 0, 0),
        estimatedHours: 1,
        actualHours: 0,
        assigneeId: ''
      }
    ];
  };

  // メイン部分のレンダリング関数
  const renderContent = () => {
    if (!selectedTask) {
      return (
        <div className="flex flex-col items-center justify-center h-[80vh] p-6 bg-white rounded-lg shadow">
          <div className="text-center mb-4">
            <IoList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">タスク詳細</h3>
            <p className="text-gray-500 mb-4">左側のTODOを選択すると、タスクの詳細情報が表示されます。</p>
          </div>
          <Link href="/tasks" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
            タスク一覧へ
          </Link>
        </div>
      );
    }

    // 選択されたタスクがある場合は、通常のタスク詳細を表示
    return (
      <div className="bg-white rounded-lg p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-4 group">
          <div className="flex-1 flex items-center gap-2">
            {editState.title ? (
              <>
                <input
                  type="text"
                  value={editedTask?.title}
                  onChange={handleTitleChange}
                  className="text-xl font-bold text-gray-800 w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={() => handleSave('title')}
                  className="p-1 text-green-600 hover:text-green-700"
                >
                  <IoSave className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleCancel('title')}
                  className="p-1 text-red-600 hover:text-red-700"
                >
                  <IoClose className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onTaskSelect('')}
                  className="p-1 text-gray-500 hover:text-gray-700 mr-2"
                >
                  ←戻る
                </button>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-800">{selectedTask.title}</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="text-sm text-gray-500">
                      進捗率: {calculateProgress(selectedTask.todos)}%
                    </div>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${calculateProgress(selectedTask.todos)}%`,
                          background: `linear-gradient(to right, rgb(219, 234, 254), rgb(37, 99, 235))`
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="ml-2 flex items-center">
                  <div className="text-sm mr-4">
                    <span className="text-gray-500 mr-1">担当:</span>
                    <div className="text-sm text-gray-600">
                      {(() => {
                        // タスクの担当者を子TODOから計算
                        const assigneeIds = new Set<string>();
                        selectedTask.todos.forEach(todo => {
                          if (todo.assigneeId) {
                            assigneeIds.add(todo.assigneeId);
                          }
                        });
                        const assigneeIdArray = Array.from(assigneeIds);
                        return assigneeIdArray.length > 0 
                          ? getUserNamesByIds(assigneeIdArray)
                          : '担当者なし';
                      })()}
                    </div>
                  </div>
                  {!editState.title && (
                    <button
                      onClick={() => toggleEdit('title')}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600"
                    >
                      <IoPencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mb-4 group">
          {editState.description ? (
            <div className="flex gap-2">
              <textarea
                value={editedTask?.description}
                onChange={handleDescriptionChange}
                className="w-full h-24 p-2 text-gray-600 border rounded-md focus:border-blue-500 focus:outline-none"
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSave('description')}
                  className="p-1 text-green-600 hover:text-green-700"
                >
                  <IoSave className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleCancel('description')}
                  className="p-1 text-red-600 hover:text-red-700"
                >
                  <IoClose className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <p className="flex-1 text-gray-600 whitespace-pre-wrap">{selectedTask.description}</p>
              <button
                onClick={() => toggleEdit('description')}
                className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-600 self-start"
              >
                <IoPencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {selectedTask.todos.map((todo) => (
            <div 
              key={todo.id} 
              className={`flex items-center group ${
                selectedTodoId === todo.id ? 'bg-blue-50 border border-blue-200 rounded-lg p-2 -ml-2' : 'p-2 -ml-2'
              }`}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleTodoStatusChange(todo.id)}
                className="w-5 h-5 mr-3"
              />
              {editState.todos[todo.id] ? (
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={todo.text}
                      onChange={(e) => handleTodoTextChange(todo.id, e.target.value)}
                      className="w-full text-gray-800 border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-500">見積もり工数:</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={todo.estimatedHours}
                        onChange={(e) => handleEstimatedHoursChange(todo.id, parseFloat(e.target.value) || 0)}
                        className="w-20 text-sm border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                      />
                      <span className="text-sm text-gray-500">時間</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSave(todo.id, true)}
                    className="p-1 text-green-600 hover:text-green-700"
                  >
                    <IoSave className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleCancel(todo.id, true)}
                    className="p-1 text-red-600 hover:text-red-700"
                  >
                    <IoClose className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1">
                    <span className={`text-gray-800 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                      {todo.text}
                    </span>
                    <div className="text-xs text-gray-500 mt-1 space-y-1">
                      <div>着手予定日: {format(todo.startDate, 'yyyy年M月d日', { locale: ja })}</div>
                      <div>見積もり工数: {todo.estimatedHours}時間</div>
                      <div className="flex items-center gap-1">
                        <span>担当:</span>
                        <UserAssignSelect
                          assigneeIds={[todo.assigneeId].filter(Boolean)}
                          onAssigneeChange={(newAssigneeIds) => {
                            // TODOの担当者を更新
                            const newAssigneeId = newAssigneeIds.length > 0 ? newAssigneeIds[0] : '';
                            const updatedTodo = { ...todo, assigneeId: newAssigneeId };
                            
                            // タスクのTODOリストを更新
                            const updatedTodos = selectedTask.todos.map(t => 
                              t.id === todo.id ? updatedTodo : t
                            );
                            
                            // 全体のタスク情報を更新
                            const updatedTask = {
                              ...selectedTask,
                              todos: updatedTodos
                            };
                            
                            if (editedTask) {
                              setEditedTask(updatedTask);
                            }
                            onTaskUpdate?.(updatedTask);
                          }}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => toggleEdit(todo.id, true)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <IoPencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="p-1 text-red-500 hover:text-red-600"
                    >
                      <IoTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center mt-4">
            <div className="flex-1 flex">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder="新しいTODOを追加"
                className="flex-1 p-2 border rounded-l-md focus:border-blue-500 focus:outline-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTodo()
                  }
                }}
              />
              <button
                onClick={handleAddTodo}
                className="p-2 text-white bg-blue-500 hover:bg-blue-600 rounded-r-md"
              >
                <IoAdd className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={async () => {
                try {
                  setIsSuggestingTodos(true);
                  const suggestions = await suggestTodos(
                    selectedTask.title,
                    selectedTask.description,
                    selectedTask.todos.map(todo => todo.text)
                  );
                  setSuggestedTodos(suggestions);
                } catch (error) {
                  console.error('Error getting todo suggestions:', error);
                  setErrorMessage(error instanceof Error ? error.message : 'TODOの提案中にエラーが発生しました。');
                } finally {
                  setIsSuggestingTodos(false);
                }
              }}
              disabled={isSuggestingTodos}
              className={`ml-2 p-2 rounded-md flex items-center gap-1 ${
                isSuggestingTodos
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
              title="AIにTODOを提案してもらう"
            >
              <IoBulb className="w-5 h-5" />
              <span className="hidden sm:inline">AI提案</span>
            </button>
          </div>

          {/* AI提案中のローディング表示 */}
          {isSuggestingTodos && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-yellow-500 mr-3"></div>
              <p className="text-yellow-700">AIがTODOを提案中...</p>
            </div>
          )}

          {/* AI提案のTODOリスト */}
          {suggestedTodos.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <IoBulb className="w-4 h-4 text-yellow-600" />
                AIからのTODO提案
              </h4>
              <div className="space-y-2">
                {suggestedTodos.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white p-2 rounded border border-yellow-200"
                  >
                    <div className="flex-1">
                      <div className="text-sm text-gray-800">{suggestion.text}</div>
                      <div className="text-xs text-gray-500">
                        見積もり工数: {suggestion.estimatedHours}時間
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!editedTask) return;
                        
                        const today = new Date();
                        
                        const newTodo: Todo = {
                          id: `todo-${Date.now()}`,
                          text: suggestion.text,
                          completed: false,
                          startDate: today,
                          calendarStartDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),
                          calendarEndDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0),
                          estimatedHours: suggestion.estimatedHours,
                          actualHours: 0,
                          assigneeId: ''
                        };
                        
                        const updatedTodos = [...editedTask.todos, newTodo];
                        
                        const updatedTask = {
                          ...editedTask,
                          todos: updatedTodos
                        };
                        
                        setEditedTask(updatedTask);
                        onTaskUpdate?.(updatedTask);
                        
                        // 追加したTODOを提案リストから削除
                        setSuggestedTodos(prev => prev.filter((_, i) => i !== index));
                      }}
                      className="ml-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      title="このTODOを採用"
                    >
                      採用
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <div className="text-sm text-red-600">
                {errorMessage}
              </div>
            </div>
          )}
        </div>

        {/* タスクの期日表示 */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <FaClock className="text-gray-500" />
            <span className="font-semibold text-gray-700">期日:</span>
            {selectedTask.todos.length > 0 ? (
              <span className={getDueDateStyle(Math.min(...selectedTask.todos.map(todo => todo.startDate.getTime())))}>
                {format(
                  new Date(Math.min(...selectedTask.todos.map(todo => todo.startDate.getTime()))),
                  'yyyy年M月d日',
                  { locale: ja }
                )}
              </span>
            ) : (
              <span className="text-gray-500">未設定</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // タスク一覧表示のレンダリング
  const renderTaskList = () => {
    return renderContent();
  };

  return (
    <div className="h-full">
      {renderTaskList()}

      {/* タスク作成フォーム */}
      {isCreatingTask && (
        <TaskCreationForm
          onCancel={() => {
            setIsCreatingTask(false);
            setNewTaskTodos([]);
            setNewTaskTodoText('');
            setNewTaskSuggestedTodos([]);
          }}
          onTaskCreate={(task) => {
            onTaskCreate?.(task);
            setIsCreatingTask(false);
            setNewTaskTodos([]);
            setNewTaskTodoText('');
            setNewTaskSuggestedTodos([]);
          }}
          projectId={currentProject?.id}
          title="新しいタスクを作成"
        />
      )}
    </div>
  )
} 