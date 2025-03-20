import { Task, Todo } from '@/types/task';
import { format, startOfDay, addDays, addHours, setHours, isWeekend } from 'date-fns';
import { BUSINESS_HOURS } from './constants';
import { saveSeedDataToLocalStorage } from './seedDataUtils';

const MAX_DAILY_HOURS = 8; // 1日の最大工数

/**
 * 期日でTODOをソートする
 */
const sortTodosByDueDate = (todos: Todo[]): Todo[] => {
  return [...todos].sort((a, b) => {
    const aDate = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate);
    const bDate = b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate);
    return aDate.getTime() - bDate.getTime();
  });
};

/**
 * 日付に基づいて適切な開始時間を取得する
 * @param date 日付
 * @param hour 希望する時間
 * @returns 適切な開始時間（休憩時間を避ける）
 */
const getAppropriateHour = (date: Date, hour: number): number => {
  // 営業時間外の場合は営業開始時間に設定
  if (hour < BUSINESS_HOURS.START_HOUR || hour > BUSINESS_HOURS.END_HOUR) {
    return BUSINESS_HOURS.START_HOUR;
  }
  
  // 休憩時間内の場合は休憩後に設定
  if (hour >= BUSINESS_HOURS.BREAK_START && hour < BUSINESS_HOURS.BREAK_END) {
    return BUSINESS_HOURS.BREAK_END;
  }
  
  return hour;
};

/**
 * 期日に基づいてTODOをスケジュールし、plannedStartDateを設定する
 * @param tasks タスクのリスト
 * @returns 更新されたタスクのリスト
 */
