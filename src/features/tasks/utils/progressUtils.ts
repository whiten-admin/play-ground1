import { Task } from '../types/task';
import { isAfter } from 'date-fns';

/**
 * プロジェクトの進捗率を計算する
 */
export const calculateProgressPercentage = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0;
  
  const allTodos = tasks.flatMap(task => task.todos);
  if (allTodos.length === 0) return 0;
  
  const totalHours = allTodos.reduce((sum, todo) => sum + todo.estimatedHours, 0);
  const completedHours = allTodos
    .filter(todo => todo.completed)
    .reduce((sum, todo) => sum + todo.estimatedHours, 0);
  
  return Math.round((completedHours / totalHours) * 100);
};

/**
 * 遅延している時間（時間単位）を計算する
 */
export const calculateDelayHours = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0;
  
  const now = new Date();
  let totalDelayHours = 0;
  
  tasks.forEach(task => {
    task.todos
      .filter(todo => !todo.completed && isAfter(now, todo.calendarEndDateTime))
      .forEach(delayedTodo => {
        // 完了していないかつ終了予定日時を過ぎている場合
        const delayMs = now.getTime() - delayedTodo.calendarEndDateTime.getTime();
        const delayHours = Math.round(delayMs / (1000 * 60 * 60));
        totalDelayHours += delayHours;
      });
  });
  
  return totalDelayHours;
};

/**
 * プロジェクトのリスク度を計算する
 * 返り値: 'low' | 'medium' | 'high'
 */
export const calculateRiskLevel = (tasks: Task[]): 'low' | 'medium' | 'high' => {
  const progressPercentage = calculateProgressPercentage(tasks);
  const delayHours = calculateDelayHours(tasks);
  
  if (delayHours > 40) return 'high';
  if (delayHours > 20) return 'medium';
  
  // 進捗が予定より大幅に遅れている場合
  const allTodos = tasks.flatMap(task => task.todos);
  const uncompletedTodos = allTodos.filter(todo => !todo.completed);
  const now = new Date();
  const overdueTodos = uncompletedTodos.filter(todo => isAfter(now, todo.calendarEndDateTime));
  
  if (overdueTodos.length > uncompletedTodos.length * 0.5) return 'high';
  if (overdueTodos.length > uncompletedTodos.length * 0.3) return 'medium';
  
  return 'low';
};

/**
 * リスク度に応じたテキストを取得する
 */
export const getRiskLevelText = (riskLevel: 'low' | 'medium' | 'high'): string => {
  switch (riskLevel) {
    case 'high':
      return '高';
    case 'medium':
      return '中';
    case 'low':
      return '低';
    default:
      return '低';
  }
};

/**
 * リスク度に応じた色クラスを取得する
 */
export const getRiskLevelColorClass = (riskLevel: 'low' | 'medium' | 'high'): string => {
  switch (riskLevel) {
    case 'high':
      return 'text-red-600 bg-red-50';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50';
    case 'low':
      return 'text-green-600 bg-green-50';
    default:
      return 'text-green-600 bg-green-50';
  }
}; 