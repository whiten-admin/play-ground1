import { Task, Todo } from '@/types/task';
import { seedTasks } from './seedData';

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
    
    // Date型への変換処理（dueDateをDate型に変換）
    const parsedTasks = tasks.map((task: any) => ({
      ...task,
      todos: task.todos.map((todo: any) => ({
        ...todo,
        dueDate: todo.dueDate ? new Date(todo.dueDate) : new Date(),
        plannedStartDate: todo.plannedStartDate ? new Date(todo.plannedStartDate) : undefined
      }))
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

// 特定のタスクの完了状態を一括で変更する
export const bulkUpdateTaskCompletionStatus = (tasks: Task[], taskId: string, completed: boolean): Task[] => {
  return tasks.map(task => {
    if (task.id === taskId) {
      return {
        ...task,
        todos: task.todos.map(todo => ({
          ...todo,
          completed
        }))
      };
    }
    return task;
  });
};

// 指定された日付範囲内のタスク/TODOをフィルタリングする
export const filterTasksByDateRange = (tasks: Task[], startDate: Date, endDate: Date): Task[] => {
  return tasks.filter(task => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    
    // タスクの期間が指定された範囲と重なるかチェック
    return (
      (taskStart <= endDate && taskEnd >= startDate) ||
      task.todos.some(todo => {
        const todoDueDate = todo.dueDate instanceof Date ? todo.dueDate : new Date(todo.dueDate);
        return todoDueDate >= startDate && todoDueDate <= endDate;
      })
    );
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
    
    // Date型への変換処理
    const parsedTasks = tasks.map(task => ({
      ...task,
      todos: task.todos.map((todo: Todo) => ({
        ...todo,
        dueDate: todo.dueDate ? new Date(todo.dueDate) : new Date(),
        plannedStartDate: todo.plannedStartDate ? new Date(todo.plannedStartDate) : undefined
      }))
    }));
    
    return parsedTasks;
  } catch (error) {
    console.error('Failed to import tasks from JSON:', error);
    return null;
  }
}; 