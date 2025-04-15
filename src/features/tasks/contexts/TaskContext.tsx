'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Task } from '@/features/tasks/types/task';
import { seedTasks } from '@/features/tasks/data/seedData';
import { getTasksFromLocalStorage, saveSeedDataToLocalStorage, resetToSeedData, resetToScheduledSeedData } from '@/services/storage/utils/seedDataUtils';
import { useProjectContext } from '@/features/projects/contexts/ProjectContext';

interface TaskContextType {
  tasks: Task[];
  filteredTasks: Task[]; // 現在のプロジェクトのタスクのみ、またはプロジェクト全体モード時は全タスク
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  resetTasks: () => void;
  resetTasksWithSchedule: () => void;
  addTask: (task: Task) => void;
  clearAllTasks: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  // 初期値はシードデータを使用
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [initialized, setInitialized] = useState(false);
  const { currentProject, isAllProjectsMode, filteredProjects } = useProjectContext();
  
  // 現在のプロジェクトに基づいてタスクをフィルタリング
  const filteredTasks = (() => {
    // プロジェクト全体モードの場合は、ユーザーがアサインされている全プロジェクトのタスクを表示
    if (isAllProjectsMode) {
      // ユーザーがアサインされているプロジェクトIDのリスト
      const userProjectIds = filteredProjects.map(project => project.id);
      // ユーザーのプロジェクトに属するタスクのみ表示
      return tasks.filter(task => userProjectIds.includes(task.projectId));
    }
    
    // 通常モードでは現在選択中のプロジェクトのタスクのみ表示
    return currentProject
      ? tasks.filter(task => task.projectId === currentProject.id)
      : [];
  })();
  
  // 初回レンダリング時にローカルストレージからデータを読み込む
  useEffect(() => {
    if (initialized) return;
    
    try {
      console.log('ローカルストレージからタスク情報をロード中...');
      const storedTasks = getTasksFromLocalStorage();
      
      // ローカルストレージにデータがあればそれを使用、なければシードデータを保存
      if (storedTasks && storedTasks.length > 0) {
        console.log('ローカルストレージからタスクを読み込みました:', storedTasks.length);
        setTasks(storedTasks);
      } else {
        console.log('ローカルストレージにデータがないため、シードデータを使用します');
        // 初期データとして通常のシードデータを使用（スケジュールなし）
        const defaultTasks = resetToSeedData();
        setTasks(defaultTasks);
      }
    } catch (error) {
      console.error('ローカルストレージからのデータ読み込みに失敗しました:', error);
      // エラー時はシードデータを使用
      const defaultTasks = resetToSeedData();
      setTasks(defaultTasks);
    } finally {
      setInitialized(true);
    }
  }, [initialized]);
  
  // タスクが更新されたらローカルストレージに保存
  useEffect(() => {
    if (initialized) {
      saveSeedDataToLocalStorage(tasks);
    }
  }, [tasks, initialized]);

  // シードデータにリセットする関数
  const resetTasks = () => {
    const defaultTasks = resetToSeedData();
    setTasks(defaultTasks);
  };
  
  // スケジュール済みシードデータにリセットする関数
  const resetTasksWithSchedule = () => {
    const scheduledTasks = resetToScheduledSeedData();
    setTasks(scheduledTasks);
  };

  // 新しいタスクを追加する関数
  const addTask = (task: Task) => {
    // もし現在のプロジェクトがあれば、そのプロジェクトIDをタスクに設定
    if (currentProject && !task.projectId) {
      task.projectId = currentProject.id;
    }
    setTasks(prevTasks => [...prevTasks, task]);
  };

  // すべてのタスクをクリアする関数
  const clearAllTasks = () => {
    setTasks([]);
  };

  return (
    <TaskContext.Provider value={{ 
      tasks, 
      filteredTasks,
      setTasks, 
      resetTasks, 
      resetTasksWithSchedule,
      addTask,
      clearAllTasks 
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};
