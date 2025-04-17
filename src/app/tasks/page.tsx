'use client';

import { useState, useEffect, Suspense } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useAuth } from '@/services/auth/hooks/useAuth'
import Auth from '@/services/auth/components/Auth'
import { Task } from '@/features/tasks/types/task'
import { useTaskContext } from '@/features/tasks/contexts/TaskContext'
import { useProjectContext } from '@/features/projects/contexts/ProjectContext'
import UserFilter from '@/components/UserFilter'
import { FilterProvider, useFilterContext } from '@/features/tasks/filters/FilterContext'
import EmptyProjectState from '@/features/projects/components/EmptyProjectState'
import { format, isBefore, isToday, startOfDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { IoAdd, IoList, IoGrid, IoBarChart, IoCaretDown, IoCaretUp, IoClose, IoBulb, IoDocumentText, IoCheckmarkCircle } from 'react-icons/io5'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import KanbanView from '@/features/kanban/components/KanbanView'
import GanttChartView from '@/features/gantt/components/GanttChartView'
import TaskCreationForm from '@/features/tasks/components/TaskCreationForm'
import TaskDetail from '@/features/tasks/components/TaskDetail'
import { AiTaskSuggestions } from '@/features/tasks/components/AiTaskSuggestions'
import RequirementsTaskGenerator from '@/features/tasks/components/RequirementsTaskGenerator'
import { useSearchParams } from 'next/navigation'
import { getProjectUsers } from '@/utils/memberUtils'

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

// 新規プロジェクト作成後のガイドポップアップコンポーネント
function NewProjectGuidePopup({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) {
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl z-50 overflow-hidden transition-all duration-300 opacity-100 transform translate-y-0">
      <div className="bg-green-500 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <IoCheckmarkCircle className="text-white w-6 h-6 mr-2" />
          <h3 className="text-white font-bold">プロジェクト作成完了</h3>
        </div>
        <button onClick={onClose} className="text-white hover:text-green-100">
          <IoClose className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4">
        <p className="text-gray-700 mb-3">おめでとうございます！プロジェクトが正常に作成されました。</p>
        <p className="text-gray-700 mb-3">次のステップとして、プロジェクトのタスクを作成しましょう。「+ タスク追加」ボタンをクリックし、プロジェクトを進めていきましょう。</p>
        <div className="mt-2 flex justify-end">
          <button
            onClick={onClose}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

// Suspenseバウンダリの中でuseSearchParamsを使用するコンポーネント
function ProjectGuideHandler({ onShowGuide }: { onShowGuide: (show: boolean) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const isNewProject = searchParams?.get('newProject') === 'true';
    if (isNewProject) {
      onShowGuide(true);
      
      // 10秒後に自動的に閉じる
      const timer = setTimeout(() => {
        onShowGuide(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams, onShowGuide]);
  
  return null;
}

// FilterProvider内で使用するユーザーフィルタリングのためのコンポーネント
interface TasksContentProps {
  user: any;
  logout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentProject: any;
  filteredTasks: Task[];
  sortTasks: (tasks: Task[]) => Task[];
  calculateProgress: (todos: Task["todos"]) => number;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isCreatingTask: boolean;
  setIsCreatingTask: (isCreating: boolean) => void;
  handleTaskCreate: (task: Task) => void;
  handleTaskUpdate: (task: Task) => void;
  handleTaskSelect: (taskId: string, todoId?: string) => void;
  selectedTask: Task | null;
  selectedTodoId: string | null;
  isTaskDetailModalOpen: boolean;
  handleCloseTaskDetail: () => void;
  showAiSuggestions: boolean;
  setShowAiSuggestions: (show: boolean) => void;
  handleAddAiTask: (task: Task) => void;
  showRequirementsGenerator: boolean;
  setShowRequirementsGenerator: (show: boolean) => void;
  handleAddRequirementsTasks: (tasks: Task[]) => void;
  showNewProjectGuide: boolean;
  setShowNewProjectGuide: (show: boolean) => void;
  sortState: SortState;
  toggleSort: (field: SortField) => void;
}

function TasksContent({
  user,
  logout,
  activeTab,
  setActiveTab,
  currentProject,
  filteredTasks,
  sortTasks,
  calculateProgress,
  viewMode,
  setViewMode,
  isCreatingTask,
  setIsCreatingTask,
  handleTaskCreate,
  handleTaskUpdate,
  handleTaskSelect,
  selectedTask,
  selectedTodoId,
  isTaskDetailModalOpen,
  handleCloseTaskDetail,
  showAiSuggestions,
  setShowAiSuggestions,
  handleAddAiTask,
  showRequirementsGenerator,
  setShowRequirementsGenerator,
  handleAddRequirementsTasks,
  showNewProjectGuide,
  setShowNewProjectGuide,
  sortState,
  toggleSort
}: TasksContentProps) {
  // ここでFilterContextのデータを使用する
  const { selectedUserIds, showUnassigned, currentUserId } = useFilterContext();
  const { getProjectMembers } = useProjectContext();
  
  // プロジェクトに所属するメンバーを取得
  const projectMembers = currentProject 
    ? getProjectMembers(currentProject.id)
    : [];
    
  // プロジェクトメンバーとユーザー情報を結合 (UserFilter.tsxから流用)
  const projectMemberUsers = currentProject 
    ? projectMembers.map(member => {
        // プロジェクトユーザーを直接取得
        const projectUsers = getProjectUsers(currentProject.id);
        const userInfo = projectUsers.find(u => u.id === member.userId);
        
        return {
          assigneeId: member.id,
          userId: member.userId,
          name: userInfo ? userInfo.name : '不明なユーザー',
          isCurrentUser: member.userId === currentUserId
        };
      })
    : [];
  
  // 担当者のアイコン表示に使用するユーザー情報を取得
  const getUserInfo = (assigneeId: string) => {
    const member = projectMemberUsers.find(m => m.assigneeId === assigneeId);
    return member || null;
  };
  
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
  
  // ユーザーフィルターを適用する
  const userFilteredTasks = filteredTasks.filter((task) => {
    // 各タスクのTODOから担当者リストを作成
    const taskAssignees = new Set<string>();
    task.todos.forEach((todo) => {
      if (todo.assigneeId) {
        taskAssignees.add(todo.assigneeId);
      }
    });

    // アサインされていないタスクを表示するかどうか
    if (showUnassigned && taskAssignees.size === 0) {
      return true;
    }

    // 選択されたユーザーのタスクを表示
    if (Array.from(taskAssignees).some((id) => selectedUserIds.includes(id))) {
      return true;
    }

    return false;
  });

  const sortedTasks = sortTasks(userFilteredTasks);
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Suspenseバウンダリの中でuseSearchParamsを使用 */}
      <Suspense fallback={null}>
        <ProjectGuideHandler onShowGuide={setShowNewProjectGuide} />
      </Suspense>
      
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={logout} user={user} project={currentProject || undefined} />
        <main className="flex-1 overflow-y-auto p-4 relative z-0">
          {/* ユーザーフィルターとアクションボタンを横並びに */}
          <div className="mb-2 flex justify-between items-center">
            <div className="flex-grow">
              <UserFilter />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCreatingTask(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <IoAdd className="w-5 h-5" />
                <span>タスク追加</span>
              </button>
              <button
                onClick={() => setShowRequirementsGenerator(true)}
                className="px-3 py-2 rounded-md border border-green-300 text-green-600 bg-white hover:bg-green-50 flex items-center gap-2"
              >
                <IoDocumentText className="w-5 h-5" />
                <span className="text-sm">要件から一括生成</span>
              </button>
              <button
                onClick={() => setShowAiSuggestions(!showAiSuggestions)}
                className="px-3 py-2 rounded-md border border-purple-300 text-purple-600 bg-white hover:bg-purple-50 flex items-center gap-2"
              >
                <IoBulb className="w-5 h-5" />
                <span className="text-sm">AIヌケモレチェック</span>
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow">
            {showAiSuggestions && (
              <div className="border-b">
                <AiTaskSuggestions onAddTask={handleAddAiTask} />
              </div>
            )}
            
            <div className="px-4 pt-1 pb-0 border-b">
              {/* ソートボタンはタブの右側に移動したため、上部の余分なスペースを削除 */}

              {/* タブ切り替え */}
              <div className="flex border-b items-center">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2 -mb-px ${
                    viewMode === 'list'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IoList className="w-4 h-4" />
                  リスト
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2 -mb-px ${
                    viewMode === 'kanban'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IoGrid className="w-4 h-4" />
                  カンバン
                </button>
                <button
                  onClick={() => setViewMode('gantt')}
                  className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2 -mb-px ${
                    viewMode === 'gantt'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IoBarChart className="w-4 h-4" />
                  ガントチャート
                </button>
                <div className="flex-grow"></div>
                {viewMode === 'list' && (
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleSort('dueDate')}
                      className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                        sortState.field === 'dueDate'
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      期日順
                      {sortState.field === 'dueDate' && (
                        sortState.order === 'asc' ? <IoCaretUp className="w-3 h-3" /> : <IoCaretDown className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mt-1">
              {viewMode === 'list' && (
                <div className="px-4">
                  {sortedTasks.length > 0 ? (
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b text-left text-sm text-gray-600">
                          <th className="py-1 px-2 font-medium text-xs">タスク名</th>
                          <th className="py-1 px-2 font-medium text-xs text-center">担当者</th>
                          <th className="py-1 px-2 font-medium text-xs text-center">進捗率</th>
                          <th className="py-1 px-2 font-medium text-xs">期日</th>
                          <th className="py-1 px-2 font-medium text-xs text-center">工数</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedTasks.map((task) => {
                          // タスクの担当者を収集（重複なし）
                          const assignees = new Set<string>();
                          task.todos.forEach(todo => {
                            if (todo.assigneeId) {
                              assignees.add(todo.assigneeId);
                            }
                          });
                          
                          // タスクの合計工数を計算
                          const totalHours = task.todos.reduce((sum, todo) => sum + todo.estimatedHours, 0);
                          
                          // 完了したTODOの数
                          const completedTodos = task.todos.filter(todo => todo.completed).length;
                          
                          // 期日（最も早いTODOの開始日）
                          const earliestDate = task.todos.length > 0
                            ? new Date(Math.min(...task.todos.map(todo => 
                                todo.startDate instanceof Date 
                                  ? todo.startDate.getTime() 
                                  : new Date(todo.startDate as any).getTime()
                              )))
                            : null;
                            
                          const progress = calculateProgress(task.todos);
                          
                          return (
                            <tr 
                              key={task.id}
                              onClick={() => handleTaskSelect(task.id)}
                              className={`border-b ${
                                progress === 100
                                  ? 'bg-gray-50 opacity-60'
                                  : 'hover:bg-gray-50 cursor-pointer'
                              }`}
                            >
                              <td className="py-4 px-2">
                                <div className="font-medium text-gray-800">{task.title}</div>
                                <div className="text-xs text-gray-500 mt-1 line-clamp-1">{task.description}</div>
                              </td>
                              <td className="py-4 px-2 text-center">
                                <div className="flex justify-center">
                                  {Array.from(assignees).length > 0 ? (
                                    <div className="flex -space-x-2">
                                      {Array.from(assignees).map((assigneeId, index) => {
                                        const memberInfo = getUserInfo(assigneeId);
                                        const isCurrentUser = memberInfo?.isCurrentUser || false;
                                        const displayName = memberInfo?.name || 'Unknown';
                                        const initial = displayName.charAt(0);
                                        
                                        return (
                                          <div 
                                            key={assigneeId}
                                            className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium ${
                                              isCurrentUser
                                                ? 'bg-orange-100 text-orange-700 border-orange-300'
                                                : 'bg-blue-100 text-blue-700'
                                            }`}
                                            style={{ zIndex: 10 - index }}
                                            title={`${displayName}${isCurrentUser ? ' (あなた)' : ''}`}
                                          >
                                            {initial}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                                      <span className="text-xs text-gray-400">-</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-2 text-center">
                                <div className="flex flex-col items-center">
                                  {/* ドーナツチャート型の進捗表示 */}
                                  <div className="relative w-10 h-10">
                                    <svg className="w-10 h-10" viewBox="0 0 36 36">
                                      {/* 背景円 */}
                                      <circle 
                                        cx="18" 
                                        cy="18" 
                                        r="15" 
                                        fill="none" 
                                        stroke="#e5e7eb" 
                                        strokeWidth="3" 
                                      />
                                      {/* 進捗円 */}
                                      <circle 
                                        cx="18" 
                                        cy="18" 
                                        r="15" 
                                        fill="none" 
                                        stroke="#3b82f6" 
                                        strokeWidth="3" 
                                        strokeDasharray={`${progress * 0.94}, 100`} 
                                        strokeLinecap="round" 
                                        transform="rotate(-90 18 18)" 
                                      />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-xs font-medium">{progress}%</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-2">
                                {earliestDate ? (
                                  <div className={`text-sm ${getDueDateStyle(earliestDate)}`}>
                                    {format(earliestDate, 'yyyy/MM/dd', { locale: ja })}
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">未設定</span>
                                )}
                              </td>
                              <td className="py-4 px-2 text-center">
                                <span className="text-sm">{totalHours.toFixed(1)}h</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                      <div className="bg-gray-50 rounded-full p-4 mb-4">
                        <IoList className="w-8 h-8 text-blue-500" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">タスクがありません</h3>
                      <p className="text-gray-500 mb-6 max-w-md">
                        このプロジェクトにはまだタスクが登録されていません。「タスク追加」ボタンをクリックして最初のタスクを作成しましょう。
                      </p>
                      <button
                        onClick={() => setIsCreatingTask(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <IoAdd className="w-5 h-5" />
                        <span>タスク追加</span>
                      </button>
                    </div>
                  )}
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
      
      {/* 新規プロジェクト作成後のガイドポップアップ */}
      <NewProjectGuidePopup 
        isVisible={showNewProjectGuide} 
        onClose={() => setShowNewProjectGuide(false)} 
      />

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
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={handleCloseTaskDetail}
        >
          <div 
            className="bg-white rounded-lg shadow-lg w-full max-w-[85vw] max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 overflow-y-auto relative">
              <button 
                onClick={handleCloseTaskDetail}
                className="absolute top-0 right-0 p-2 rounded-full hover:bg-gray-100 z-10"
                aria-label="閉じる"
              >
                <IoClose className="w-5 h-5" />
              </button>
              <div className="px-4">
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
        </div>
      )}
      
      {/* 要件からタスク自動生成ダイアログ */}
      {showRequirementsGenerator && (
        <RequirementsTaskGenerator
          onClose={() => setShowRequirementsGenerator(false)}
          onTasksCreate={handleAddRequirementsTasks}
          projectId={currentProject?.id}
        />
      )}
    </div>
  );
}

export default function TasksPage() {
  const { isAuthenticated, user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('tasks')
  const { filteredTasks, addTask, setTasks } = useTaskContext()
  const { projects, currentProject, updateProject } = useProjectContext()
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  // AIタスク提案の表示状態
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)
  // 要件からタスク自動生成の表示状態
  const [showRequirementsGenerator, setShowRequirementsGenerator] = useState(false)
  
  // 新規プロジェクト作成後のガイド表示状態
  const [showNewProjectGuide, setShowNewProjectGuide] = useState(false)
  
  // フィルタリングコンテキストを使用しない（TasksContentで使用する）
  
  // サイドバーの状態を監視
  useEffect(() => {
    const checkSidebarState = () => {
      const collapsed = document.documentElement.getAttribute('data-sidebar-collapsed') === 'true'
      setIsSidebarCollapsed(collapsed)
    }
    
    // 初期状態をチェック
    checkSidebarState()
    
    // データ属性の変更を監視
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-sidebar-collapsed') {
          checkSidebarState()
        }
      })
    })
    
    observer.observe(document.documentElement, { attributes: true })
    
    return () => observer.disconnect()
  }, [])
  
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

  // FilterProvider内で使用するため、TasksContentコンポーネントに処理を移動
  const sortedTasks = sortTasks(filteredTasks);

  // 選択されたタスクを取得
  const selectedTask = selectedTaskId 
    ? filteredTasks.find(task => task.id === selectedTaskId) || null 
    : null;

  // AIタスク提案からタスクを追加する処理
  const handleAddAiTask = (newTask: Task) => {
    // プロジェクトIDを設定
    if (currentProject) {
      newTask.projectId = currentProject.id;
    }
    
    // TaskContextのaddTask関数を呼び出し
    addTask(newTask);
    
    // 必要に応じて他の更新処理を行う
    // ここは実装によって異なる可能性があります
  };

  // 要件生成から複数タスクを追加する処理
  const handleAddRequirementsTasks = (newTasks: Task[]) => {
    if (currentProject) {
      newTasks.forEach(task => {
        task.projectId = currentProject.id;
        addTask(task);
      });
    }
    setShowRequirementsGenerator(false);
  };

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
            <EmptyProjectState onCreateProject={() => {}} />
          </main>
        </div>
      </div>
    );
  }

  return (
    <FilterProvider>
      <TasksContent 
        user={user}
        logout={logout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentProject={currentProject}
        filteredTasks={filteredTasks}
        sortTasks={sortTasks}
        calculateProgress={calculateProgress}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isCreatingTask={isCreatingTask}
        setIsCreatingTask={setIsCreatingTask}
        handleTaskCreate={handleTaskCreate}
        handleTaskUpdate={handleTaskUpdate}
        handleTaskSelect={handleTaskSelect}
        selectedTask={selectedTask}
        selectedTodoId={selectedTodoId}
        isTaskDetailModalOpen={isTaskDetailModalOpen}
        handleCloseTaskDetail={handleCloseTaskDetail}
        showAiSuggestions={showAiSuggestions}
        setShowAiSuggestions={setShowAiSuggestions}
        handleAddAiTask={handleAddAiTask}
        showRequirementsGenerator={showRequirementsGenerator}
        setShowRequirementsGenerator={setShowRequirementsGenerator}
        handleAddRequirementsTasks={handleAddRequirementsTasks}
        showNewProjectGuide={showNewProjectGuide}
        setShowNewProjectGuide={setShowNewProjectGuide}
        sortState={sortState}
        toggleSort={toggleSort}
      />
    </FilterProvider>
  );
} 