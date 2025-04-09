import { Task, Todo } from '@/features/tasks/types/task';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { BUSINESS_HOURS } from '@/utils/constants/constants';
import { TodoWithMeta } from '../types/schedule';

/**
 * TODOをカレンダーに表示するためのフィルタリング
 */
export const filterTodosForDisplay = (
  tasks: Task[],
  selectedUserIds: string[],
  showUnassigned: boolean
): Map<string, TodoWithMeta[]> => {
  const todosByDate = new Map<string, TodoWithMeta[]>();
  
  tasks.forEach(task => {
    task.todos.forEach(todo => {      
      // フィルタリング条件：担当者が選択されているか、未割り当てが表示対象か
      const todoAssigneeId = todo.assigneeId || '';
      const isAssignedToSelectedUser = todoAssigneeId && selectedUserIds.includes(todoAssigneeId);
      const isUnassigned = !todoAssigneeId;
      
      if (!(isAssignedToSelectedUser || (showUnassigned && isUnassigned))) {
        return;
      }
      
      // 日付キーを取得
      const dateKey = format(new Date(todo.calendarStartDateTime), 'yyyy-MM-dd');
      
      if (!todosByDate.has(dateKey)) {
        todosByDate.set(dateKey, []);
      }
      
      // TodoWithMetaオブジェクトを作成
      todosByDate.get(dateKey)?.push({
        todo: {
          ...todo,
          estimatedHours: Math.min(todo.estimatedHours, BUSINESS_HOURS.MAX_HOURS),
        },
        taskId: task.id,
        taskTitle: task.title,
        priority: 0,
        isNextTodo: false
      });
    });
  });
  
  // 処理結果のログ出力
  const dateKeys = Array.from(todosByDate.keys());
  
  // 今日の日付の未完了TODOで最優先のものをNEXTTODOとしてマーク
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTodos = todosByDate.get(todayStr);
  if (todayTodos) {
    const incompleteTodo = todayTodos.find(item => !item.todo.completed);
    if (incompleteTodo) {
      incompleteTodo.isNextTodo = true;
    }
  }
  
  return todosByDate;
};

/**
 * 指定された日付のTODOを整理する
 */
export const organizeTodosForDate = (todos: Todo[], date: Date): Todo[] => {
  // 指定された日付のTODOをフィルタリング
  const todosForDate = todos.filter(todo => {
    const todoDate = todo.calendarStartDateTime instanceof Date
      ? todo.calendarStartDateTime
      : new Date(todo.calendarStartDateTime);
    return todoDate.toDateString() === date.toDateString();
  });

  // 完了済みのTODOは現状の時間を維持
  const completedTodos = todosForDate.filter(todo => todo.completed);
  const uncompletedTodos = todosForDate.filter(todo => !todo.completed);

  // 未完了のTODOを開始時間でソート
  const sortedTodos = uncompletedTodos.sort((a, b) => {
    const aStart = a.calendarStartDateTime instanceof Date
      ? a.calendarStartDateTime
      : new Date(a.calendarStartDateTime);
    const bStart = b.calendarStartDateTime instanceof Date
      ? b.calendarStartDateTime
      : new Date(b.calendarStartDateTime);
    return aStart.getTime() - bStart.getTime();
  });

  let currentDateTime = new Date(date);
  currentDateTime.setHours(BUSINESS_HOURS.START_HOUR, 0, 0, 0);
  const organizedTodos: Todo[] = [];

  // 未完了のTODOを順番に整理
  for (const todo of sortedTodos) {
    const estimatedHours = todo.estimatedHours || 1;
    
    // 15分単位で時間を計算
    const startHour = currentDateTime.getHours();
    const startMinutes = currentDateTime.getMinutes();
    const estimatedMinutes = Math.round(estimatedHours * 60);
    
    let endDateTime = new Date(currentDateTime);
    let endHour = startHour;
    let endMinutes = startMinutes + estimatedMinutes;
    
    // 分が60を超える場合は時間に繰り上げ
    endHour += Math.floor(endMinutes / 60);
    endMinutes = endMinutes % 60;
    
    endDateTime.setHours(endHour, endMinutes, 0, 0);

    // 営業時間を超える場合は翌日に
    if (endDateTime.getHours() > BUSINESS_HOURS.END_HOUR || 
        (endDateTime.getHours() === BUSINESS_HOURS.END_HOUR && endDateTime.getMinutes() > 0)) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(BUSINESS_HOURS.START_HOUR, 0, 0, 0);
      
      currentDateTime = nextDay;
      endDateTime = new Date(nextDay);
      endDateTime.setHours(BUSINESS_HOURS.START_HOUR + Math.floor(estimatedHours));
      endDateTime.setMinutes(Math.round((estimatedHours % 1) * 60));
    }
    
    organizedTodos.push({
      ...todo,
      calendarStartDateTime: new Date(currentDateTime),
      calendarEndDateTime: endDateTime
    });

    // 次のTODOの開始時間を設定
    currentDateTime = new Date(endDateTime);
  }

  // 完了済みのTODOと未完了のTODOを結合
  return [...completedTodos, ...organizedTodos];
};

// 選択された日付のTODOをフィルタリングする関数
export function filterTodosForSelectedDate(
  todos: Todo[], 
  selectedDate: Date, 
  selectedUserIds: string[], 
  showUnassigned: boolean
): Todo[] {
  // 選択された日付の開始と終了
  const startDate = startOfDay(selectedDate);
  const endDate = endOfDay(selectedDate);

  return todos.filter(todo => {
    // 日付でフィルタリング - カレンダー表示用の日時が選択日の範囲内かチェック
    const isInSelectedDateRange = isWithinInterval(todo.calendarStartDateTime, {
      start: startDate,
      end: endDate
    });

    // ユーザー/未アサインでフィルタリング
    const todoAssigneeId = todo.assigneeId || '';
    const isAssignedToSelectedUser = todoAssigneeId && selectedUserIds.includes(todoAssigneeId);
    const isUnassigned = !todoAssigneeId;

    // 日付の条件を満たし、かつ（選択ユーザーに割り当てられているか、未割り当てで表示設定がONの場合）
    return isInSelectedDateRange && (isAssignedToSelectedUser || (isUnassigned && showUnassigned));
  });
}

// 指定された期間内のTODOを取得する関数
export function getTodosInDateRange(todos: Todo[], startDate: Date, endDate: Date): Todo[] {
  return todos.filter(todo => {
    // TODO開始時刻が指定期間内にあるかチェック
    return isWithinInterval(todo.calendarStartDateTime, {
      start: startOfDay(startDate),
      end: endOfDay(endDate)
    });
  });
}

// タスクからTODOを抽出し、親タスク情報も含めた形で返す関数
export function flattenTasksToTodos(tasks: Task[]): (Todo & { taskId: string; taskTitle: string })[] {
  return tasks.flatMap(task => 
    task.todos.map(todo => ({
      ...todo,
      taskId: task.id,
      taskTitle: task.title
    }))
  );
} 