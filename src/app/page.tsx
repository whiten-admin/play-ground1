'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import TaskDetail from '@/components/TaskDetail';
import TodayTodo from '@/components/TodayTodo';
import AdditionalTask from '@/components/AdditionalTask';
import ProjectDetail from '@/components/ProjectDetail';
import WeeklySchedule from '@/components/WeeklySchedule';
import Auth from '@/components/Auth';
import { useAuth } from '@/hooks/useAuth';
import { Task } from '@/types/task';
import { useTaskContext } from '@/contexts/TaskContext';

export default function Home() {
  const { isAuthenticated, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('todo');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { tasks, setTasks } = useTaskContext();

  // WeeklyScheduleのイベントをTaskDetailで表示するための関数
  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  // タスクの更新処理
  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
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
          <ProjectDetail />
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onLogout={logout} />
        <main className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-3">
              <div className="text-sm">
                <TodayTodo
                  tasks={tasks}
                  selectedTaskId={selectedTaskId}
                  onTaskSelect={setSelectedTaskId}
                  onTodoStatusChange={handleTodoStatusChange}
                />
              </div>
              <div className="text-sm">
                <WeeklySchedule
                  tasks={tasks}
                  onTaskSelect={handleTaskSelect}
                  onTodoUpdate={handleTodoUpdate}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-sm">
                <TaskDetail
                  selectedTask={selectedTask}
                  onTaskUpdate={handleTaskUpdate}
                  tasks={tasks}
                  onTaskSelect={setSelectedTaskId}
                />
              </div>
              <div className="text-sm">
                <AdditionalTask />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
