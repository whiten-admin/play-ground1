import { format } from 'date-fns';
import { TodoWithMeta, TodoGroup } from '../types/schedule';
import { BUSINESS_HOURS } from '@/utils/constants/constants';

/**
 * 重複するTodoをグループ化して配列で返す
 * @param todos Todoの配列
 * @returns グループ化されたTodoの配列
 */
export function groupOverlappingTodos(todos: TodoWithMeta[]): TodoGroup[] {
  if (!todos || todos.length === 0) return [];
  
  // 重複を検出してグループ化
  const groups: TodoGroup[] = [];
  const todosCopy = [...todos];
  
  while (todosCopy.length > 0) {
    const currentTodo = todosCopy.shift();
    if (!currentTodo) continue;
    
    const currentGroup: TodoWithMeta[] = [currentTodo];
    
    // このTodoと重複する他のTodoを探す
    for (let i = todosCopy.length - 1; i >= 0; i--) {
      const otherTodo = todosCopy[i];
      if (todoOverlaps(currentTodo, otherTodo)) {
        currentGroup.push(todosCopy.splice(i, 1)[0]);
      }
    }
    
    // グループを追加
    groups.push({ todos: currentGroup });
  }
  
  return groups;
}

/**
 * TODOの表示位置・サイズを計算する関数
 * @param todo TODO
 * @param quarterHeight 15分の高さ（ピクセル）
 * @returns 位置とサイズ情報
 */
export const calculateTodoPosition = (todo: TodoWithMeta, quarterHeight: number) => {
  if (!todo.todo.calendarStartDateTime || !todo.todo.calendarEndDateTime) {
    return { top: 0, height: 0 };
  }
  
  const startDateTime = new Date(todo.todo.calendarStartDateTime);
  const endDateTime = new Date(todo.todo.calendarEndDateTime);
  const startMinutes = startDateTime.getMinutes();
  const startHour = startDateTime.getHours();
  const endMinutes = endDateTime.getMinutes();
  const endHour = endDateTime.getHours();
  
  const top = Math.floor(startMinutes / 15) * quarterHeight;
  const totalMinutes = (endHour - startHour) * 60 + (endMinutes - startMinutes);
  const height = Math.ceil(totalMinutes / 15) * quarterHeight;
  
  return { top, height };
};

/**
 * 時間オプションを生成する関数
 * @returns 時間オプションの配列（例：["09:00", "09:15", ...])
 */
export const generateTimeOptions = (): string[] => {
  const options: string[] = [];
  for (let hour = BUSINESS_HOURS.START_HOUR; hour <= BUSINESS_HOURS.END_HOUR; hour++) {
    // 休憩時間もオプションに含める
    for (let minute = 0; minute < 60; minute += 15) {
      options.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return options;
};

/**
 * ある時間帯に表示すべきTODOを抽出する関数
 * @param hour 時間帯
 * @param todosForDay その日のTODOリスト
 * @returns その時間帯に表示すべきTODOリスト
 */
export const filterTodosForHour = (hour: number, todosForDay: TodoWithMeta[]): TodoWithMeta[] => {
  return todosForDay.filter(todoWithMeta => {
    const { todo } = todoWithMeta;
    if (!todo.calendarStartDateTime || !todo.calendarEndDateTime) return false;

    const startDateTime = new Date(todo.calendarStartDateTime);
    const todoStartHour = startDateTime.getHours();

    // その時間帯が開始時間と一致する場合のみ表示
    return todoStartHour === hour;
  });
};

/**
 * TODOが重複するかどうかをチェックする関数
 * @param todo1 最初のTodo
 * @param todo2 2番目のTodo
 * @returns 重複する場合はtrue、しない場合はfalse
 */
function todoOverlaps(todo1: TodoWithMeta, todo2: TodoWithMeta): boolean {
  const start1 = new Date(todo1.todo.calendarStartDateTime!).getTime();
  const end1 = new Date(todo1.todo.calendarEndDateTime!).getTime();
  const start2 = new Date(todo2.todo.calendarStartDateTime!).getTime();
  const end2 = new Date(todo2.todo.calendarEndDateTime!).getTime();
  
  // 時間が重なっている場合はtrue
  return (start1 < end2 && end1 > start2);
} 