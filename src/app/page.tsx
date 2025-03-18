'use client';

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import TaskDetail from '@/components/TaskDetail'
import TodayTodo from '@/components/TodayTodo'
import AdditionalTask from '@/components/AdditionalTask'
import ProjectDetail from '@/components/ProjectDetail'
import WeeklySchedule from '@/components/WeeklySchedule'
import Auth from '@/components/Auth'
import { useAuth } from '@/hooks/useAuth'
import { Task } from '@/types/task'
import { useTaskContext } from '@/contexts/TaskContext'
import { Project } from '@/types/project'

export default function Home() {
  const { isAuthenticated, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('todo')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null)
  const { tasks, setTasks } = useTaskContext()
  // const [tasks, setTasks] = useState<Task[]>([
  //   {
  //     id: '1',
  //     title: 'プロジェクトMTG',
  //     description: 'プロジェクトの進捗確認と今後の方針について討議します。\n主な議題：\n1. 現在の進捗状況\n2. リスクの確認\n3. 次週の作業計画',
  //     todos: [
  //       { id: '1-1', text: '議事録の作成', completed: false, dueDate: new Date(2025, 2, 5), estimatedHours: 2 },
  //       { id: '1-2', text: '参加者への資料共有', completed: false, dueDate: new Date(2025, 2, 10), estimatedHours: 1 },
  //       { id: '1-3', text: '次回MTGの日程調整', completed: false, dueDate: new Date(2025, 2, 15), estimatedHours: 0.5 }
  //     ],
  //     isNew: true
  //   },
  //   {
  //     id: '2',
  //     title: '要件定義',
  //     description: 'システムの要件定義を行います。\n機能要件と非機能要件を明確化し、ステークホルダーと合意を取ります。',
  //     todos: [
  //       { id: '2-1', text: '機能要件の洗い出し', completed: true, dueDate: new Date(2025, 2, 20), estimatedHours: 8 },
  //       { id: '2-2', text: '非機能要件の定義', completed: false, dueDate: new Date(2025, 2, 25), estimatedHours: 4 },
  //       { id: '2-3', text: 'ステークホルダーとの合意', completed: false, dueDate: new Date(2025, 2, 28), estimatedHours: 2 }
  //     ],
  //     isNew: true
  //   },
  //   {
  //     id: '3',
  //     title: '要件定義書の作成',
  //     description: '要件定義書のドラフトを作成します。\n必要な図表やユースケースも含めて文書化します。',
  //     todos: [
  //       { id: '3-1', text: '目次の作成', completed: false, dueDate: new Date(2025, 2, 12), estimatedHours: 1 },
  //       { id: '3-2', text: 'ユースケース図の作成', completed: false, dueDate: new Date(2025, 2, 18), estimatedHours: 4 },
  //       { id: '3-3', text: 'レビュー依頼', completed: false, dueDate: new Date(2025, 2, 31), estimatedHours: 1 }
  //     ]
  //   }
  // ])
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
        <Header onLogout={logout} project={project} />
        <main className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-3">
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
          </div>
        </main>
      </div>
    </div>
  );
}
