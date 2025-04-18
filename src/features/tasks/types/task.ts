import { User } from './user';

// ステータスの型定義
export type TaskStatus = string;

// ステータスの色情報を定義する型
export interface StatusColor {
  bgColor: string;  // 背景色のCSSクラス
  textColor: string; // テキスト色のCSSクラス
  borderColor: string; // 境界線色のCSSクラス
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  startDate: Date; // 着手予定日
  calendarStartDateTime: Date; // カレンダー表示用開始日時
  calendarEndDateTime: Date; // カレンダー表示用終了日時
  completedDateTime?: Date; // 完了日時
  estimatedHours: number; // 見積もり工数（時間単位）
  actualHours: number; // 実績工数（時間単位）
  assigneeId: string; // 担当者ID（１人のみ）
  memo?: string; // TODOに関するメモ
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Date; // 期日
  completedDateTime?: Date; // 完了日時
  todos: Todo[];
  projectId: string; // タスクが属するプロジェクトのID
  status?: TaskStatus; // タスクのステータス
  statusColor?: StatusColor; // ステータスに関連する色情報
}

export interface Project {
  id: string;
  title: string;
  description: string;
  projectColor: string;
  tasks: Task[];
}
