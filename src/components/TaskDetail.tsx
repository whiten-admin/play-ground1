'use client'

import React, { useState, useEffect, useRef } from 'react'
import { IoAdd, IoTrash, IoPencil, IoSave, IoClose, IoBulb, IoList, IoGrid, IoBarChart, IoCaretDown, IoCaretUp, IoFilter, IoCheckbox } from 'react-icons/io5'
import { Task, Todo } from '@/types/task'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { suggestTodos } from '@/utils/openai'
import KanbanView from './KanbanView'
import GanttChartView from './GanttChartView'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { getUserNameById, getUserNamesByIds, getAllUsers } from '@/utils/userUtils'
import UserAssignSelect from './UserAssignSelect'
import { User } from '@/types/user'
import { useFilterContext } from '@/contexts/FilterContext'
import { useProjectContext } from '@/contexts/ProjectContext'
import TaskCreationForm from './TaskCreationForm'

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

type SortField = 'dueDate' | 'priority'
type SortOrder = 'asc' | 'desc'

interface SortState {
  field: SortField
  order: SortOrder
}

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
    priority: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [newTaskTodos, setNewTaskTodos] = useState<Todo[]>([])
  const [newTaskTodoText, setNewTaskTodoText] = useState('')
  const [isGeneratingTodos, setIsGeneratingTodos] = useState(false)
  const [newTaskSuggestedTodos, setNewTaskSuggestedTodos] = useState<{ text: string; estimatedHours: number }[]>([])
  
  // フィルタリングコンテキストを使用
  const { selectedUserIds, showUnassigned } = useFilterContext();
  
  // 表示するタスクをフィルタリングする
  const filteredTasks = tasks.filter((task) => {
    // アサインされていないタスクを表示するかどうか
    if (showUnassigned && (!task.assigneeIds || task.assigneeIds.length === 0)) {
      return true;
    }
    
    // 選択されたユーザーのタスクを表示
    if (task.assigneeIds && task.assigneeIds.some(id => selectedUserIds.includes(id))) {
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
      if (todo.assigneeIds && todo.assigneeIds.length > 0) {
        todo.assigneeIds.forEach(id => assigneeIdsSet.add(id));
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
      
      // タスク全体のアサイン情報を更新
      const updatedAssigneeIds = updateTaskAssignees(updatedTodos, editedTask);
      
      const updatedTask = { 
        ...editedTask, 
        todos: updatedTodos,
        assigneeIds: updatedAssigneeIds
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
    const formattedDate = today.toISOString().split('T')[0] // YYYY-MM-DD形式
    
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: newTodoText,
      completed: false,
      startDate: formattedDate,
      endDate: formattedDate,
      dueDate: new Date(),
      estimatedHours: 0,
      assigneeIds: []
    }
    
    const updatedTodos = [...editedTask.todos, newTodo];
    
    // タスク全体のアサイン情報を更新
    const updatedAssigneeIds = updateTaskAssignees(updatedTodos, editedTask);
    
    const updatedTask = {
      ...editedTask,
      todos: updatedTodos,
      assigneeIds: updatedAssigneeIds
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
        
        // タスク全体のアサイン情報を更新
        const updatedAssigneeIds = updateTaskAssignees(updatedTodos, editedTask);
        
        const updatedTask = {
          ...editedTask,
          todos: updatedTodos,
          assigneeIds: updatedAssigneeIds
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

  // 並び替え関数
  const sortTasks = (tasksToSort: Task[]) => {
    return [...tasksToSort].sort((a, b) => {
      // 完了タスクを下部に配置
      const aProgress = calculateProgress(a.todos);
      const bProgress = calculateProgress(b.todos);
      if (aProgress === 100 && bProgress !== 100) return 1;
      if (aProgress !== 100 && bProgress === 100) return -1;

      // 通常の並び替え
      if (sortState.field === 'dueDate') {
        const aDate = Math.min(...a.todos.map(todo => todo.dueDate.getTime()));
        const bDate = Math.min(...b.todos.map(todo => todo.dueDate.getTime()));
        return sortState.order === 'asc' ? aDate - bDate : bDate - aDate;
      } else {
        const aPriority = a.priority ?? 0;  // デフォルト値を0に設定
        const bPriority = b.priority ?? 0;  // デフォルト値を0に設定
        return sortState.order === 'asc' ? aPriority - bPriority : bPriority - aPriority;
      }
    });
  }

  // 並び替えの切り替え
  const toggleSort = (field: SortField) => {
    setSortState(prev => ({
      field,
      order: prev.field === field ? (prev.order === 'asc' ? 'desc' : 'asc') : 'asc'
    }))
  }

  // 新規タスクを作成する関数
  const handleCreateTask = () => {
    if (!newTask.title || !currentProject) return

    // タスク全体のアサイン情報を更新
    const assigneeIds = updateTaskAssignees(newTaskTodos, { 
      id: '', 
      title: '', 
      description: '', 
      todos: newTaskTodos, 
      startDate: '', 
      endDate: '',
      projectId: currentProject.id 
    });

    const taskToCreate: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      description: newTask.description || '',
      todos: newTaskTodos,
      startDate: newTask.startDate || new Date().toISOString().split('T')[0],
      endDate: newTask.endDate || new Date().toISOString().split('T')[0],
      priority: newTask.priority || 0,
      assigneeIds: assigneeIds,
      projectId: currentProject.id
    }

    onTaskCreate?.(taskToCreate)
    setIsCreatingTask(false)
    setNewTask({
      title: '',
      description: '',
      todos: [],
      priority: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    })
    setNewTaskTodos([])
    setNewTaskTodoText('')
    setNewTaskSuggestedTodos([])
  }

  // 新規タスクにTODOを追加
  const handleAddNewTaskTodo = () => {
    if (!newTaskTodoText) return
    
    const today = new Date()
    const formattedDate = today.toISOString().split('T')[0] // YYYY-MM-DD形式
    
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: newTaskTodoText,
      completed: false,
      startDate: formattedDate,
      endDate: formattedDate,
      dueDate: new Date(),
      estimatedHours: 0,
      assigneeIds: []
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
    const formattedDate = today.toISOString().split('T')[0] // YYYY-MM-DD形式
    
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: suggestion.text,
      completed: false,
      startDate: formattedDate,
      endDate: formattedDate,
      dueDate: new Date(),
      estimatedHours: suggestion.estimatedHours,
      assigneeIds: []
    }

    const updatedTodos = [...newTaskTodos, newTodo];
    
    setNewTaskTodos(updatedTodos)
    
    // 追加したTODOを提案リストから削除
    setNewTaskSuggestedTodos(prev => prev.filter(todo => todo.text !== suggestion.text))
  }

  // タスク一覧表示のレンダリング
  const renderTaskList = () => {
    return (
      <div className="bg-white rounded-lg shadow p-3 h-[90vh] flex flex-col">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-800">タスク一覧</h2>
              <button
                onClick={() => setIsCreatingTask(true)}
                className="px-2 py-0.5 text-xs rounded flex items-center gap-1 bg-blue-500 text-white hover:bg-blue-600"
              >
                <IoAdd className="w-3 h-3" />
                タスク追加
              </button>
            </div>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="viewModeButtons" direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex gap-1"
                  >
                    {viewModeButtons.map((button, index) => (
                      <Draggable key={button.id} draggableId={button.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="relative"
                          >
                            <button
                              onClick={() => setViewMode(button.id)}
                              className={`p-2 rounded ${
                                viewMode === button.id
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              } ${index === 0 ? 'border-2 border-gray-300' : ''}`}
                              title={button.label}
                            >
                              {button.icon}
                            </button>
                            {index === 0 && (
                              <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2">
                                <span className="text-xs text-gray-500">Default</span>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {viewMode === 'list' && (
            <div className="flex justify-end border-b pb-2">
              <div className="flex gap-1 items-center">
                <button
                  onClick={() => toggleSort('dueDate')}
                  className={`px-2 py-0.5 text-xs rounded flex items-center gap-1 ${
                    sortState.field === 'dueDate'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  期日
                  {sortState.field === 'dueDate' && (
                    sortState.order === 'asc' ? <IoCaretUp className="w-3 h-3" /> : <IoCaretDown className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={() => toggleSort('priority')}
                  className={`px-2 py-0.5 text-xs rounded flex items-center gap-1 ${
                    sortState.field === 'priority'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  優先度
                  {sortState.field === 'priority' && (
                    sortState.order === 'asc' ? <IoCaretUp className="w-3 h-3" /> : <IoCaretDown className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto mt-1">
          {viewMode === 'list' && (
            <div className="space-y-4 pr-2">
              {sortTasks(filteredTasks).map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskSelect(task.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    calculateProgress(task.todos) === 100
                      ? 'bg-gray-50 opacity-60'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex-shrink-0">{task.title}</h3>
                    <div className="flex items-center gap-4 ml-auto">
                      <div className="text-sm text-gray-500 whitespace-nowrap">
                        TODO: {task.todos.length}件
                      </div>
                      <div className="flex items-center gap-2 border-l pl-4">
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${calculateProgress(task.todos)}%`,
                              background: `linear-gradient(to right, rgb(219, 234, 254), rgb(37, 99, 235))`
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {calculateProgress(task.todos)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{task.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <span>期日:</span>
                      <span>
                        {task.todos.length > 0
                          ? format(
                              new Date(Math.min(...task.todos.map(todo => todo.dueDate.getTime()))),
                              'yyyy年M月d日',
                              { locale: ja }
                            )
                          : '未設定'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>優先度:</span>
                      <span className={`px-2 py-0.5 rounded ${
                        task.priority === 2
                          ? 'bg-red-100 text-red-800'
                          : task.priority === 1
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {task.priority === 2 ? '高' : task.priority === 1 ? '中' : '低'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>担当:</span>
                      <span>{getUserNamesByIds(task.assigneeIds)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'kanban' && (
            <div className="flex-1 overflow-x-auto">
              <KanbanView 
                tasks={sortTasks(filteredTasks)} 
                projectId={currentProject?.id || ''} 
                onTaskSelect={onTaskSelect}
                onTaskUpdate={onTaskUpdate}
                onTaskCreate={onTaskCreate}
              />
            </div>
          )}

          {viewMode === 'gantt' && (
            <GanttChartView
              onTaskSelect={onTaskSelect}
              onTaskCreate={onTaskCreate}
              onTaskUpdate={onTaskUpdate}
              projectId={currentProject?.id || ''}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      {selectedTask ? (
        /* タスク詳細の表示 */
        <div className="bg-white rounded-lg p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4 group">
            <div className="flex-1 flex items-center gap-2">
              {editState.title ? (
                <>
                  <input
                    type="text"
                    value={selectedTask.title}
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
                        {selectedTask.assigneeIds && selectedTask.assigneeIds.length > 0 
                          ? getUserNamesByIds(selectedTask.assigneeIds)
                          : '担当者なし'
                        }
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
                  value={selectedTask.description}
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
                        <div>期日: {format(todo.dueDate, 'yyyy年M月d日', { locale: ja })}</div>
                        <div>見積もり工数: {todo.estimatedHours}時間</div>
                        <div className="flex items-center gap-1">
                          <span>担当:</span>
                          <UserAssignSelect
                            assigneeIds={todo.assigneeIds || []}
                            onAssigneeChange={(newAssigneeIds) => {
                              // TODOの担当者を更新
                              const updatedTodo = { ...todo, assigneeIds: newAssigneeIds };
                              
                              // タスクのTODOリストを更新
                              const updatedTodos = selectedTask.todos.map(t => 
                                t.id === todo.id ? updatedTodo : t
                              );
                              
                              // タスク全体のアサイン情報を更新
                              const updatedAssigneeIds = updateTaskAssignees(updatedTodos, selectedTask);
                              
                              // 全体のタスク情報を更新
                              const updatedTask = {
                                ...selectedTask,
                                todos: updatedTodos,
                                assigneeIds: updatedAssigneeIds
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
                          const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD形式
                          
                          const newTodo: Todo = {
                            id: `todo-${Date.now()}`,
                            text: suggestion.text,
                            completed: false,
                            startDate: formattedDate,
                            endDate: formattedDate,
                            dueDate: new Date(),
                            estimatedHours: suggestion.estimatedHours,
                            assigneeIds: []
                          };
                          
                          const updatedTodos = [...editedTask.todos, newTodo];
                          
                          // タスク全体のアサイン情報を更新
                          const updatedAssigneeIds = updateTaskAssignees(updatedTodos, editedTask);
                          
                          const updatedTask = {
                            ...editedTask,
                            todos: updatedTodos,
                            assigneeIds: updatedAssigneeIds
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
        </div>
      ) : (
        /* タスクが選択されていない場合はタスク一覧を表示 */
        renderTaskList()
      )}

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