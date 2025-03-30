'use client';

import { useState, useEffect, Suspense } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import TaskDetail from '@/features/tasks/components/TaskDetail'
import TodayTodo from '@/features/tasks/components/TodayTodo'
import ProjectDetail from '@/features/projects/components/ProjectDetail'
import WeeklySchedule from '@/features/schedule/components/WeeklySchedule'
import Auth from '@/services/auth/components/Auth'
import EmptyProjectState from '@/features/projects/components/EmptyProjectState'
import { useAuth } from '@/services/auth/hooks/useAuth'
import { Task } from '@/features/tasks/types/task'
import { useTaskContext } from '@/features/tasks/contexts/TaskContext'
import { useProjectContext } from '@/features/projects/contexts/ProjectContext'
import UserFilter from '@/components/UserFilter'
import ResizablePanel from '@/components/layout/ResizablePanel'
import { FilterProvider } from '@/features/tasks/filters/FilterContext'
import { useSearchParams } from 'next/navigation'

// 検索パラメータを使用するコンポーネント
function HomeContent() {
  const { isAuthenticated, user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('todo')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null)
  const { filteredTasks, setTasks, addTask } = useTaskContext()
  const { currentProject, updateProject, projects } = useProjectContext()
  const searchParams = useSearchParams()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

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

  // URLのクエリパラメータからタスクIDとTODO IDを取得
  useEffect(() => {
    const taskId = searchParams.get('taskId')
    const todoId = searchParams.get('todoId')
    
    if (taskId) {
      setSelectedTaskId(taskId)
      if (todoId) {
        setSelectedTodoId(todoId)
      }
    }
  }, [searchParams])

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

  const handleTodoUpdate = (todoId: string, taskId: string, newDate: Date, isPlannedDate?: boolean) => {
    console.log('Home: handleTodoUpdate called with:', { todoId, taskId, newDate, isPlannedDate });
    
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
                updatedDate.setMinutes(0);
                updatedDate.setSeconds(0);
                updatedDate.setMilliseconds(0);

                if (isPlannedDate) {
                  // 着手予定日を更新
                  return {
                    ...todo,
                    plannedStartDate: updatedDate
                  };
                } else {
                  // 期日を更新
                  return {
                    ...todo,
                    dueDate: updatedDate
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

  // 選択されたタスクを取得（現在のプロジェクトのタスクから）
  const selectedTask = selectedTaskId
    ? filteredTasks.find((task) => task.id === selectedTaskId) || null
    : null;

  return (
    <FilterProvider>
      <div className="flex h-screen bg-gray-100">
        <div className="flex-shrink-0 flex flex-col">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <div className={`p-2 ${isSidebarCollapsed ? 'w-16' : 'w-48'}`}>
            {currentProject && (
              <ProjectDetail 
                project={currentProject} 
                onUpdate={updateProject} 
              />
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onLogout={logout} user={user} />
          <main className="flex-1 overflow-y-auto p-3">
            {/* ユーザーフィルター */}
            <div className="mb-3">
              <UserFilter />
            </div>
            
            <ResizablePanel
              leftPanel={
                <div className="space-y-3">
                  <div className="text-sm">
                    <TodayTodo
                      tasks={filteredTasks}
                      selectedTaskId={selectedTaskId}
                      selectedTodoId={selectedTodoId}
                      onTaskSelect={handleTodoSelect}
                      onTodoStatusChange={handleTodoStatusChange}
                    />
                  </div>
                  <div className="text-sm">
                    <WeeklySchedule
                      tasks={filteredTasks}
                      onTaskSelect={handleTaskSelect}
                      onTodoUpdate={handleTodoUpdate}
                      selectedTodoId={selectedTodoId}
                      onTaskUpdate={handleTaskUpdate}
                    />
                  </div>
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
                    />
                  </div>
                </div>
              }
              defaultLeftWidth={450}
              minLeftWidth={300}
              maxLeftWidth={800}
              storageKey="todoAppPanelWidth"
            />
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
