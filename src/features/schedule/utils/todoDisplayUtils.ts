import { TodoWithMeta } from '../types/schedule';
import { BUSINESS_HOURS } from '@/utils/constants/constants';

/**
 * 重複するTODOをグループ化する関数
 * @param todosForHour ある時間枠のTODOリスト
 * @returns グループ化されたTODOリスト
 */
export const groupOverlappingTodos = (todosForHour: TodoWithMeta[]): TodoWithMeta[][] => {
  const todoGroups: TodoWithMeta[][] = [];
  
  todosForHour.forEach(todo => {
    let added = false;
    for (const group of todoGroups) {
      // 重複チェック - 時間が重なっているかどうか
      const hasOverlap = group.some(existingTodo => {
        const start1 = new Date(todo.todo.calendarStartDateTime!).getTime();
        const end1 = new Date(todo.todo.calendarEndDateTime!).getTime();
        const start2 = new Date(existingTodo.todo.calendarStartDateTime!).getTime();
        const end2 = new Date(existingTodo.todo.calendarEndDateTime!).getTime();
        
        // 時間が重なっている場合はtrue
        return (start1 < end2 || end1 > start2);
      });
      
      // 重複がない場合のみ、このグループに追加
      if (!hasOverlap) {
        group.push(todo);
        added = true;
        break;
      }
    }
    if (!added) {
      // 新しいグループを作成
      todoGroups.push([todo]);
    }
  });
  
  return todoGroups;
};

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
    if (hour >= BUSINESS_HOURS.BREAK_START && hour < BUSINESS_HOURS.BREAK_END) continue;
    
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