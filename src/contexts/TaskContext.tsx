'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Task } from '@/types/task';

interface TaskContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'プロジェクトMTG',
      description:
        'プロジェクトの進捗確認と今後の方針について討議します。\n主な議題：\n1. 現在の進捗状況\n2. リスクの確認\n3. 次週の作業計画',
      startDate: '2025-03-01',
      endDate: '2025-03-15',
      todos: [
        {
          id: '1-1',
          text: '議事録の作成',
          completed: true,
          dueDate: new Date(2025, 2, 5),
          estimatedHours: 3,
          startDate: '2025-03-01',
          endDate: '2025-03-05',
        },
        {
          id: '1-2',
          text: '参加者への資料共有',
          completed: true,
          dueDate: new Date(2025, 2, 10),
          estimatedHours: 1,
          startDate: '2025-03-06',
          endDate: '2025-03-10',
        },
        {
          id: '1-3',
          text: '次回MTGの日程調整',
          completed: false,
          dueDate: new Date(2025, 2, 15),
          estimatedHours: 0.5,
          startDate: '2025-03-11',
          endDate: '2025-03-15',
        },
      ],
      isNew: true,
    },
    {
      id: '2',
      title: '要件定義',
      description:
        'システムの要件定義を行います。\n機能要件と非機能要件を明確化し、ステークホルダーと合意を取ります。',
      startDate: '2025-03-16',
      endDate: '2025-03-30',
      todos: [
        {
          id: '2-1',
          text: '機能要件の洗い出し',
          completed: true,
          dueDate: new Date(2025, 2, 20),
          estimatedHours: 8,
          startDate: '2025-03-16',
          endDate: '2025-03-20',
        },
        {
          id: '2-2',
          text: '非機能要件の定義',
          completed: false,
          dueDate: new Date(2025, 2, 25),
          estimatedHours: 4,
          startDate: '2025-03-21',
          endDate: '2025-03-25',
        },
        {
          id: '2-3',
          text: 'ステークホルダーとの合意',
          completed: true,
          dueDate: new Date(2025, 2, 28),
          estimatedHours: 2,
          startDate: '2025-03-26',
          endDate: '2025-03-30',
        },
      ],
      isNew: true,
    },
    {
      id: '3',
      title: '要件定義書の作成',
      description:
        '要件定義書のドラフトを作成します。\n必要な図表やユースケースも含めて文書化します。',
      startDate: '2025-03-01',
      endDate: '2025-03-31',
      todos: [
        {
          id: '3-1',
          text: '目次の作成',
          completed: false,
          dueDate: new Date(2025, 2, 12),
          estimatedHours: 1,
          startDate: '2025-03-01',
          endDate: '2025-03-05',
        },
        {
          id: '3-2',
          text: 'ユースケース図の作成',
          completed: false,
          dueDate: new Date(2025, 2, 18),
          estimatedHours: 4,
          startDate: '2025-03-06',
          endDate: '2025-03-10',
        },
        {
          id: '3-3',
          text: 'レビュー依頼',
          completed: true,
          dueDate: new Date(2025, 2, 31),
          estimatedHours: 1,
          startDate: '2025-03-11',
          endDate: '2025-03-15',
        },
      ],
    },
  ]);

  return (
    <TaskContext.Provider value={{ tasks, setTasks }}>
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
