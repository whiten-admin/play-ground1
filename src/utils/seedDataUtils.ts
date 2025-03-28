import { Task, Todo } from '@/types/task';
import { seedTasks } from '@/data/seedData';
import { scheduleTodosByDueDate } from './taskScheduler';
import { parseDate, calculateCalendarDateTime } from '@/utils/dateUtils';

// シードデータをローカルストレージに保存する
export const saveSeedDataToLocalStorage = (tasks: Task[]) => {
  try {
    localStorage.setItem('appTasks', JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error);
    return false;
  }
};

// ローカルストレージからタスクデータを取得する
export const getTasksFromLocalStorage = (): Task[] | null => {
  try {
    const tasksJson = localStorage.getItem('appTasks');
    if (!tasksJson) return null;

    const tasks = JSON.parse(tasksJson);
    
    // 古い形式のデータを新しい形式に変換
    const parsedTasks = tasks.map((task: any) => ({
      ...task,
      // タスクの日付をDate型に変換
      dueDate: task.dueDate ? new Date(task.dueDate) : 
               task.endDate ? parseDate(task.endDate) : new Date(),
      completedDateTime: task.completedDateTime ? new Date(task.completedDateTime) : undefined,
      // 古い日付フィールドを削除
      startDate: undefined,
      endDate: undefined,
      // TODOも新しい形式に変換
      todos: task.todos.map((todo: any) => {
        // 基本フィールドを変換
        const startDate = todo.startDate ? 
          (typeof todo.startDate === 'string' ? parseDate(todo.startDate) : new Date(todo.startDate)) : 
          new Date();
        
        // カレンダー表示用日時を生成
        const { calendarStartDateTime, calendarEndDateTime } = todo.calendarStartDateTime ? 
          { 
            calendarStartDateTime: new Date(todo.calendarStartDateTime), 
            calendarEndDateTime: new Date(todo.calendarEndDateTime) 
          } : 
          calculateCalendarDateTime(startDate, todo.estimatedHours || 1);
        
        return {
          ...todo,
          startDate,
          calendarStartDateTime,
          calendarEndDateTime,
          completedDateTime: todo.completedDateTime ? new Date(todo.completedDateTime) : undefined,
          actualHours: todo.actualHours || 0,
          assigneeId: todo.assigneeIds && todo.assigneeIds.length > 0 ? todo.assigneeIds[0] : '',
          // 古い日付フィールドを削除
          dueDate: undefined,
          endDate: undefined,
          plannedStartDate: undefined
        };
      })
    }));
    
    return parsedTasks;
  } catch (error) {
    console.error('Failed to load tasks from localStorage:', error);
    return null;
  }
};

// シードデータを初期状態にリセットする
export const resetToSeedData = () => {
  saveSeedDataToLocalStorage(seedTasks);
  return seedTasks;
};

// スケジュール済みのシードデータを初期状態にリセットする
export const resetToScheduledSeedData = () => {
  const scheduledTasks = scheduleTodosByDueDate(seedTasks);
  saveSeedDataToLocalStorage(scheduledTasks);
  return scheduledTasks;
};

// 特定のタスクの完了状態を一括で変更する
export const bulkUpdateTaskCompletionStatus = (tasks: Task[], taskId: string, completed: boolean): Task[] => {
  return tasks.map(task => {
    if (task.id === taskId) {
      // 完了状態の更新と完了日時の設定
      const completedDateTime = completed ? new Date() : undefined;
      return {
        ...task,
        completedDateTime,
        todos: task.todos.map(todo => ({
          ...todo,
          completed,
          completedDateTime
        }))
      };
    }
    return task;
  });
};

// 指定された日付範囲内のタスク/TODOをフィルタリングする
export const filterTasksByDateRange = (tasks: Task[], startDate: Date, endDate: Date): Task[] => {
  return tasks.filter(task => {
    // タスクの期日が指定された範囲内にあるかチェック
    const taskDueDate = task.dueDate;
    const isTaskInRange = taskDueDate >= startDate && taskDueDate <= endDate;
    
    // タスクのTODOが指定された範囲内にあるかチェック
    const hasTodoInRange = task.todos.some(todo => {
      const todoStartDate = todo.startDate;
      return todoStartDate >= startDate && todoStartDate <= endDate;
    });
    
    return isTaskInRange || hasTodoInRange;
  });
};

// データのダウンロード用（バックアップ目的）
export const exportTasksAsJson = (tasks: Task[]): string => {
  return JSON.stringify(tasks, null, 2);
};

// データのインポート（バックアップからの復元）
export const importTasksFromJson = (jsonString: string): Task[] | null => {
  try {
    const tasks = JSON.parse(jsonString);
    
    // 簡易的な検証（最低限の構造チェック）
    if (!Array.isArray(tasks) || !tasks.every(task => 
      typeof task.id === 'string' && 
      typeof task.title === 'string' && 
      Array.isArray(task.todos)
    )) {
      throw new Error('Invalid task structure');
    }
    
    // 古いデータ形式から新しい形式に変換
    const parsedTasks = tasks.map((task: any) => ({
      ...task,
      // タスクの日付をDate型に変換
      dueDate: task.dueDate ? new Date(task.dueDate) : 
               task.endDate ? parseDate(task.endDate) : new Date(),
      completedDateTime: task.completedDateTime ? new Date(task.completedDateTime) : undefined,
      // 古い日付フィールドを削除
      startDate: undefined,
      endDate: undefined,
      // TODOも新しい形式に変換
      todos: task.todos.map((todo: any) => {
        // 基本フィールドを変換
        const startDate = todo.startDate ? 
          (typeof todo.startDate === 'string' ? parseDate(todo.startDate) : new Date(todo.startDate)) : 
          new Date();
        
        // カレンダー表示用日時を生成
        const { calendarStartDateTime, calendarEndDateTime } = todo.calendarStartDateTime ? 
          { 
            calendarStartDateTime: new Date(todo.calendarStartDateTime), 
            calendarEndDateTime: new Date(todo.calendarEndDateTime) 
          } : 
          calculateCalendarDateTime(startDate, todo.estimatedHours || 1);
        
        return {
          ...todo,
          startDate,
          calendarStartDateTime,
          calendarEndDateTime,
          completedDateTime: todo.completedDateTime ? new Date(todo.completedDateTime) : undefined,
          actualHours: todo.actualHours || 0,
          assigneeId: todo.assigneeIds && todo.assigneeIds.length > 0 ? todo.assigneeIds[0] : '',
          // 古い日付フィールドを削除
          dueDate: undefined,
          endDate: undefined,
          plannedStartDate: undefined
        };
      })
    }));
    
    return parsedTasks;
  } catch (error) {
    console.error('Failed to import tasks from JSON:', error);
    return null;
  }
}; 