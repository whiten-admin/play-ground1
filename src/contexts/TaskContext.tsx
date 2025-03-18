'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Task } from '@/types/task';
import { seedTasks } from '@/utils/seedData';
import { getTasksFromLocalStorage, saveSeedDataToLocalStorage, resetToSeedData } from '@/utils/seedDataUtils';

interface TaskContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  resetTasks: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  // 初期値はシードデータを使用
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  
  // 初回レンダリング時にローカルストレージからデータを読み込む
  useEffect(() => {
    const storedTasks = getTasksFromLocalStorage();
    // ローカルストレージにデータがあればそれを使用、なければシードデータを保存
    if (storedTasks) {
      setTasks(storedTasks);
    } else {
      saveSeedDataToLocalStorage(seedTasks);
    }
  }, []);
  
  // タスクが更新されたらローカルストレージに保存
  useEffect(() => {
    saveSeedDataToLocalStorage(tasks);
  }, [tasks]);

  // シードデータにリセットする関数
  const resetTasks = () => {
    const defaultTasks = resetToSeedData();
    setTasks(defaultTasks);
  };

  return (
    <TaskContext.Provider value={{ tasks, setTasks, resetTasks }}>
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
