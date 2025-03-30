'use client';

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useAuth } from '@/services/auth/hooks/useAuth'
import Auth from '@/services/auth/components/Auth'
import { Task } from '@/features/tasks/types/task'
import { useTaskContext } from '@/features/tasks/contexts/TaskContext'
import { useProjectContext } from '@/features/projects/contexts/ProjectContext'
import UserFilter from '@/components/UserFilter'
import { FilterProvider } from '@/features/tasks/filters/FilterContext'
import EmptyProjectState from '@/features/projects/components/EmptyProjectState'
import { getUserNameById, getUserNamesByIds } from '@/features/tasks/utils/userUtils'
import { format, isBefore, isToday, startOfDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { IoAdd, IoList, IoGrid, IoBarChart, IoCaretDown, IoCaretUp, IoClose } from 'react-icons/io5'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import KanbanView from '@/features/kanban/components/KanbanView'
import GanttChartView from '@/features/gantt/components/GanttChartView'
import TaskCreationForm from '@/features/tasks/components/TaskCreationForm'
import TaskDetail from '@/features/tasks/components/TaskDetail'

type ViewMode = 'list' | 'kanban' | 'gantt'

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

export default function TasksPage() {
  const { isAuthenticated, user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('tasks')
  const { filteredTasks, addTask, setTasks } = useTaskContext()
  const { projects, currentProject } = useProjectContext()
  const [isCreatingTask, setIsCreatingTask] = useState(false)
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
  // タスク詳細モーダル用の状態を追加
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null)
  
  // 期日の状態に応じたスタイルを返す関数
  const getDueDateStyle = (dueDate: Date | string | undefined) => {
    if (!dueDate) return '';
    
    const today = startOfDay(new Date());
    const dueDateObj = dueDate instanceof Date ? dueDate : new Date(dueDate);
    
    if (isBefore(dueDateObj, today)) {
      return 'text-red-500'; // 期日超過
    }
    if (isToday(dueDateObj)) {
      return 'text-orange-500'; // 今日が期日
    }
    return 'text-blue-500'; // 期日が近い
  };

  // タスクの選択処理を修正
  const handleTaskSelect = (taskId: string, todoId?: string) => {
    setSelectedTaskId(taskId);
    if (todoId) {
      setSelectedTodoId(todoId);
    }
    setIsTaskDetailModalOpen(true);
  };

  // タスク詳細モーダルを閉じる
  const handleCloseTaskDetail = () => {
    setIsTaskDetailModalOpen(false);
    setSelectedTaskId(null);
    setSelectedTodoId(null);
  };

  // タスクの作成処理
  const handleTaskCreate = (newTask: Task) => {
    // プロジェクトIDを設定
    if (currentProject) {
      newTask.projectId = currentProject.id;
    }
    addTask(newTask);
    setIsCreatingTask(false);
  };

  // タスクの更新処理
  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prevTasks) => {
      return prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task));
    });
  };

  // 進捗率を計算する関数
  const calculateProgress = (todos: Task["todos"]) => {
    if (todos.length === 0) return 0
    const totalHours = todos.reduce((sum, todo) => sum + todo.estimatedHours, 0)
    const completedHours = todos
      .filter(todo => todo.completed)
      .reduce((sum, todo) => sum + todo.estimatedHours, 0)
    return Math.round((completedHours / totalHours) * 100)
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

  // 並び替えの切り替え
  const toggleSort = (field: SortField) => {
    setSortState(prev => ({
      field,
      order: prev.field === field ? (prev.order === 'asc' ? 'desc' : 'asc') : 'asc'
    }))
  }

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

  // 選択されたタスクを取得
  const selectedTask = selectedTaskId 
    ? filteredTasks.find(task => task.id === selectedTaskId) || null 
    : null;

  if (!isAuthenticated) {
    return <Auth onLogin={login} />;
  }

  // プロジェクトが存在しない場合は専用画面を表示
  if (projects.length === 0) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="flex-shrink-0">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onLogout={logout} user={user} />
          <main className="flex-1 overflow-y-auto">
            <EmptyProjectState />
          </main>
        </div>
      </div>
    );
  }

  return (
    <FilterProvider>
      <div className="flex h-screen bg-gray-100">
        <div className="flex-shrink-0">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onLogout={logout} user={user} />
          <main className="flex-1 overflow-y-auto p-4">
            {/* ユーザーフィルター */}
            <div className="mb-4">
              <UserFilter />
            </div>
            
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
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
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto mt-1">
                {viewMode === 'list' && (
                  <div className="space-y-4 pr-2 p-4">
                    {sortedTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleTaskSelect(task.id)}
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
                          <div className="flex items-center gap-2">
                            <span>期日:</span>
                            <span>
                              {task.todos.length > 0
                                ? format(
                                    new Date(Math.min(...task.todos.map(todo => todo.startDate.getTime()))),
                                    'yyyy年M月d日',
                                    { locale: ja }
                                  )
                                : '未設定'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {viewMode === 'kanban' && (
                  <div className="flex-1 overflow-x-auto p-4">
                    <KanbanView 
                      tasks={sortedTasks} 
                      projectId={currentProject?.id || ''} 
                      onTaskSelect={handleTaskSelect}
                      onTaskUpdate={handleTaskUpdate}
                      onTaskCreate={handleTaskCreate}
                    />
                  </div>
                )}

                {viewMode === 'gantt' && (
                  <div className="p-4">
                    <GanttChartView
                      onTaskSelect={handleTaskSelect}
                      onTaskCreate={handleTaskCreate}
                      onTaskUpdate={handleTaskUpdate}
                      projectId={currentProject?.id || ''}
                    />
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* タスク作成フォーム */}
      {isCreatingTask && (
        <TaskCreationForm
          onCancel={() => setIsCreatingTask(false)}
          onTaskCreate={handleTaskCreate}
          projectId={currentProject?.id}
          title="新しいタスクを作成"
        />
      )}

      {/* タスク詳細モーダル */}
      {isTaskDetailModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-xl font-bold text-gray-800">タスク詳細</h2>
              <button 
                onClick={handleCloseTaskDetail}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <IoClose className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <TaskDetail
                selectedTask={selectedTask}
                selectedTodoId={selectedTodoId}
                onTaskUpdate={handleTaskUpdate}
                tasks={filteredTasks}
                onTaskSelect={() => {}}
                onTaskCreate={handleTaskCreate}
              />
            </div>
          </div>
        </div>
      )}
    </FilterProvider>
  );
} 