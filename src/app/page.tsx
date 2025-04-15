'use client';

import { useState, useEffect, Suspense } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import TaskDetail from '@/features/tasks/components/TaskDetail'
import ScheduleCalendar from '@/features/schedule/components/ScheduleCalendar'
import Auth from '@/services/auth/components/Auth'
import EmptyProjectState from '@/features/projects/components/EmptyProjectState'
import { useAuth } from '@/services/auth/hooks/useAuth'
import { Task } from '@/features/tasks/types/task'
import { useTaskContext } from '@/features/tasks/contexts/TaskContext'
import { useProjectContext } from '@/features/projects/contexts/ProjectContext'
import ResizablePanel from '@/components/layout/ResizablePanel'
import { FilterProvider } from '@/features/tasks/filters/FilterContext'
import OverdueTodoCards from '@/features/tasks/components/OverdueTodoCards'
import MemberList from '@/features/schedule/components/MemberList'
import AdaptiveWorkloadSummary from '@/features/schedule/components/AdaptiveWorkloadSummary'
import { ViewMode } from '@/features/schedule/types/schedule'

// 検索パラメータを使用するコンポーネント
function HomeContent() {
  const { isAuthenticated, user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('todo')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null)
  const { filteredTasks, setTasks, addTask } = useTaskContext()
  const { currentProject, updateProject, projects, filteredProjects } = useProjectContext()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
  // カレンダーの表示モード
  const [calendarViewMode, setCalendarViewMode] = useState<ViewMode>('week')
  
  // 工数サマリーのための状態
  const [workloadSummary, setWorkloadSummary] = useState({
    daily: new Map(),
    weekly: new Map(),
    monthly: new Map()
  });
  const [workloadCurrentDate, setWorkloadCurrentDate] = useState(new Date());

  // ユーザーデータを取得
  const userData = user ? {
    id: user.id,
    name: user.name,
    role: user.role,
    password: '' // HeaderコンポーネントではパスワードはUI表示に使用されないため、空文字を設定
  } : null;

  // プロジェクト作成モーダルを開く
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true)
  }

  // タスク選択ハンドラーを修正
  const handleTaskSelect = (taskId: string, todoId?: string) => {
    setSelectedTaskId(taskId);
    if (todoId) {
      setSelectedTodoId(todoId);
    }
  };

  // TODO選択ハンドラーを追加
  const handleTodoSelect = (taskId: string, todoId: string) => {
    setSelectedTaskId(taskId);
    setSelectedTodoId(todoId);
  };

  // タスク詳細を閉じる処理
  const handleCloseTaskDetail = () => {
    setSelectedTaskId(null);
    setSelectedTodoId(null);
  };

  // タスクの更新処理
  const handleTaskUpdate = (updatedTask: Task) => {
    console.log('Home: handleTaskUpdate called with:', updatedTask);
    setTasks((prevTasks) => {
      const updated = prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task));
      console.log('Home: tasks after update:', updated);
      return updated;
    });
  };

  // タスクの作成処理
  const handleTaskCreate = (newTask: Task) => {
    // プロジェクトIDを設定
    if (currentProject) {
      newTask.projectId = currentProject.id;
    }
    addTask(newTask);
  };

  // TODOの完了状態を更新
  const handleTodoStatusChange = (taskId: string, todoId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            todos: task.todos.map((todo) =>
              todo.id === todoId
                ? { ...todo, completed: !todo.completed }
                : todo
            ),
          };
        }
        return task;
      })
    );
  };

  const handleTodoUpdate = (todoId: string, taskId: string, newDate: Date, endDate?: Date) => {
    console.log('Home: handleTodoUpdate called with:', { todoId, taskId, newDate, endDate });
    
    setTasks((prevTasks) => {
      const updatedTasks = prevTasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            todos: task.todos.map((todo) => {
              if (todo.id === todoId) {
                // 既存のTODOの日付と時間を更新
                const updatedDate = new Date(newDate);
                // 時間を保持
                updatedDate.setHours(newDate.getHours());
                updatedDate.setMinutes(newDate.getMinutes());
                updatedDate.setSeconds(0);
                updatedDate.setMilliseconds(0);

                // 終了日時が指定されている場合
                if (endDate) {
                  const updatedEndDate = new Date(endDate);
                  updatedEndDate.setHours(endDate.getHours());
                  updatedEndDate.setMinutes(endDate.getMinutes());
                  updatedEndDate.setSeconds(0);
                  updatedEndDate.setMilliseconds(0);
                  
                  return {
                    ...todo,
                    calendarStartDateTime: updatedDate,
                    calendarEndDateTime: updatedEndDate,
                    estimatedHours: (updatedEndDate.getTime() - updatedDate.getTime()) / (1000 * 60 * 60),
                    startDate: updatedDate
                  };
                }
              }
              return todo;
            }),
          };
        }
        return task;
      });
      
      console.log('Home: tasks after update:', updatedTasks);
      return updatedTasks;
    });
  };

  // 工数データの更新を処理するハンドラー
  const handleWorkloadUpdate = (workloadData: any, date: Date) => {
    setWorkloadSummary(workloadData);
    setWorkloadCurrentDate(date);
  };

  // カレンダーの表示モードが変更されたときの処理
  const handleViewModeChange = (viewMode: ViewMode) => {
    setCalendarViewMode(viewMode);
  };

  if (!isAuthenticated) {
    return <Auth onLogin={login} />;
  }

  // ユーザーがアサインされているプロジェクトが存在しない場合は専用画面を表示
  if (filteredProjects.length === 0) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onLogout={logout} user={userData} />
          <main className="flex-1 overflow-y-auto p-4">
            <EmptyProjectState 
              onCreateProject={handleOpenCreateModal} 
            />
          </main>
        </div>
      </div>
    );
  }

  // 選択されたタスクを取得（現在のプロジェクトのタスクから）
  const selectedTask = selectedTaskId
    ? filteredTasks.find((task) => task.id === selectedTaskId) || null
    : null;

  return (
    <FilterProvider>
      <div className="flex h-screen bg-gray-100">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onLogout={logout} user={userData} project={currentProject || undefined} />
          <main className="flex-1 overflow-y-auto p-3">
            {/* ホーム画面ではユーザーフィルターを表示しない */}
            
            {selectedTaskId ? (
              // タスクが選択されている場合は、現状のレイアウト
              <ResizablePanel
                leftPanel={
                  <div className="space-y-3">
                    {/* TodayTodoコンポーネントは今後再利用する可能性があるためコメントアウト
                    <div className="text-sm">
                      <TodayTodo
                        tasks={filteredTasks}
                        selectedTaskId={selectedTaskId}
                        selectedTodoId={selectedTodoId}
                        onTaskSelect={handleTodoSelect}
                        onTodoStatusChange={handleTodoStatusChange}
                      />
                    </div>
                    */}
                    <div className="text-sm">
                      <OverdueTodoCards
                        tasks={filteredTasks}
                        selectedTaskId={selectedTaskId}
                        selectedTodoId={selectedTodoId}
                        onTaskSelect={handleTodoSelect}
                        onTodoStatusChange={handleTodoStatusChange}
                      />
                      <div className="flex">
                        <div className="w-48 mr-3">
                          <MemberList />
                          <div className="mt-3">
                            <AdaptiveWorkloadSummary
                              workloadData={workloadSummary}
                              currentDate={workloadCurrentDate}
                              viewMode={calendarViewMode}
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <ScheduleCalendar
                            tasks={filteredTasks}
                            onTaskSelect={handleTaskSelect}
                            onTodoUpdate={handleTodoUpdate}
                            selectedTodoId={selectedTodoId}
                            onTaskUpdate={handleTaskUpdate}
                            onWorkloadUpdate={handleWorkloadUpdate}
                            onViewModeChange={handleViewModeChange}
                          />
                        </div>
                      </div>
                    </div>
                    {/* 予定工数集計コンポーネントは一時的に非表示
                    <div className="text-sm mt-3">
                      <WorkloadSummaryView
                        workloadData={workloadSummary}
                        currentDate={workloadCurrentDate}
                        onCurrentDateChange={setWorkloadCurrentDate}
                      />
                    </div>
                    */}
                  </div>
                }
                rightPanel={
                  <div className="space-y-3">
                    <div className="text-sm">
                      <TaskDetail
                        selectedTask={selectedTask}
                        selectedTodoId={selectedTodoId}
                        onTaskUpdate={handleTaskUpdate}
                        tasks={filteredTasks}
                        onTaskSelect={handleTaskSelect}
                        onTaskCreate={handleTaskCreate}
                        onClose={handleCloseTaskDetail}
                      />
                    </div>
                  </div>
                }
                defaultLeftWidth={450}
                minLeftWidth={300}
                maxLeftWidth={800}
                storageKey="todoAppPanelWidth"
              />
            ) : (
              // タスクが未選択の場合は、カレンダーのみを表示
              <div className="text-sm h-full">
                {/* TodayTodoコンポーネントは今後再利用する可能性があるためコメントアウト
                <TodayTodo
                  tasks={filteredTasks}
                  selectedTaskId={selectedTaskId}
                  selectedTodoId={selectedTodoId}
                  onTaskSelect={handleTodoSelect}
                  onTodoStatusChange={handleTodoStatusChange}
                  isExpanded={true}
                />
                */}
                <OverdueTodoCards
                  tasks={filteredTasks}
                  selectedTaskId={selectedTaskId}
                  selectedTodoId={selectedTodoId}
                  onTaskSelect={handleTodoSelect}
                  onTodoStatusChange={handleTodoStatusChange}
                />
                <div className="flex">
                  <div className="w-48 mr-3">
                    <MemberList />
                    <div className="mt-3">
                      <AdaptiveWorkloadSummary
                        workloadData={workloadSummary}
                        currentDate={workloadCurrentDate}
                        viewMode={calendarViewMode}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <ScheduleCalendar
                      tasks={filteredTasks}
                      onTaskSelect={handleTaskSelect}
                      onTodoUpdate={handleTodoUpdate}
                      selectedTodoId={selectedTodoId}
                      onTaskUpdate={handleTaskUpdate}
                      onWorkloadUpdate={handleWorkloadUpdate}
                      onViewModeChange={handleViewModeChange}
                    />
                    {/* 予定工数集計コンポーネントは一時的に非表示
                    <div className="text-sm mt-3">
                      <WorkloadSummaryView
                        workloadData={workloadSummary}
                        currentDate={workloadCurrentDate}
                        onCurrentDateChange={setWorkloadCurrentDate}
                      />
                    </div>
                    */}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </FilterProvider>
  );
}

// メインコンポーネント
export default function Home() {
  return (
    <Suspense fallback={<div className="p-4 text-center">読み込み中...</div>}>
      <HomeContent />
    </Suspense>
  );
}
