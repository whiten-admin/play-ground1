'use client';

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import TaskDetail from '@/components/TaskDetail'
import TodayTodo from '@/components/TodayTodo'
import AdditionalTask from '@/components/AdditionalTask'
import ProjectDetail from '@/components/ProjectDetail'
import WeeklySchedule from '@/components/WeeklySchedule'
import DataManagement from '@/components/DataManagement'
import Auth from '@/components/Auth'
import { useAuth } from '@/hooks/useAuth'
import { Task } from '@/types/task'
import { useTaskContext } from '@/contexts/TaskContext'
import { Project } from '@/types/project'
import UserFilter from '@/components/UserFilter'
import ResizablePanel from '@/components/layout/ResizablePanel'

export default function Home() {
  const { isAuthenticated, user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('todo')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null)
  const { tasks, setTasks } = useTaskContext()
  const [showDataManagement, setShowDataManagement] = useState(false)
  const [project, setProject] = useState<Project>({
    id: '1',
    title: 'プロジェクトA',
    description: 'プロジェクトの説明文がここに入ります。',
    startDate: '2025-03-01',
    endDate: '2025-12-31',
    phase: 'development',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

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
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  // タスクの作成処理
  const handleTaskCreate = (newTask: Task) => {
    setTasks((prevTasks) => [...prevTasks, newTask]);
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

  const handleTodoUpdate = (todoId: string, taskId: string, newDate: Date) => {
    setTasks((prevTasks) => {
      const updatedTasks = prevTasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            todos: task.todos.map((todo) => {
              if (todo.id === todoId) {
                // 既存のTODOの日付と時間を更新
                const updatedDueDate = new Date(newDate);
                // 時間を保持
                updatedDueDate.setHours(newDate.getHours());
                updatedDueDate.setMinutes(0);
                updatedDueDate.setSeconds(0);
                updatedDueDate.setMilliseconds(0);

                return {
                  ...todo,
                  dueDate: updatedDueDate,
                };
              }
              return todo;
            }),
          };
        }
        return task;
      });
      return updatedTasks;
    });
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject)
  }

  if (!isAuthenticated) {
    return <Auth onLogin={login} />;
  }

  // 選択されたタスクを取得
  const selectedTask = selectedTaskId
    ? tasks.find((task) => task.id === selectedTaskId) || null
    : null;

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-shrink-0 flex flex-col">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="p-2">
          <ProjectDetail 
            project={project} 
            onUpdate={handleProjectUpdate} 
          />
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={logout} project={project} user={user} />
        <main className="flex-1 overflow-y-auto p-3">
          {/* データ管理ボタン */}
          <div className="mb-3">
            <button
              onClick={() => setShowDataManagement(!showDataManagement)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm flex items-center"
            >
              <span>{showDataManagement ? '管理パネルを閉じる' : 'データ管理パネルを開く'}（開発用）</span>
              <span className="ml-1">{showDataManagement ? '▲' : '▼'}</span>
            </button>
          </div>
          
          {/* データ管理パネル */}
          {showDataManagement && (
            <div className="mb-3">
              <DataManagement />
            </div>
          )}
          
          {/* ユーザーフィルター */}
          <div className="mb-3">
            <UserFilter />
          </div>
          
          <ResizablePanel
            leftPanel={
              <div className="space-y-3">
                <div className="text-sm">
                  <TodayTodo
                    tasks={tasks}
                    selectedTaskId={selectedTaskId}
                    selectedTodoId={selectedTodoId}
                    onTaskSelect={handleTodoSelect}
                    onTodoStatusChange={handleTodoStatusChange}
                  />
                </div>
                <div className="text-sm">
                  <WeeklySchedule
                    tasks={tasks}
                    onTaskSelect={handleTaskSelect}
                    onTodoUpdate={handleTodoUpdate}
                    selectedTodoId={selectedTodoId}
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
                    tasks={tasks}
                    onTaskSelect={handleTaskSelect}
                    onTaskCreate={handleTaskCreate}
                  />
                </div>
                <div className="text-sm">
                  <AdditionalTask />
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
  );
}
