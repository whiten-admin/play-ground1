import { User } from './user';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  startDate: Date;               // 着手予定日
  calendarStartDateTime: Date;   // カレンダー表示用開始日時
  calendarEndDateTime: Date;     // カレンダー表示用終了日時
  completedDateTime?: Date;      // 完了日時
  estimatedHours: number;        // 見積もり工数（時間単位）
  actualHours: number;           // 実績工数（時間単位）
  assigneeIds: string[];         // 担当者IDの配列
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Date;                 // 期日
  completedDateTime?: Date;      // 完了日時
  todos: Todo[];
  priority: number;             // 0: 低, 1: 中, 2: 高
  assigneeIds: string[];         // タスク全体の担当者IDの配列
  projectId: string;             // タスクが属するプロジェクトのID
}

export interface Project {
  id: string;
  title: string;
  description: string;
  projectColor: string;
  tasks: Task[];
}
