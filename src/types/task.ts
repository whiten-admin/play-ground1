import { User } from './user';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  startDate: string;
  endDate: string;
  dueDate: Date;
  estimatedHours: number; // 見積もり工数（時間単位）
  
  // 新たに追加するフィールド
  plannedStartDate?: Date; // 着手予定日時
  assigneeIds?: string[]; // 担当者IDの配列
}

export interface Task {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  todos: Todo[];
  isNew?: boolean;
  priority?: number;  // 0: 低, 1: 中, 2: 高
  assigneeIds?: string[]; // タスク全体の担当者IDの配列
}
