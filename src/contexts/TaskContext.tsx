'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Task } from '@/types/task';
import { seedTasks } from '@/utils/seedData';
import { getTasksFromLocalStorage, saveSeedDataToLocalStorage, resetToSeedData, resetToScheduledSeedData } from '@/utils/seedDataUtils';

interface TaskContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  resetTasks: () => void;
  resetTasksWithSchedule: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  // 初期値はシードデータを使用
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [initialized, setInitialized] = useState(false);
  
  // 初回レンダリング時にローカルストレージからデータを読み込む
  useEffect(() => {
    if (initialized) return;
    
    const storedTasks = getTasksFromLocalStorage();
    // ローカルストレージにデータがあればそれを使用、なければシードデータを保存
    if (storedTasks) {
      setTasks(storedTasks);
    } else {
      // 初期データとして通常のシードデータを使用（スケジュールなし）
      const defaultTasks = resetToSeedData();
      setTasks(defaultTasks);
    }
    
    setInitialized(true);
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

  return (
    <TaskContext.Provider value={{ tasks, setTasks, resetTasks, resetTasksWithSchedule }}>
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