export const scheduleTodosByDueDate = (tasks: Task[]): Task[] => {
  // 日付ごとの割り当て済み工数を管理するマップ
  const dailyHours = new Map<string, number>();
  
  // 更新対象のタスクをディープコピー
  const updatedTasks = JSON.parse(JSON.stringify(tasks)) as Task[];
  
  // JSONによる変換でDateオブジェクトが文字列になるので、再度Dateオブジェクトに変換
  updatedTasks.forEach(task => {
    task.todos.forEach(todo => {
      // dueDateをDateオブジェクトに変換
      todo.dueDate = new Date(todo.dueDate);
      // plannedStartDateが存在する場合はDateオブジェクトに変換
      if (todo.plannedStartDate) {
        todo.plannedStartDate = new Date(todo.plannedStartDate);
      }
    });
  });
  
  // 全タスクのTODOを日付でソートしたリストを作成
  const allTodos: { todo: Todo; taskIndex: number }[] = [];
  
  updatedTasks.forEach((task, taskIndex) => {
    const sortedTodos = sortTodosByDueDate(task.todos);
    sortedTodos.forEach(todo => {
      allTodos.push({ todo, taskIndex });
    });
  });
  
  // 日付順、同じ日付内では優先度順にソート
  allTodos.sort((a, b) => {
    const aDate = a.todo.dueDate instanceof Date ? a.todo.dueDate : new Date(a.todo.dueDate);
    const bDate = b.todo.dueDate instanceof Date ? b.todo.dueDate : new Date(b.todo.dueDate);
    
    // 日付が異なる場合は日付順
    if (aDate.getTime() !== bDate.getTime()) {
      return aDate.getTime() - bDate.getTime();
    }
    
    // 日付が同じ場合は親タスクの優先度順
    const aTask = updatedTasks[a.taskIndex];
    const bTask = updatedTasks[b.taskIndex];
    return (bTask.priority || 0) - (aTask.priority || 0);
  });
  
  // 各TODOをスケジュール
  allTodos.forEach(({ todo, taskIndex }) => {
    let startDate: Date;
    
    // 開始日を決定
    if (todo.plannedStartDate) {
      startDate = todo.plannedStartDate;
    } else if (todo.startDate) {
      startDate = new Date(todo.startDate);
    } else {
      startDate = new Date(todo.dueDate);
    }
    
    // 過去日の場合は今日からスケジュール
    if (startDate < startOfDay(new Date())) {
      startDate = startOfDay(new Date());
    }
    
    let currentDate = startOfDay(startDate);
    let remainingHours = todo.estimatedHours;
    
    // 日付文字列の形式を統一
    const getDateKey = (date: Date) => format(date, 'yyyy-MM-dd');
    
    // 残りの工数がなくなるまでスケジュール
    while (remainingHours > 0) {
      const dateKey = getDateKey(currentDate);
      
      // 日付ごとの割り当て済み工数を取得
      const currentDailyHours = dailyHours.get(dateKey) || 0;
      
      // 今日の残り工数を計算
      const availableHours = MAX_DAILY_HOURS - currentDailyHours;
      
      if (availableHours > 0) {
        // 割り当て可能な工数
        const allocatedHours = Math.min(availableHours, remainingHours);
        
        // 開始時間を計算
        let startHour = BUSINESS_HOURS.START_HOUR + currentDailyHours;
        
        // 休憩時間をまたぐ場合は調整
        if (startHour < BUSINESS_HOURS.BREAK_START && 
            startHour + allocatedHours > BUSINESS_HOURS.BREAK_START) {
          // 休憩前に可能な工数
          const beforeBreakHours = BUSINESS_HOURS.BREAK_START - startHour;
          
          if (beforeBreakHours > 0) {
            // 休憩前に割り当て
            const originalTodo = updatedTasks[taskIndex].todos.find(t => t.id === todo.id);
            if (originalTodo) {
              originalTodo.plannedStartDate = setHours(currentDate, startHour);
              originalTodo.estimatedHours = beforeBreakHours;
              
              // 休憩後に残りを割り当て（新しいTODOとして）
              const afterBreakHours = allocatedHours - beforeBreakHours;
              if (afterBreakHours > 0) {
                const newTodo: Todo = {
                  ...originalTodo,
                  id: `${originalTodo.id}-after-break`,
                  plannedStartDate: setHours(currentDate, BUSINESS_HOURS.BREAK_END),
                  estimatedHours: afterBreakHours,
                  dueDate: new Date(originalTodo.dueDate),
                  startDate: format(currentDate, 'yyyy-MM-dd'),
                  endDate: format(currentDate, 'yyyy-MM-dd')
                };
                updatedTasks[taskIndex].todos.push(newTodo);
              }
            }
          }
        } else {
          // 休憩時間を考慮して開始時間を調整
          if (startHour >= BUSINESS_HOURS.BREAK_START && startHour < BUSINESS_HOURS.BREAK_END) {
            startHour = BUSINESS_HOURS.BREAK_END;
          }
          
          // TODOのplannedStartDateを設定
          const originalTodo = updatedTasks[taskIndex].todos.find(t => t.id === todo.id);
          if (originalTodo) {
            originalTodo.plannedStartDate = setHours(currentDate, startHour);
          } else {
            console.warn(`TODOが見つかりません: ID=${todo.id}`);
          }
        }
        
        // 日付の割り当て済み工数を更新
        dailyHours.set(dateKey, currentDailyHours + allocatedHours);
        
        // 残り工数を減らす
        remainingHours -= allocatedHours;
      }
      
      // 日付を1日進める
      currentDate = addDays(currentDate, 1);
      
      // 週末は飛ばす（オプション）
      while (isWeekend(currentDate)) {
        currentDate = addDays(currentDate, 1);
      }
    }
  });
  
  // 更新されたタスクを返す
  return updatedTasks;
};

/**
 * 期日に基づいてTODOをスケジュールし、ローカルストレージに保存する
 * @param tasks タスクのリスト
 * @returns 更新されたタスクのリスト
 */
export const scheduleAndSaveTasks = (tasks: Task[]): Task[] => {
  try {
    console.log('スケジュールを開始します...');
    const updatedTasks = scheduleTodosByDueDate(tasks);
    console.log('スケジュールが完了しました。ローカルストレージに保存します...');
    saveSeedDataToLocalStorage(updatedTasks);
    return updatedTasks;
  } catch (error) {
    console.error('スケジューリング中にエラーが発生しました:', error);
    throw error; // 上位のハンドラーに再スローして処理を継続
  }
};
