/**
 * 日付操作のユーティリティ関数
 */

import { addHours } from 'date-fns';
import { Task, Todo } from '@/types/task';

/**
 * 文字列形式の日付からDateオブジェクトに変換する
 * @param dateString ISO形式の日付文字列 ('YYYY-MM-DD')
 * @returns Dateオブジェクト
 */
export function parseDate(dateString: string): Date {
  if (!dateString) {
    return new Date();
  }
  
  // 日付文字列がISOフォーマットでない場合は修正
  if (!dateString.includes('T')) {
    dateString = `${dateString}T00:00:00`;
  }
  
  return new Date(dateString);
}

/**
 * TODOの着手予定日からカレンダー表示用の開始日時と終了日時を計算する
 * @param startDate 着手予定日
 * @param estimatedHours 予定工数
 * @returns カレンダー表示用日時のオブジェクト
 */
export function calculateCalendarDateTime(startDate: Date, estimatedHours: number): {
  calendarStartDateTime: Date;
  calendarEndDateTime: Date;
} {
  const calendarStartDateTime = new Date(startDate);
  // デフォルトは午前9時から開始
  calendarStartDateTime.setHours(9, 0, 0, 0);
  
  // 終了時刻は開始時刻 + 予定工数
  const calendarEndDateTime = addHours(calendarStartDateTime, estimatedHours);
  
  return {
    calendarStartDateTime,
    calendarEndDateTime
  };
}

/**
 * 従来の Task 型から新しい Task 型に変換する
 * @param oldTask 古い形式のタスク
 * @returns 新しい形式のタスク
 */
export function migrateTask(oldTask: any): Task {
  // 期日は古いendDateから設定、なければ現在日付
  const dueDate = oldTask.endDate 
    ? parseDate(oldTask.endDate) 
    : new Date();
  
  // TODOを変換
  const migratedTodos = oldTask.todos.map((oldTodo: any) => migrateTodo(oldTodo));
  
  // 完了日時の設定（すべてのTODOが完了している場合のみ）
  let completedDateTime: Date | undefined = undefined;
  const allTodosCompleted = migratedTodos.length > 0 && migratedTodos.every((todo: Todo) => todo.completed);
  if (allTodosCompleted) {
    // 最後に完了したTODOの完了日時を使用、なければ現在時刻
    const lastCompletedTodo = migratedTodos
      .filter((todo: Todo) => todo.completedDateTime)
      .sort((a: Todo, b: Todo) => (b.completedDateTime as Date).getTime() - (a.completedDateTime as Date).getTime())[0];
    
    completedDateTime = lastCompletedTodo?.completedDateTime || new Date();
  }
  
  return {
    id: oldTask.id,
    title: oldTask.title,
    description: oldTask.description,
    dueDate,
    completedDateTime,
    todos: migratedTodos,
    assigneeIds: oldTask.assigneeIds || [],
    projectId: oldTask.projectId
  };
}

/**
 * 従来の Todo 型から新しい Todo 型に変換する
 * @param oldTodo 古い形式のTODO
 * @returns 新しい形式のTODO
 */
export function migrateTodo(oldTodo: any): Todo {
  // 着手予定日を決定 (plannedStartDate -> startDate -> 今日)
  let startDate: Date;
  if (oldTodo.plannedStartDate) {
    startDate = oldTodo.plannedStartDate instanceof Date 
      ? oldTodo.plannedStartDate 
      : parseDate(oldTodo.plannedStartDate);
  } else {
    startDate = parseDate(oldTodo.startDate);
  }
  
  // カレンダー表示用の日時を計算
  const { calendarStartDateTime, calendarEndDateTime } = calculateCalendarDateTime(
    startDate, 
    oldTodo.estimatedHours
  );
  
  // 完了日時の設定
  let completedDateTime: Date | undefined = undefined;
  if (oldTodo.completed) {
    // 完了日時は記録されていないので現在の日時を使用
    completedDateTime = new Date();
  }
  
  return {
    id: oldTodo.id,
    text: oldTodo.text,
    completed: oldTodo.completed,
    startDate,
    calendarStartDateTime,
    calendarEndDateTime,
    completedDateTime,
    estimatedHours: oldTodo.estimatedHours,
    actualHours: oldTodo.actualHours ?? 0,
    assigneeIds: oldTodo.assigneeIds || []
  };
}

/**
 * すべてのタスクとTODOを新しい形式に変換する
 * @param tasks 古い形式のタスク配列
 * @returns 新しい形式のタスク配列
 */
export function migrateAllTasks(tasks: any[]): Task[] {
  return tasks.map(task => migrateTask(task));
} 